"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { leads } from "@/db/schema";
import { recordAudit } from "@/lib/admin/audit";
import { toSafeError, type ErrorKind } from "@/lib/errors/safe-message";
import { leadUpdateFormSchema } from "./validation";

export interface ActionResult {
  ok: boolean;
  error?: string;
  errorKind?: ErrorKind;
}

/**
 * Cada transición de estado registra su marca de tiempo la primera vez que
 * ocurre (no se reescribe si ya estaba puesta, para no perder cuándo pasó
 * realmente si el admin vuelve a guardar el mismo estado). Es manual porque
 * el emparejamiento con un profesional real todavía lo decide una persona,
 * no un algoritmo.
 */
export async function updateLeadAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  // formData.get() devuelve `null` (no `undefined`) cuando el campo no está
  // en el formulario — por ejemplo los campos que solo se muestran para
  // ciertos estados (discardReason, incidentNotes, paymentAmount). Zod
  // `.optional()` solo acepta `undefined`, nunca `null`, así que sin este
  // `?? undefined` la validación fallaba en silencio cada vez que uno de
  // esos campos condicionales no estaba presente.
  const field = (name: string) => formData.get(name) ?? undefined;
  const parsed = leadUpdateFormSchema.safeParse({
    id: field("id"),
    status: field("status"),
    assignedProfessionalId: field("assignedProfessionalId"),
    discardReason: field("discardReason"),
    contactOutcome: field("contactOutcome"),
    agreedPrice: field("agreedPrice"),
    paymentStatus: field("paymentStatus"),
    paymentAmount: field("paymentAmount"),
    incidentNotes: field("incidentNotes"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const data = parsed.data;

  try {
    const [existing] = await db.select().from(leads).where(eq(leads.id, data.id)).limit(1);
    if (!existing) {
      return { ok: false, errorKind: "unknown", error: "No se encuentra este lead." };
    }

    const now = new Date();
    await db
      .update(leads)
      .set({
        status: data.status,
        assignedProfessionalId: data.assignedProfessionalId ?? null,
        discardReason: data.status === "descartado" ? (data.discardReason ?? null) : null,
        contactOutcome: data.contactOutcome ?? existing.contactOutcome,
        agreedPrice: data.agreedPrice ?? existing.agreedPrice,
        paymentStatus: data.paymentStatus,
        paymentAmount: data.paymentAmount ?? existing.paymentAmount,
        incidentNotes: data.status === "con_incidencia" ? (data.incidentNotes ?? null) : existing.incidentNotes,
        validatedAt: existing.validatedAt ?? (data.status === "validado" ? now : null),
        assignedAt: existing.assignedAt ?? (data.status === "asignado" ? now : null),
        sentToProfessionalAt: existing.sentToProfessionalAt ?? (data.status === "enviado" ? now : null),
        contactedAt: existing.contactedAt ?? (data.status === "contactado" ? now : null),
        paymentRegisteredAt:
          existing.paymentRegisteredAt ?? (data.paymentStatus === "pagado" ? now : null),
      })
      .where(eq(leads.id, data.id));

    await recordAudit({
      action: "update",
      entityType: "lead",
      entityId: data.id,
      summary: `Lead actualizado a estado "${data.status}"${data.assignedProfessionalId ? " con profesional asignado" : ""}${data.paymentStatus !== "no_aplica" ? `, pago: ${data.paymentStatus}` : ""}`,
    });
  } catch (err) {
    const safe = toSafeError(err, "updateLeadAction", "No se ha podido actualizar el lead.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/admin/leads");
  revalidatePath("/admin/profesionales");
  revalidatePath("/admin");
  return { ok: true };
}
