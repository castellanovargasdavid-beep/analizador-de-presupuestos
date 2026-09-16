"use server";

/**
 * Intervenciones de administrador sobre el ciclo de vida de un lead que van
 * más allá del editor rápido de `actions.ts`: reasignación manual (con
 * motivo obligatorio, igual que la automática) y pausa/reanudación del
 * plazo activo. Ambas pasan por los mismos servicios que usa la
 * automatización (`reassignLead`, `recordLeadNote`) para que quede la misma
 * traza de auditoría, nunca un `db.update` aparte.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAudit } from "@/lib/admin/audit";
import { recordLeadNote } from "@/lib/leads/lifecycle-service";
import { reassignLead } from "@/lib/leads/reassignment-service";
import { toSafeError, type ErrorKind } from "@/lib/errors/safe-message";

export interface ActionResult {
  ok: boolean;
  error?: string;
  errorKind?: ErrorKind;
}

const reassignSchema = z.object({
  leadId: z.string().uuid(),
  reason: z.string().trim().min(10, "Explica el motivo de la reasignación (mínimo 10 caracteres)").max(500),
});

export async function adminReassignLeadAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = reassignSchema.safeParse({
    leadId: formData.get("leadId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await reassignLead(parsed.data.leadId, parsed.data.reason, "admin");
    await recordAudit({
      action: "update",
      entityType: "lead",
      entityId: parsed.data.leadId,
      summary: `Reasignación manual: ${parsed.data.reason}`,
    });
  } catch (err) {
    const safe = toSafeError(err, "adminReassignLeadAction", "No se ha podido reasignar este lead.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath(`/admin/leads/${parsed.data.leadId}`);
  revalidatePath("/admin/leads");
  return { ok: true };
}

const pauseSchema = z.object({
  leadId: z.string().uuid(),
  reason: z.string().trim().min(3, "Indica el motivo de la pausa").max(500),
  hours: z.coerce.number().int().min(1).max(720),
});

export async function adminPauseDeadlineAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = pauseSchema.safeParse({
    leadId: formData.get("leadId"),
    reason: formData.get("reason"),
    hours: formData.get("hours"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    const pausedUntil = new Date(Date.now() + parsed.data.hours * 60 * 60 * 1000);
    await recordLeadNote({
      leadId: parsed.data.leadId,
      actorType: "admin",
      reason: `Plazo pausado manualmente: ${parsed.data.reason}`,
      extraFields: { deadlinePausedUntil: pausedUntil, deadlinePauseReason: parsed.data.reason },
    });
    await recordAudit({
      action: "update",
      entityType: "lead",
      entityId: parsed.data.leadId,
      summary: `Plazo pausado manualmente hasta ${pausedUntil.toISOString()}: ${parsed.data.reason}`,
    });
  } catch (err) {
    const safe = toSafeError(err, "adminPauseDeadlineAction", "No se ha podido pausar el plazo.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath(`/admin/leads/${parsed.data.leadId}`);
  return { ok: true };
}

export async function adminResumeDeadlineAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const leadId = formData.get("leadId");
  if (typeof leadId !== "string") {
    return { ok: false, errorKind: "validation", error: "Falta el identificador del lead." };
  }

  try {
    await recordLeadNote({
      leadId,
      actorType: "admin",
      reason: "Pausa del plazo levantada manualmente.",
      extraFields: { deadlinePausedUntil: null, deadlinePauseReason: null },
    });
    await recordAudit({
      action: "update",
      entityType: "lead",
      entityId: leadId,
      summary: "Pausa del plazo levantada manualmente.",
    });
  } catch (err) {
    const safe = toSafeError(err, "adminResumeDeadlineAction", "No se ha podido reanudar el plazo.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true };
}
