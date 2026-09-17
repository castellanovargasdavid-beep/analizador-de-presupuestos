/**
 * Capa de acceso a datos de calidad/confianza — junta lo que
 * `lib/quality/confidence-gate.ts` y `lib/quality/validation-metrics.ts`
 * necesitan (puros, sin Drizzle) con Postgres real. Ver
 * docs/CALCULATOR-QUALITY-STANDARD.md.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { dataSources, estimates, pricingFactors, pricingRules, priceValidationSamples, serviceTypes } from "@/db/schema";
import { computeJustifiableConfidence, type ConfidenceGateResult, type GateFactorInput } from "./confidence-gate";
import { computeValidationMetrics, type ValidationMetricsResult } from "./validation-metrics";

export interface RuleConfidenceReport {
  ruleId: string;
  serviceTypeId: string;
  serviceName: string;
  ruleVersion: number;
  gate: ConfidenceGateResult;
  metrics: ValidationMetricsResult;
}

/**
 * Calcula el informe de confianza completo de una regla de precio activa,
 * leyendo sus factores, las fuentes que citan, y todas las muestras de
 * validación del servicio. No cachea entre requests (a diferencia de
 * lib/estimation/repository.ts): esto se consulta solo desde /admin, de
 * bajo tráfico, y siempre debe reflejar el estado más reciente.
 */
export async function getRuleConfidenceReport(ruleId: string): Promise<RuleConfidenceReport | null> {
  const [rule] = await db
    .select({ rule: pricingRules, serviceType: serviceTypes })
    .from(pricingRules)
    .innerJoin(serviceTypes, eq(pricingRules.serviceTypeId, serviceTypes.id))
    .where(eq(pricingRules.id, ruleId))
    .limit(1);
  if (!rule) return null;

  const factorRows = await db
    .select({ factor: pricingFactors, source: dataSources })
    .from(pricingFactors)
    .leftJoin(dataSources, eq(pricingFactors.sourceId, dataSources.id))
    .where(eq(pricingFactors.ruleId, ruleId));

  const gateFactors: GateFactorInput[] = factorRows.map(({ factor, source }) => ({
    key: factor.key,
    kind: factor.kind,
    isActive: factor.isActive,
    sourceType: source?.sourceType ?? null,
    sourceIsActive: source?.isActive ?? null,
    sourceRetrievedOn: source?.retrievedOn ?? null,
  }));

  const sampleRows = await db
    .select({ sample: priceValidationSamples, estimate: estimates })
    .from(priceValidationSamples)
    .leftJoin(estimates, eq(priceValidationSamples.relatedEstimateId, estimates.id))
    .where(eq(priceValidationSamples.serviceTypeId, rule.rule.serviceTypeId));

  const metrics = computeValidationMetrics(
    sampleRows.map(({ sample, estimate }) => ({
      id: sample.id,
      finalPriceWithVat: sample.finalPriceWithVat,
      estimateRange: estimate ? { totalMin: estimate.totalMin, totalMax: estimate.totalMax } : null,
    })),
  );

  const gate = computeJustifiableConfidence(
    {
      methodologyDocPath: rule.rule.methodologyDocPath,
      geographicScope: rule.rule.geographicScope,
      lastReviewedAt: rule.rule.lastReviewedAt,
      whatIncluded: rule.serviceType.whatIncluded,
      whatExcluded: rule.serviceType.whatExcluded,
    },
    gateFactors,
    metrics.comparableSampleSize > 0
      ? { sampleSize: metrics.comparableSampleSize, hitRatePct: metrics.hitRatePct, biasPct: metrics.biasPct }
      : { sampleSize: metrics.totalSampleSize, hitRatePct: null, biasPct: null },
  );

  return {
    ruleId: rule.rule.id,
    serviceTypeId: rule.rule.serviceTypeId,
    serviceName: rule.serviceType.name,
    ruleVersion: rule.rule.version,
    gate,
    metrics,
  };
}

export async function listValidationSamples(serviceTypeId: string) {
  return db
    .select()
    .from(priceValidationSamples)
    .where(eq(priceValidationSamples.serviceTypeId, serviceTypeId))
    .orderBy(priceValidationSamples.quoteDate);
}
