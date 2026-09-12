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

export async function updateLeadAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = leadUpdateFormSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    assignedProfessionalId: formData.get("assignedProfessionalId"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await db
      .update(leads)
      .set({
        status: parsed.data.status,
        assignedProfessionalId: parsed.data.assignedProfessionalId ?? null,
      })
      .where(eq(leads.id, parsed.data.id));
    await recordAudit({
      action: "update",
      entityType: "lead",
      entityId: parsed.data.id,
      summary: `Lead actualizado a estado "${parsed.data.status}"${parsed.data.assignedProfessionalId ? " con profesional asignado" : ""}`,
    });
  } catch (err) {
    const safe = toSafeError(err, "updateLeadAction", "No se ha podido actualizar el lead.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/admin/leads");
  return { ok: true };
}
