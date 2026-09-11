/**
 * Capa de acceso a datos del motor de estimación. Todo lo que toca
 * Postgres vive aquí — el motor (`engine.ts`) y la comparación
 * (`compare.ts`) no importan Drizzle ni saben que existe una base de
 * datos, así que siguen siendo testeables con fixtures puros.
 */
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
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

export async function persistEstimate(args: {
  context: PricingContext;
  input: EstimationInput;
  evaluation: EvaluationResult;
  regionSlug: string | null;
  materialLevelSlug: string;
  anonymousSessionId?: string | null;
}): Promise<string> {
  const regionId = await resolveRegionId(args.regionSlug);
  const materialLevelId = await resolveMaterialLevelId(args.materialLevelSlug);
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

export async function persistUserBudget(args: {
  estimateId: string;
  declared: DeclaredBudgetValues;
  comparison: ComparisonResult;
}): Promise<string> {
  const [budget] = await db
    .insert(userBudgets)
    .values({
      estimateId: args.estimateId,
      total: args.declared.total,
      verdict: args.comparison.verdict,
      deviationPct: args.comparison.deviationPct,
      deviationAbsolute: args.comparison.deviationAbsolute,
    })
    .returning();

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

  return budget.id;
}

export async function getEstimateForDisplay(id: string) {
  const [estimate] = await db.select().from(estimates).where(eq(estimates.id, id)).limit(1);
  if (!estimate) return null;

  const [rule] = await db.select().from(pricingRules).where(eq(pricingRules.id, estimate.pricingRuleId)).limit(1);
  const items = await db.select().from(estimateItems).where(eq(estimateItems.estimateId, id)).orderBy(estimateItems.sortOrder);
  const ranges = await db.select().from(estimateRanges).where(eq(estimateRanges.estimateId, id));

  return { estimate, items, ranges, methodologyVersion: rule ? `v${rule.version}` : "desconocida" };
}

export async function getUserBudgetForDisplay(id: string) {
  const [budget] = await db.select().from(userBudgets).where(eq(userBudgets.id, id)).limit(1);
  if (!budget) return null;

  const budgetItems = await db.select().from(userBudgetItems).where(eq(userBudgetItems.userBudgetId, id));
  const estimateData = await getEstimateForDisplay(budget.estimateId);
  if (!estimateData) return null;

  return { budget, budgetItems, estimate: estimateData };
}
