"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { cities, provinces, regions } from "@/db/schema";
import { recordAudit } from "@/lib/admin/audit";
import { toSafeError, type ErrorKind } from "@/lib/errors/safe-message";
import { cityFormSchema, provinceFormSchema, regionFormSchema } from "./validation";

export interface ActionResult {
  ok: boolean;
  error?: string;
  errorKind?: ErrorKind;
}

export async function saveRegionAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = regionFormSchema.safeParse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    if (parsed.data.id) {
      await db.update(regions).set(parsed.data).where(eq(regions.id, parsed.data.id));
      await recordAudit({ action: "update", entityType: "region", entityId: parsed.data.id, summary: `Editada región "${parsed.data.name}"` });
    } else {
      const [row] = await db.insert(regions).values(parsed.data).returning({ id: regions.id });
      await recordAudit({ action: "create", entityType: "region", entityId: row.id, summary: `Creada región "${parsed.data.name}"` });
    }
  } catch (err) {
    const safe = toSafeError(err, "saveRegionAction", "No se ha podido guardar la región.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/admin/regiones");
  return { ok: true };
}

export async function saveProvinceAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = provinceFormSchema.safeParse({
    id: formData.get("id") || undefined,
    regionId: formData.get("regionId"),
    slug: formData.get("slug"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    if (parsed.data.id) {
      await db.update(provinces).set(parsed.data).where(eq(provinces.id, parsed.data.id));
      await recordAudit({ action: "update", entityType: "province", entityId: parsed.data.id, summary: `Editada provincia "${parsed.data.name}"` });
    } else {
      const [row] = await db.insert(provinces).values(parsed.data).returning({ id: provinces.id });
      await recordAudit({ action: "create", entityType: "province", entityId: row.id, summary: `Creada provincia "${parsed.data.name}"` });
    }
  } catch (err) {
    const safe = toSafeError(err, "saveProvinceAction", "No se ha podido guardar la provincia.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/admin/provincias");
  return { ok: true };
}

export async function saveCityAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = cityFormSchema.safeParse({
    id: formData.get("id") || undefined,
    provinceId: formData.get("provinceId"),
    slug: formData.get("slug"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    if (parsed.data.id) {
      await db.update(cities).set(parsed.data).where(eq(cities.id, parsed.data.id));
      await recordAudit({ action: "update", entityType: "city", entityId: parsed.data.id, summary: `Editada ciudad "${parsed.data.name}"` });
    } else {
      const [row] = await db.insert(cities).values(parsed.data).returning({ id: cities.id });
      await recordAudit({ action: "create", entityType: "city", entityId: row.id, summary: `Creada ciudad "${parsed.data.name}"` });
    }
  } catch (err) {
    const safe = toSafeError(err, "saveCityAction", "No se ha podido guardar la ciudad.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/admin/ciudades");
  return { ok: true };
}
