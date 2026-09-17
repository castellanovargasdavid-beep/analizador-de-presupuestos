"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { materialLevels, professions, serviceCategories, serviceTypes } from "@/db/schema";
import { recordAudit } from "@/lib/admin/audit";
import { toSafeError, type ErrorKind } from "@/lib/errors/safe-message";
import { catalogProfessionFormSchema, categoryFormSchema, materialLevelFormSchema, serviceFormSchema } from "./validation";

export interface ActionResult {
  ok: boolean;
  error?: string;
  errorKind?: ErrorKind;
}

function parseBool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

export async function saveCategoryAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = categoryFormSchema.safeParse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description"),
    iconKey: formData.get("iconKey"),
    isActive: parseBool(formData, "isActive"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    if (parsed.data.id) {
      await db.update(serviceCategories).set(parsed.data).where(eq(serviceCategories.id, parsed.data.id));
      await recordAudit({ action: "update", entityType: "service_category", entityId: parsed.data.id, summary: `Editada categoría "${parsed.data.name}"` });
    } else {
      const [row] = await db.insert(serviceCategories).values(parsed.data).returning({ id: serviceCategories.id });
      await recordAudit({ action: "create", entityType: "service_category", entityId: row.id, summary: `Creada categoría "${parsed.data.name}"` });
    }
  } catch (err) {
    const safe = toSafeError(err, "saveCategoryAction", "No se ha podido guardar la categoría.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/admin/categorias");
  return { ok: true };
}

export async function saveServiceAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = serviceFormSchema.safeParse({
    id: formData.get("id") || undefined,
    categoryId: formData.get("categoryId"),
    professionId: formData.get("professionId"),
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description"),
    unitLabel: formData.get("unitLabel"),
    vatReducedEligible: parseBool(formData, "vatReducedEligible"),
    availabilityStatus: formData.get("availabilityStatus"),
    isActive: parseBool(formData, "isActive"),
    whatIncluded: formData.get("whatIncluded"),
    whatExcluded: formData.get("whatExcluded"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    if (parsed.data.id) {
      await db.update(serviceTypes).set(parsed.data).where(eq(serviceTypes.id, parsed.data.id));
      await recordAudit({ action: "update", entityType: "service_type", entityId: parsed.data.id, summary: `Editado servicio "${parsed.data.name}"` });
    } else {
      const [row] = await db.insert(serviceTypes).values(parsed.data).returning({ id: serviceTypes.id });
      await recordAudit({ action: "create", entityType: "service_type", entityId: row.id, summary: `Creado servicio "${parsed.data.name}"` });
    }
  } catch (err) {
    const safe = toSafeError(err, "saveServiceAction", "No se ha podido guardar el servicio.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/admin/servicios");
  revalidatePath("/servicios");
  revalidatePath("/profesiones");
  revalidatePath("/");
  return { ok: true };
}

export async function saveCatalogProfessionAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = catalogProfessionFormSchema.safeParse({
    id: formData.get("id") || undefined,
    categoryId: formData.get("categoryId"),
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description"),
    iconKey: formData.get("iconKey"),
    status: formData.get("status"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    if (parsed.data.id) {
      await db.update(professions).set(parsed.data).where(eq(professions.id, parsed.data.id));
      await recordAudit({ action: "update", entityType: "profession", entityId: parsed.data.id, summary: `Editada profesión "${parsed.data.name}"` });
    } else {
      const [row] = await db.insert(professions).values(parsed.data).returning({ id: professions.id });
      await recordAudit({ action: "create", entityType: "profession", entityId: row.id, summary: `Creada profesión "${parsed.data.name}"` });
    }
  } catch (err) {
    const safe = toSafeError(err, "saveCatalogProfessionAction", "No se ha podido guardar la profesión.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/admin/profesiones");
  revalidatePath("/servicios");
  revalidatePath("/profesiones");
  revalidatePath("/");
  return { ok: true };
}

export async function saveMaterialLevelAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = materialLevelFormSchema.safeParse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    if (parsed.data.id) {
      await db.update(materialLevels).set(parsed.data).where(eq(materialLevels.id, parsed.data.id));
      await recordAudit({ action: "update", entityType: "material_level", entityId: parsed.data.id, summary: `Editado material "${parsed.data.name}"` });
    } else {
      const [row] = await db.insert(materialLevels).values(parsed.data).returning({ id: materialLevels.id });
      await recordAudit({ action: "create", entityType: "material_level", entityId: row.id, summary: `Creado material "${parsed.data.name}"` });
    }
  } catch (err) {
    const safe = toSafeError(err, "saveMaterialLevelAction", "No se ha podido guardar el nivel de material.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/admin/materiales");
  return { ok: true };
}
