/**
 * Explicabilidad interna: responde "¿por qué este cálculo ha producido
 * este rango?" reconstruyendo, para una Estimate ya persistida, la cadena
 * completa estimate -> regla/versión -> cada partida -> su factor -> su
 * fuente, más el IVA y la banda de incertidumbre aplicados. No es una
 * tabla nueva: todos estos datos ya existían (persistEstimate en
 * lib/estimation/repository.ts los guarda en el momento del cálculo); esto
 * solo los junta para una vista de auditoría.
 *
 * Importante: el factor/fuente que se muestra es el que existe HOY en esas
 * tablas. Si alguien lo edita o desactiva después del cálculo, la
 * Estimate ya persistida no cambia (ver el comentario en el schema), pero
 * esta vista de auditoría sí reflejará la versión actual del factor citado
 * — es "qué factor fue" (por id), no "qué valores tenía exactamente en ese
 * momento", salvo lo que ya quedó congelado en `estimate_items`.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  dataSources,
  estimateItems,
  estimateRanges,
  estimates,
  materialLevels,
  pricingFactors,
  pricingRules,
  provinces,
  regions,
  serviceTypes,
  uncertaintyBands,
  vatRates,
} from "@/db/schema";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ExplainedItem {
  item: typeof estimateItems.$inferSelect;
  factor: typeof pricingFactors.$inferSelect | null;
  source: typeof dataSources.$inferSelect | null;
}

export async function getEstimateExplanation(id: string) {
  if (!UUID_RE.test(id)) return null;

  const [estimate] = await db.select().from(estimates).where(eq(estimates.id, id)).limit(1);
  if (!estimate) return null;

  const [rule] = await db.select().from(pricingRules).where(eq(pricingRules.id, estimate.pricingRuleId)).limit(1);
  const [serviceType] = await db.select().from(serviceTypes).where(eq(serviceTypes.id, estimate.serviceTypeId)).limit(1);
  const [region] = estimate.regionId
    ? await db.select().from(regions).where(eq(regions.id, estimate.regionId)).limit(1)
    : [null];
  const [province] = estimate.provinceId
    ? await db.select().from(provinces).where(eq(provinces.id, estimate.provinceId)).limit(1)
    : [null];
  const [materialLevel] = estimate.materialLevelId
    ? await db.select().from(materialLevels).where(eq(materialLevels.id, estimate.materialLevelId)).limit(1)
    : [null];

  const itemRows = await db
    .select()
    .from(estimateItems)
    .where(eq(estimateItems.estimateId, id))
    .orderBy(estimateItems.sortOrder);
  const ranges = await db.select().from(estimateRanges).where(eq(estimateRanges.estimateId, id));

  const factorIds = itemRows.map((i) => i.factorId).filter((v): v is string => v !== null);
  const factorRows = factorIds.length > 0 ? await db.select().from(pricingFactors).where(inArray(pricingFactors.id, factorIds)) : [];
  const factorById = new Map(factorRows.map((f) => [f.id, f]));

  const sourceIds = factorRows.map((f) => f.sourceId).filter((v): v is string => v !== null);
  const sourceRows = sourceIds.length > 0 ? await db.select().from(dataSources).where(inArray(dataSources.id, sourceIds)) : [];
  const sourceById = new Map(sourceRows.map((s) => [s.id, s]));

  const items: ExplainedItem[] = itemRows.map((item) => {
    const factor = item.factorId ? factorById.get(item.factorId) ?? null : null;
    const source = factor?.sourceId ? sourceById.get(factor.sourceId) ?? null : null;
    return { item, factor, source };
  });

  const [vatRate] = await db
    .select()
    .from(vatRates)
    .where(and(eq(vatRates.serviceTypeId, estimate.serviceTypeId), eq(vatRates.scenario, estimate.vatScenario)))
    .limit(1);
  const [vatSource] = vatRate?.sourceId
    ? await db.select().from(dataSources).where(eq(dataSources.id, vatRate.sourceId)).limit(1)
    : [null];

  const bandRows = await db.select().from(uncertaintyBands).orderBy(uncertaintyBands.minConfidenceScore);
  const appliedBand =
    bandRows.find((b) => estimate.confidenceScore >= b.minConfidenceScore && estimate.confidenceScore <= b.maxConfidenceScore) ?? null;

  return {
    estimate,
    rule: rule ?? null,
    serviceType: serviceType ?? null,
    region,
    province,
    materialLevel,
    items,
    ranges,
    vatRate: vatRate ?? null,
    vatSource,
    appliedBand,
  };
}

export type EstimateExplanation = NonNullable<Awaited<ReturnType<typeof getEstimateExplanation>>>;

/** Para la página de búsqueda: no hay "listado de todas las estimaciones" público, pero el admin sí necesita entrar por algún sitio. */
export async function listRecentEstimates(limit = 20) {
  return db
    .select({
      id: estimates.id,
      createdAt: estimates.createdAt,
      serviceName: serviceTypes.name,
      totalMin: estimates.totalMin,
      totalMax: estimates.totalMax,
      confidenceScore: estimates.confidenceScore,
    })
    .from(estimates)
    .innerJoin(serviceTypes, eq(estimates.serviceTypeId, serviceTypes.id))
    .orderBy(desc(estimates.createdAt))
    .limit(limit);
}
