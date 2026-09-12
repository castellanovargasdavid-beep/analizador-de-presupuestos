"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { dataSources, pricingFactors, pricingRules, uncertaintyBands, vatRates } from "@/db/schema";
import { recordAudit } from "@/lib/admin/audit";
import { toSafeError, type ErrorKind } from "@/lib/errors/safe-message";
import { parseConditionInput } from "@/lib/estimation/condition-schema";
import {
  dataSourceFormSchema,
  pricingFactorFormSchema,
  pricingRuleFormSchema,
  uncertaintyBandFormSchema,
  vatRateFormSchema,
} from "./validation";

export interface ActionResult {
  ok: boolean;
  error?: string;
  errorKind?: ErrorKind;
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

export async function saveDataSourceAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = dataSourceFormSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    url: formData.get("url"),
    sourceType: formData.get("sourceType"),
    confidence: formData.get("confidence"),
    geographicScope: formData.get("geographicScope"),
    publishedOn: formData.get("publishedOn"),
    retrievedOn: formData.get("retrievedOn"),
    notes: formData.get("notes"),
    isActive: bool(formData, "isActive"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    if (parsed.data.id) {
      await db.update(dataSources).set(parsed.data).where(eq(dataSources.id, parsed.data.id));
      await recordAudit({ action: "update", entityType: "data_source", entityId: parsed.data.id, summary: `Editada fuente "${parsed.data.name}"` });
    } else {
      const [row] = await db.insert(dataSources).values(parsed.data).returning({ id: dataSources.id });
      await recordAudit({ action: "create", entityType: "data_source", entityId: row.id, summary: `Creada fuente "${parsed.data.name}"` });
    }
  } catch (err) {
    const safe = toSafeError(err, "saveDataSourceAction", "No se ha podido guardar la fuente.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/admin/fuentes");
  revalidatePath("/fuentes");
  return { ok: true };
}

export async function savePricingRuleAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = pricingRuleFormSchema.safeParse({
    id: formData.get("id") || undefined,
    serviceTypeId: formData.get("serviceTypeId"),
    version: formData.get("version"),
    name: formData.get("name"),
    isActive: bool(formData, "isActive"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    if (parsed.data.id) {
      await db.update(pricingRules).set(parsed.data).where(eq(pricingRules.id, parsed.data.id));
      await recordAudit({ action: "update", entityType: "pricing_rule", entityId: parsed.data.id, summary: `Editada regla "${parsed.data.name}" v${parsed.data.version}` });
    } else {
      const [row] = await db.insert(pricingRules).values(parsed.data).returning({ id: pricingRules.id });
      await recordAudit({ action: "create", entityType: "pricing_rule", entityId: row.id, summary: `Creada regla "${parsed.data.name}" v${parsed.data.version}` });
    }
  } catch (err) {
    const safe = toSafeError(err, "savePricingRuleAction", "No se ha podido guardar la regla de precio.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/admin/reglas-precio");
  return { ok: true };
}

export async function savePricingFactorAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = pricingFactorFormSchema.safeParse({
    id: formData.get("id") || undefined,
    ruleId: formData.get("ruleId"),
    key: formData.get("key"),
    label: formData.get("label"),
    kind: formData.get("kind"),
    groupKey: formData.get("groupKey"),
    perUnitOfQuantity: formData.get("perUnitOfQuantity"),
    valueMin: formData.get("valueMin"),
    valueMax: formData.get("valueMax"),
    conditionRaw: formData.get("conditionRaw"),
    sourceId: formData.get("sourceId"),
    confidence: formData.get("confidence"),
    sortOrder: formData.get("sortOrder"),
    isActive: bool(formData, "isActive"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const condition = parseConditionInput(parsed.data.conditionRaw ?? "");
  if (!condition.ok) {
    return { ok: false, errorKind: "validation", error: condition.error };
  }

  const { id, ruleId, key, label, kind, groupKey, perUnitOfQuantity, valueMin, valueMax, sourceId, confidence, sortOrder, isActive, notes } =
    parsed.data;
  const values = {
    ruleId,
    key,
    label,
    kind,
    groupKey,
    perUnitOfQuantity: perUnitOfQuantity ?? null,
    valueMin,
    valueMax,
    condition: condition.value,
    sourceId: sourceId ?? null,
    confidence,
    sortOrder,
    isActive,
    notes: notes ?? null,
  };

  try {
    if (id) {
      await db.update(pricingFactors).set(values).where(eq(pricingFactors.id, id));
      await recordAudit({ action: "update", entityType: "pricing_factor", entityId: id, summary: `Editado factor "${values.label}"` });
    } else {
      const [row] = await db.insert(pricingFactors).values(values).returning({ id: pricingFactors.id });
      await recordAudit({ action: "create", entityType: "pricing_factor", entityId: row.id, summary: `Creado factor "${values.label}"` });
    }
  } catch (err) {
    const safe = toSafeError(err, "savePricingFactorAction", "No se ha podido guardar el factor de precio.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath(`/admin/reglas-precio/${ruleId}`);
  return { ok: true };
}

export async function saveVatRateAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = vatRateFormSchema.safeParse({
    id: formData.get("id") || undefined,
    serviceTypeId: formData.get("serviceTypeId"),
    scenario: formData.get("scenario"),
    ratePct: formData.get("ratePct"),
    description: formData.get("description"),
    sourceId: formData.get("sourceId"),
    isActive: bool(formData, "isActive"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    if (parsed.data.id) {
      await db.update(vatRates).set(parsed.data).where(eq(vatRates.id, parsed.data.id));
      await recordAudit({ action: "update", entityType: "vat_rate", entityId: parsed.data.id, summary: `Editado IVA "${parsed.data.scenario}"` });
    } else {
      const [row] = await db.insert(vatRates).values(parsed.data).returning({ id: vatRates.id });
      await recordAudit({ action: "create", entityType: "vat_rate", entityId: row.id, summary: `Creado IVA "${parsed.data.scenario}"` });
    }
  } catch (err) {
    const safe = toSafeError(err, "saveVatRateAction", "No se ha podido guardar la tarifa de IVA.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/admin/iva");
  return { ok: true };
}

export async function saveUncertaintyBandAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = uncertaintyBandFormSchema.safeParse({
    id: formData.get("id") || undefined,
    label: formData.get("label"),
    minConfidenceScore: formData.get("minConfidenceScore"),
    maxConfidenceScore: formData.get("maxConfidenceScore"),
    paddingPct: formData.get("paddingPct"),
    notes: formData.get("notes"),
    isActive: bool(formData, "isActive"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    if (parsed.data.id) {
      await db.update(uncertaintyBands).set(parsed.data).where(eq(uncertaintyBands.id, parsed.data.id));
      await recordAudit({ action: "update", entityType: "uncertainty_band", entityId: parsed.data.id, summary: `Editada banda "${parsed.data.label}"` });
    } else {
      const [row] = await db.insert(uncertaintyBands).values(parsed.data).returning({ id: uncertaintyBands.id });
      await recordAudit({ action: "create", entityType: "uncertainty_band", entityId: row.id, summary: `Creada banda "${parsed.data.label}"` });
    }
  } catch (err) {
    const safe = toSafeError(err, "saveUncertaintyBandAction", "No se ha podido guardar la banda de incertidumbre.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/admin/incertidumbre");
  return { ok: true };
}
