"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { professionalServiceAreas, professionals } from "@/db/schema";
import { recordAudit } from "@/lib/admin/audit";
import { toSafeError, type ErrorKind } from "@/lib/errors/safe-message";
import { professionalFormSchema, serviceAreaFormSchema } from "./validation";

export interface ActionResult {
  ok: boolean;
  error?: string;
  errorKind?: ErrorKind;
}

export async function saveProfessionalAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = professionalFormSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    verificationStatus: formData.get("verificationStatus"),
    isActive: formData.get("isActive") === "on",
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const data = parsed.data;

  try {
    if (data.id) {
      await db
        .update(professionals)
        .set({
          name: data.name,
          email: data.email,
          phone: data.phone ?? null,
          verificationStatus: data.verificationStatus,
          isActive: data.isActive,
          notes: data.notes ?? null,
        })
        .where(eq(professionals.id, data.id));
      await recordAudit({
        action: "update",
        entityType: "professional",
        entityId: data.id,
        summary: `Editado profesional "${data.name}" (${data.verificationStatus}${data.isActive ? ", activo" : ", inactivo"})`,
      });
    } else {
      const [row] = await db
        .insert(professionals)
        .values({
          name: data.name,
          email: data.email,
          phone: data.phone ?? null,
          verificationStatus: data.verificationStatus,
          isActive: data.isActive,
          notes: data.notes ?? null,
        })
        .returning({ id: professionals.id });
      await recordAudit({
        action: "create",
        entityType: "professional",
        entityId: row.id,
        summary: `Creado profesional "${data.name}"`,
      });
    }
  } catch (err) {
    const safe = toSafeError(err, "saveProfessionalAction", "No se ha podido guardar el profesional.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/admin/profesionales");
  return { ok: true };
}

export async function addServiceAreaAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = serviceAreaFormSchema.safeParse({
    professionalId: formData.get("professionalId"),
    serviceTypeId: formData.get("serviceTypeId"),
    regionId: formData.get("regionId"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const data = parsed.data;

  try {
    await db.insert(professionalServiceAreas).values({
      professionalId: data.professionalId,
      serviceTypeId: data.serviceTypeId,
      regionId: data.regionId ?? null,
    });
    await recordAudit({
      action: "create",
      entityType: "professional_service_area",
      entityId: data.professionalId,
      summary: `Añadida zona de cobertura al profesional ${data.professionalId}`,
    });
  } catch (err) {
    const safe = toSafeError(err, "addServiceAreaAction", "No se ha podido añadir la zona de cobertura.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath(`/admin/profesionales/${data.professionalId}`);
  return { ok: true };
}

export async function removeServiceAreaAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const areaId = formData.get("areaId");
  const professionalId = formData.get("professionalId");
  if (typeof areaId !== "string" || typeof professionalId !== "string") {
    return { ok: false, errorKind: "validation", error: "Falta el identificador de la zona." };
  }

  try {
    await db.delete(professionalServiceAreas).where(eq(professionalServiceAreas.id, areaId));
    await recordAudit({
      action: "delete",
      entityType: "professional_service_area",
      entityId: areaId,
      summary: `Eliminada zona de cobertura del profesional ${professionalId}`,
    });
  } catch (err) {
    const safe = toSafeError(err, "removeServiceAreaAction", "No se ha podido eliminar la zona de cobertura.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath(`/admin/profesionales/${professionalId}`);
  return { ok: true };
}
