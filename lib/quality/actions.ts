"use server";

/**
 * Server Actions de calidad/confianza — ver docs/CALCULATOR-QUALITY-STANDARD.md
 * y docs/PRICE-VALIDATION-PROTOCOL.md. Ninguna de estas acciones permite
 * escribir un "nivel de confianza": solo datos de hecho (muestras reales,
 * metadatos de metodología). El nivel se calcula siempre en
 * lib/quality/repository.ts#getRuleConfidenceReport.
 */
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { priceValidationSamples, pricingRules } from "@/db/schema";
import { recordAudit } from "@/lib/admin/audit";
import { toSafeError, type ErrorKind } from "@/lib/errors/safe-message";
import { pricingRuleQualityFormSchema, validationSampleFormSchema } from "./validation";

export interface ActionResult {
  ok: boolean;
  error?: string;
  errorKind?: ErrorKind;
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

export async function saveValidationSampleAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = validationSampleFormSchema.safeParse({
    id: formData.get("id") || undefined,
    serviceTypeId: formData.get("serviceTypeId"),
    regionId: formData.get("regionId"),
    source: formData.get("source"),
    relatedLeadId: formData.get("relatedLeadId"),
    relatedEstimateId: formData.get("relatedEstimateId"),
    projectCharacteristics: formData.get("projectCharacteristics"),
    finalPriceWithVat: formData.get("finalPriceWithVat"),
    includesVat: bool(formData, "includesVat"),
    includesMaterials: bool(formData, "includesMaterials"),
    requiredVisit: bool(formData, "requiredVisit"),
    hadUnexpectedIssues: bool(formData, "hadUnexpectedIssues"),
    quoteDate: formData.get("quoteDate"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const { id, quoteDate, ...rest } = parsed.data;
  const values = {
    ...rest,
    regionId: rest.regionId ?? null,
    relatedLeadId: rest.relatedLeadId ?? null,
    relatedEstimateId: rest.relatedEstimateId ?? null,
    projectCharacteristics: rest.projectCharacteristics ?? null,
    notes: rest.notes ?? null,
    quoteDate: new Date(quoteDate),
  };

  try {
    if (id) {
      await db.update(priceValidationSamples).set(values).where(eq(priceValidationSamples.id, id));
      await recordAudit({
        action: "update",
        entityType: "price_validation_sample",
        entityId: id,
        summary: `Editada muestra de validación (${values.finalPriceWithVat} €)`,
      });
    } else {
      const [row] = await db.insert(priceValidationSamples).values(values).returning({ id: priceValidationSamples.id });
      await recordAudit({
        action: "create",
        entityType: "price_validation_sample",
        entityId: row.id,
        summary: `Registrado presupuesto real (${values.finalPriceWithVat} €) como muestra de validación`,
      });
    }
  } catch (err) {
    const safe = toSafeError(err, "saveValidationSampleAction", "No se ha podido guardar la muestra de validación.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/admin/reglas-precio");
  return { ok: true };
}

export async function savePricingRuleQualityAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = pricingRuleQualityFormSchema.safeParse({
    ruleId: formData.get("ruleId"),
    methodologyDocPath: formData.get("methodologyDocPath"),
    geographicScope: formData.get("geographicScope"),
    reviewedBy: formData.get("reviewedBy"),
    lastReviewedAt: formData.get("lastReviewedAt"),
    nextReviewDueAt: formData.get("nextReviewDueAt"),
    knownIssues: formData.get("knownIssues"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const { ruleId, lastReviewedAt, nextReviewDueAt, ...rest } = parsed.data;

  try {
    await db
      .update(pricingRules)
      .set({
        methodologyDocPath: rest.methodologyDocPath ?? null,
        geographicScope: rest.geographicScope ?? null,
        reviewedBy: rest.reviewedBy ?? null,
        knownIssues: rest.knownIssues ?? null,
        lastReviewedAt: lastReviewedAt ? new Date(lastReviewedAt) : null,
        nextReviewDueAt: nextReviewDueAt ? new Date(nextReviewDueAt) : null,
      })
      .where(eq(pricingRules.id, ruleId));
    await recordAudit({
      action: "update",
      entityType: "pricing_rule_quality",
      entityId: ruleId,
      summary: "Actualizados metadatos de metodología/revisión de la regla de precio",
    });
  } catch (err) {
    const safe = toSafeError(err, "savePricingRuleQualityAction", "No se han podido guardar los metadatos de metodología.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath(`/admin/reglas-precio/${ruleId}`);
  return { ok: true };
}
