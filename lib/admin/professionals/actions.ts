"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { professionalServiceAreas, professionals } from "@/db/schema";
import { recordAudit } from "@/lib/admin/audit";
import { toSafeError, type ErrorKind } from "@/lib/errors/safe-message";
import { hashPassword } from "@/lib/professional/auth";
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
    maxConcurrentLeads: formData.get("maxConcurrentLeads") || undefined,
    newPassword: formData.get("newPassword"),
    pauseReason: formData.get("pauseReason"),
    pauseHours: formData.get("pauseHours") || undefined,
    resumeNow: formData.get("resumeNow") === "on",
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const data = parsed.data;

  // Pausa manual desde el admin: horas > 0 extiende/fija la pausa desde ahora;
  // `resumeNow` la levanta explícitamente; si no se toca ninguna de las dos,
  // no se modifica una pausa ya existente (p.ej. al editar solo las notas).
  const pauseUpdate: { pausedUntil?: Date | null; pauseReason?: string | null } = {};
  if (data.resumeNow) {
    pauseUpdate.pausedUntil = null;
    pauseUpdate.pauseReason = null;
  } else if (data.pauseHours > 0) {
    pauseUpdate.pausedUntil = new Date(Date.now() + data.pauseHours * 60 * 60 * 1000);
    pauseUpdate.pauseReason = data.pauseReason ?? null;
  }

  try {
    const passwordHash = data.newPassword ? await hashPassword(data.newPassword) : undefined;

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
          maxConcurrentLeads: data.maxConcurrentLeads,
          ...pauseUpdate,
          ...(passwordHash ? { passwordHash } : {}),
        })
        .where(eq(professionals.id, data.id));
      await recordAudit({
        action: "update",
        entityType: "professional",
        entityId: data.id,
        summary: `Editado profesional "${data.name}" (${data.verificationStatus}${data.isActive ? ", activo" : ", inactivo"}${passwordHash ? ", contraseña restablecida" : ""})`,
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
          maxConcurrentLeads: data.maxConcurrentLeads,
          pausedUntil: pauseUpdate.pausedUntil ?? null,
          pauseReason: pauseUpdate.pauseReason ?? null,
          passwordHash: passwordHash ?? null,
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
