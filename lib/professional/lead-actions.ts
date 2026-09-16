"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { leadQuotes, leads, professionals } from "@/db/schema";
import { getCurrentProfessionalId } from "./actions";
import { transitionLead, recordLeadNote } from "@/lib/leads/lifecycle-service";
import { computeQuoteDeadline } from "@/lib/leads/deadline-config";
import { reassignLead } from "@/lib/leads/reassignment-service";
import { toSafeError, type ErrorKind } from "@/lib/errors/safe-message";

export interface ActionResult {
  ok: boolean;
  error?: string;
  errorKind?: ErrorKind;
}

const NOT_YOUR_LEAD: ActionResult = { ok: false, errorKind: "validation", error: "Esta solicitud no está asignada a tu cuenta." };
const NOT_AUTHENTICATED: ActionResult = { ok: false, errorKind: "validation", error: "Tu sesión no es válida. Vuelve a iniciar sesión." };

type OwnedLeadResult =
  | { error: ActionResult; lead?: undefined; professionalId?: undefined }
  | { error?: undefined; lead: typeof leads.$inferSelect; professionalId: string };

/** Comprueba que el lead existe y está asignado al profesional autenticado. Nunca confía en un id de lead recibido del cliente sin esta comprobación. */
async function requireOwnedLead(leadId: string): Promise<OwnedLeadResult> {
  const professionalId = await getCurrentProfessionalId();
  if (!professionalId) return { error: NOT_AUTHENTICATED };

  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead || lead.assignedProfessionalId !== professionalId) {
    return { error: NOT_YOUR_LEAD };
  }
  return { lead, professionalId };
}

export async function acceptLeadAction(leadId: string): Promise<ActionResult> {
  const owned = await requireOwnedLead(leadId);
  if (owned.error) return owned.error;

  try {
    const now = new Date();
    await transitionLead({
      leadId,
      toStatus: "aceptado",
      actorType: "profesional",
      actorId: owned.professionalId,
      extraFields: { respondedAt: now, acceptedAt: now },
    });
    await transitionLead({ leadId, toStatus: "contacto_pendiente", actorType: "profesional", actorId: owned.professionalId });
  } catch (err) {
    const safe = toSafeError(err, "acceptLeadAction", "No se ha podido aceptar la solicitud.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/profesional");
  revalidatePath(`/profesional/leads/${leadId}`);
  return { ok: true };
}

const rejectSchema = z.object({ reason: z.string().trim().min(3, "Indica brevemente el motivo").max(500) });

export async function rejectLeadAction(leadId: string, formData: FormData): Promise<ActionResult> {
  const owned = await requireOwnedLead(leadId);
  if (owned.error) return owned.error;

  const parsed = rejectSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await transitionLead({
      leadId,
      toStatus: "rechazado",
      actorType: "profesional",
      actorId: owned.professionalId,
      reason: parsed.data.reason,
      extraFields: { respondedAt: new Date() },
    });
    await reassignLead(leadId, `El profesional rechazó la solicitud: ${parsed.data.reason}`);
  } catch (err) {
    const safe = toSafeError(err, "rejectLeadAction", "No se ha podido rechazar la solicitud.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/profesional");
  return { ok: true };
}

const confirmContactSchema = z.object({
  method: z.string().trim().max(200).optional().transform((v) => v || undefined),
  requiresSiteVisit: z.boolean(),
});

export async function confirmContactAction(leadId: string, formData: FormData): Promise<ActionResult> {
  const owned = await requireOwnedLead(leadId);
  if (owned.error) return owned.error;

  const parsed = confirmContactSchema.safeParse({
    method: formData.get("method"),
    requiresSiteVisit: formData.get("requiresSiteVisit") === "on",
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await transitionLead({
      leadId,
      toStatus: "contacto_confirmado",
      actorType: "profesional",
      actorId: owned.professionalId,
      extraFields: {
        contactConfirmedAt: new Date(),
        contactMethod: parsed.data.method ?? null,
        requiresSiteVisit: parsed.data.requiresSiteVisit,
      },
    });
  } catch (err) {
    const safe = toSafeError(err, "confirmContactAction", "No se ha podido confirmar el contacto.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath(`/profesional/leads/${leadId}`);
  return { ok: true };
}

export async function startQuoteAction(leadId: string): Promise<ActionResult> {
  const owned = await requireOwnedLead(leadId);
  if (owned.error) return owned.error;

  try {
    const now = new Date();
    await transitionLead({
      leadId,
      toStatus: "presupuesto_pendiente",
      actorType: "profesional",
      actorId: owned.professionalId,
      extraFields: { quoteDeadlineAt: computeQuoteDeadline(now) },
    });
  } catch (err) {
    const safe = toSafeError(err, "startQuoteAction", "No se ha podido iniciar el presupuesto.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath(`/profesional/leads/${leadId}`);
  return { ok: true };
}

const quoteSchema = z.object({
  amount: z.coerce.number().min(1, "El importe debe ser mayor que 0").max(1_000_000),
  vatPct: z.coerce.number().min(0).max(1).optional(),
  estimatedDurationDays: z.coerce.number().int().min(0).max(3650).optional(),
  conditions: z.string().trim().max(2000).optional().transform((v) => v || undefined),
  observations: z.string().trim().max(2000).optional().transform((v) => v || undefined),
  validityDays: z.coerce.number().int().min(1).max(365).optional(),
});

export async function submitQuoteAction(leadId: string, formData: FormData): Promise<ActionResult> {
  const owned = await requireOwnedLead(leadId);
  if (owned.error) return owned.error;

  const parsed = quoteSchema.safeParse({
    amount: formData.get("amount"),
    vatPct: formData.get("vatPct") || undefined,
    estimatedDurationDays: formData.get("estimatedDurationDays") || undefined,
    conditions: formData.get("conditions"),
    observations: formData.get("observations"),
    validityDays: formData.get("validityDays") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await db.insert(leadQuotes).values({
      leadId,
      professionalId: owned.professionalId,
      amount: parsed.data.amount,
      vatPct: parsed.data.vatPct ?? null,
      estimatedDurationDays: parsed.data.estimatedDurationDays ?? null,
      conditions: parsed.data.conditions ?? null,
      observations: parsed.data.observations ?? null,
      validityDays: parsed.data.validityDays ?? null,
    });

    await transitionLead({
      leadId,
      toStatus: "presupuesto_enviado",
      actorType: "profesional",
      actorId: owned.professionalId,
      extraFields: { quoteDeadlineAt: null, quoteWarningSentAt: null },
    });
  } catch (err) {
    const safe = toSafeError(err, "submitQuoteAction", "No se ha podido enviar el presupuesto.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath(`/profesional/leads/${leadId}`);
  return { ok: true };
}

const outcomeSchema = z.object({ outcome: z.enum(["ganado", "perdido", "cerrado"]) });

/** Marca el resultado final cuando no hace falta un presupuesto formal (trabajos rápidos, ya cerrados por teléfono...). */
export async function markOutcomeAction(leadId: string, formData: FormData): Promise<ActionResult> {
  const owned = await requireOwnedLead(leadId);
  if (owned.error) return owned.error;

  const parsed = outcomeSchema.safeParse({ outcome: formData.get("outcome") });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: "Resultado no válido." };
  }

  try {
    await transitionLead({ leadId, toStatus: parsed.data.outcome, actorType: "profesional", actorId: owned.professionalId });
  } catch (err) {
    const safe = toSafeError(err, "markOutcomeAction", "No se ha podido registrar el resultado.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath(`/profesional/leads/${leadId}`);
  return { ok: true };
}

const pauseSchema = z.object({
  reason: z.string().trim().min(3, "Indica el motivo de la pausa").max(500),
  hours: z.coerce.number().int().min(1).max(24 * 14),
});

/** Pausa justificada del plazo (visita pendiente, información del usuario, proveedor externo...). Queda registrada, no oculta. */
export async function pauseDeadlineAction(leadId: string, formData: FormData): Promise<ActionResult> {
  const owned = await requireOwnedLead(leadId);
  if (owned.error) return owned.error;

  const parsed = pauseSchema.safeParse({ reason: formData.get("reason"), hours: formData.get("hours") });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const until = new Date(Date.now() + parsed.data.hours * 60 * 60 * 1000);

  try {
    await recordLeadNote({
      leadId,
      actorType: "profesional",
      actorId: owned.professionalId,
      reason: `Pausa de plazo solicitada: ${parsed.data.reason}`,
      metadata: { pausedUntil: until.toISOString() },
      extraFields: { deadlinePausedUntil: until, deadlinePauseReason: parsed.data.reason },
    });
  } catch (err) {
    const safe = toSafeError(err, "pauseDeadlineAction", "No se ha podido registrar la pausa.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath(`/profesional/leads/${leadId}`);
  return { ok: true };
}

const availabilitySchema = z.object({
  paused: z.boolean(),
  reason: z.string().trim().max(500).optional().transform((v) => v || undefined),
  hours: z.coerce.number().int().min(1).max(24 * 90).optional(),
});

/** Pausa general del profesional (vacaciones, sobrecarga): mientras esté activa, no recibe NINGUNA asignación nueva. */
export async function updateAvailabilityAction(formData: FormData): Promise<ActionResult> {
  const professionalId = await getCurrentProfessionalId();
  if (!professionalId) return NOT_AUTHENTICATED;

  const parsed = availabilitySchema.safeParse({
    paused: formData.get("paused") === "on",
    reason: formData.get("reason"),
    hours: formData.get("hours") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await db
      .update(professionals)
      .set({
        pausedUntil: parsed.data.paused && parsed.data.hours ? new Date(Date.now() + parsed.data.hours * 60 * 60 * 1000) : null,
        pauseReason: parsed.data.paused ? (parsed.data.reason ?? null) : null,
        lastActivityAt: new Date(),
      })
      .where(eq(professionals.id, professionalId));
  } catch (err) {
    const safe = toSafeError(err, "updateAvailabilityAction", "No se ha podido actualizar tu disponibilidad.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/profesional");
  return { ok: true };
}
