/**
 * Capa de acceso a datos del motor de estimación. Todo lo que toca
 * Postgres vive aquí — el motor (`engine.ts`) y la comparación
 * (`compare.ts`) no importan Drizzle ni saben que existe una base de
 * datos, así que siguen siendo testeables con fixtures puros.
 */
import { cache } from "react";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  budgetComparisons,
  dataSources,
  estimateItems,
  estimateRanges,
  estimates,
  materialLevels,
  pricingFactors,
  pricingRules,
  regions,
  serviceCategories,
  serviceTypes,
  uncertaintyBands,
  userBudgetItems,
  userBudgetLines,
  userBudgets,
  vatRates,
} from "@/db/schema";
import { MissingPricingDataError } from "./errors";
import type { FactorCondition } from "./condition-types";
import type {
  Confidence,
  EstimationInput,
  EvaluationResult,
  PlainFactor,
  UncertaintyBand,
  VatRateOption,
} from "./types";
import type { ComparisonResult } from "./compare";
import type { DeclaredBudgetValues } from "./validation";

export interface PricingContext {
  serviceTypeId: string;
  serviceTypeVatReducedEligible: boolean;
  pricingRuleId: string;
  factors: PlainFactor[];
  vatRates: VatRateOption[];
  uncertaintyBands: UncertaintyBand[];
}

export async function loadPricingContext(categorySlug: string, serviceTypeSlug: string): Promise<PricingContext> {
  const [category] = await db.select().from(serviceCategories).where(eq(serviceCategories.slug, categorySlug)).limit(1);
  if (!category) throw new MissingPricingDataError(`No existe la categoría de servicio '${categorySlug}'.`);

  const [serviceType] = await db
    .select()
    .from(serviceTypes)
    .where(and(eq(serviceTypes.categoryId, category.id), eq(serviceTypes.slug, serviceTypeSlug), eq(serviceTypes.isActive, true)))
    .limit(1);
  if (!serviceType) {
    throw new MissingPricingDataError(`No existe el tipo de servicio '${categorySlug}/${serviceTypeSlug}' o está inactivo.`);
  }

  const [rule] = await db
    .select()
    .from(pricingRules)
    .where(and(eq(pricingRules.serviceTypeId, serviceType.id), eq(pricingRules.isActive, true)))
    .orderBy(desc(pricingRules.version))
    .limit(1);
  if (!rule) {
    throw new MissingPricingDataError(`No hay ninguna regla de precios activa para '${categorySlug}/${serviceTypeSlug}'.`);
  }

  const factorRows = await db
    .select()
    .from(pricingFactors)
    .where(and(eq(pricingFactors.ruleId, rule.id), eq(pricingFactors.isActive, true)));

  const vatRows = await db.select().from(vatRates).where(and(eq(vatRates.serviceTypeId, serviceType.id), eq(vatRates.isActive, true)));
  const bandRows = await db.select().from(uncertaintyBands).where(eq(uncertaintyBands.isActive, true));

  return {
    serviceTypeId: serviceType.id,
    serviceTypeVatReducedEligible: serviceType.vatReducedEligible,
    pricingRuleId: rule.id,
    factors: factorRows.map((f) => ({
      id: f.id,
      key: f.key,
      label: f.label,
      kind: f.kind,
      groupKey: f.groupKey,
      perUnitOfQuantity: f.perUnitOfQuantity,
      valueMin: f.valueMin,
      valueMax: f.valueMax,
      condition: f.condition as FactorCondition | null,
      confidence: f.confidence as Confidence,
    })),
    vatRates: vatRows.map((v) => ({ scenario: v.scenario, ratePct: v.ratePct, description: v.description })),
    uncertaintyBands: bandRows.map((b) => ({
      label: b.label,
      minConfidenceScore: b.minConfidenceScore,
      maxConfidenceScore: b.maxConfidenceScore,
      paddingPct: b.paddingPct,
    })),
  };
}

export async function resolveRegionId(regionSlug: string | null | undefined): Promise<string | null> {
  if (!regionSlug) return null;
  const [region] = await db.select().from(regions).where(eq(regions.slug, regionSlug)).limit(1);
  return region?.id ?? null;
}

export async function resolveMaterialLevelId(slug: string): Promise<string | null> {
  const [level] = await db.select().from(materialLevels).where(eq(materialLevels.slug, slug)).limit(1);
  return level?.id ?? null;
}

export async function listMaterialLevels() {
  return db.select().from(materialLevels).orderBy(materialLevels.sortOrder);
}

export async function listRegions() {
  return db.select().from(regions).orderBy(regions.name);
}

/** Para /fuentes — la transparencia de docs/01 convertida en página real, no solo en documento interno. */
export async function listDataSources() {
  return db.select().from(dataSources).orderBy(dataSources.confidence, dataSources.name);
}

/**
 * Fecha (ISO `YYYY-MM-DD`, comparable como texto) en la que se verificó
 * por última vez alguna fuente de datos — la señal de confianza más simple
 * y honesta: no "actualizado hace 2 minutos" inventado, sino la fecha real
 * más reciente de `data_sources.retrieved_on`. `null` si no hay fuentes.
 */
export async function getLastDataUpdateDate(): Promise<string | null> {
  const [row] = await db.select({ max: sql<string | null>`max(${dataSources.retrievedOn})` }).from(dataSources);
  return row?.max ?? null;
}

/** Alimenta lib/content/territory-gate.ts: cuántas estimaciones propias hay para una región. */
export async function countEstimatesByRegion(regionSlug: string): Promise<number> {
  const [region] = await db.select().from(regions).where(eq(regions.slug, regionSlug)).limit(1);
  if (!region) return 0;
  const [row] = await db.select({ total: count() }).from(estimates).where(eq(estimates.regionId, region.id));
  return row?.total ?? 0;
}

export async function persistEstimate(args: {
  context: PricingContext;
  input: EstimationInput;
  evaluation: EvaluationResult;
  regionSlug: string | null;
  /** `null` para servicios sin concepto de "nivel de material/gama" (la mayoría de los nuevos). */
  materialLevelSlug: string | null;
  anonymousSessionId?: string | null;
}): Promise<string> {
  const regionId = await resolveRegionId(args.regionSlug);
  const materialLevelId = args.materialLevelSlug ? await resolveMaterialLevelId(args.materialLevelSlug) : null;
  const subtotalRange = args.evaluation.ranges.find((r) => r.groupKey === "subtotal")!;
  const totalRange = args.evaluation.ranges.find((r) => r.groupKey === "total")!;

  const [estimate] = await db
    .insert(estimates)
    .values({
      serviceTypeId: args.context.serviceTypeId,
      pricingRuleId: args.context.pricingRuleId,
      regionId,
      materialLevelId,
      inputs: args.input,
      vatScenario: args.evaluation.vat.scenario,
      vatRatePct: args.evaluation.vat.ratePct,
      confidenceScore: args.evaluation.confidenceScore,
      uncertaintyPct: args.evaluation.uncertaintyBand.paddingPct,
      subtotalMin: subtotalRange.min,
      subtotalMax: subtotalRange.max,
      totalMin: totalRange.min,
      totalMax: totalRange.max,
      anonymousSessionId: args.anonymousSessionId ?? null,
    })
    .returning();

  const factorIdByKey = new Map(args.context.factors.map((f) => [f.key, f.id]));

  await db.insert(estimateItems).values(
    args.evaluation.items.map((item, index) => ({
      estimateId: estimate.id,
      factorId: factorIdByKey.get(item.key) ?? null,
      key: item.key,
      label: item.label,
      kind: item.kind,
      groupKey: item.groupKey,
      min: item.min,
      max: item.max,
      confidence: item.confidence,
      isOptional: item.isOptional,
      sortOrder: index,
    })),
  );

  await db.insert(estimateRanges).values(
    args.evaluation.ranges.map((range) => ({
      estimateId: estimate.id,
      groupKey: range.groupKey,
      label: range.label,
      min: range.min,
      max: range.max,
    })),
  );

  return estimate.id;
}

/**
 * Crea una nueva `budget_comparisons` (con un único presupuesto dentro,
 * hoy) y devuelve su id — es el id que se usa en `/comparar/[id]`, para
 * que añadir un segundo/tercer presupuesto a la MISMA comparación en el
 * futuro ("compara 3 presupuestos") no invalide un enlace ya compartido.
 */
export async function persistUserBudget(args: {
  estimateId: string;
  declared: DeclaredBudgetValues;
  comparison: ComparisonResult;
}): Promise<string> {
  const [comparison] = await db.insert(budgetComparisons).values({ estimateId: args.estimateId }).returning();

  const [budget] = await db
    .insert(userBudgets)
    .values({
      comparisonId: comparison.id,
      description: args.declared.description ?? null,
      total: args.declared.total,
      verdict: args.comparison.verdict,
      deviationPct: args.comparison.deviationPct,
      deviationAbsolute: args.comparison.deviationAbsolute,
    })
    .returning();

  if (args.declared.lines.length > 0) {
    await db.insert(userBudgetLines).values(
      args.declared.lines.map((line, index) => ({
        userBudgetId: budget.id,
        label: line.label,
        category: line.category,
        amount: line.amount,
        sortOrder: index,
      })),
    );
  }

  if (args.comparison.lineVerdicts.length > 0) {
    await db.insert(userBudgetItems).values(
      args.comparison.lineVerdicts.map((lv) => ({
        userBudgetId: budget.id,
        groupKey: lv.groupKey,
        label: lv.label,
        declaredAmount: lv.declared ?? 0,
        expectedMin: lv.expectedMin,
        expectedMax: lv.expectedMax,
        status: lv.status,
      })),
    );
  }

  return comparison.id;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `cache()` de React: dentro de la misma request, `generateMetadata` y el
 * componente de página piden la misma Estimate/Comparison (para el OG
 * dinámico y para el render). Sin este cache, cada page view haría el doble
 * de consultas a Postgres; con él, la segunda llamada es gratis.
 */
export const getEstimateForDisplay = cache(async (id: string) => {
  // Un id con formato inválido no es "no encontrado" para Postgres: es un
  // error de tipo (uuid) que rompería la query con un 500. Una URL
  // manipulada o mal formada (un bot, un enlace roto) debe dar 404 limpio.
  if (!UUID_RE.test(id)) return null;

  const [estimate] = await db.select().from(estimates).where(eq(estimates.id, id)).limit(1);
  if (!estimate) return null;

  const [rule] = await db.select().from(pricingRules).where(eq(pricingRules.id, estimate.pricingRuleId)).limit(1);
  const items = await db.select().from(estimateItems).where(eq(estimateItems.estimateId, id)).orderBy(estimateItems.sortOrder);
  const ranges = await db.select().from(estimateRanges).where(eq(estimateRanges.estimateId, id));

  return { estimate, items, ranges, methodologyVersion: rule ? `v${rule.version}` : "desconocida" };
});

/**
 * Devuelve TODOS los presupuestos de una comparación (hoy siempre 1, pero
 * la forma ya es un array para no tener que cambiar el contrato de esta
 * función cuando se permita añadir un 2º/3º presupuesto a comparar).
 */
export const getComparisonForDisplay = cache(async (comparisonId: string) => {
  if (!UUID_RE.test(comparisonId)) return null;

  const [comparison] = await db.select().from(budgetComparisons).where(eq(budgetComparisons.id, comparisonId)).limit(1);
  if (!comparison) return null;

  const estimateData = await getEstimateForDisplay(comparison.estimateId);
  if (!estimateData) return null;

  const budgetRows = await db
    .select()
    .from(userBudgets)
    .where(eq(userBudgets.comparisonId, comparisonId))
    .orderBy(userBudgets.createdAt);

  const budgets = await Promise.all(
    budgetRows.map(async (budget) => {
      const lines = await db
        .select()
        .from(userBudgetLines)
        .where(eq(userBudgetLines.userBudgetId, budget.id))
        .orderBy(userBudgetLines.sortOrder);
      const items = await db.select().from(userBudgetItems).where(eq(userBudgetItems.userBudgetId, budget.id));
      return { budget, lines, items };
    }),
  );

  return { comparison, budgets, estimate: estimateData };
});
