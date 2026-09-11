/**
 * Seed de datos — Aire acondicionado / Instalación.
 *
 * Inserta en Postgres exactamente lo definido en
 * lib/estimation/seed-data.ts (fuente única de verdad, compartida con los
 * tests del motor). Ejecutar con `npm run db:seed` — idempotente: borra y
 * vuelve a insertar el conjunto gestionado por este script.
 */
import { db } from "./client";
import {
  AIRE_ACONDICIONADO_INSTALACION_FACTORS,
  DATA_SOURCES,
  UNCERTAINTY_BANDS_DEF,
  VAT_RATES_DEF,
  type DataSourceKey,
} from "../lib/estimation/seed-data";
import type { FactorCondition } from "../lib/estimation/condition-types";
import {
  cities,
  dataSources,
  estimateItems,
  estimateRanges,
  estimates,
  materialLevels,
  pricingFactors,
  pricingRules,
  provinces,
  regions,
  serviceCategories,
  serviceTypes,
  uncertaintyBands,
  userBudgetItems,
  userBudgets,
  vatRates,
} from "./schema";

const CCAA = [
  "Andalucía",
  "Aragón",
  "Principado de Asturias",
  "Islas Baleares",
  "Canarias",
  "Cantabria",
  "Castilla-La Mancha",
  "Castilla y León",
  "Cataluña",
  "Comunidad Valenciana",
  "Extremadura",
  "Galicia",
  "Comunidad de Madrid",
  "Región de Murcia",
  "Comunidad Foral de Navarra",
  "País Vasco",
  "La Rioja",
  "Ceuta",
  "Melilla",
];

function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Sustituye los marcadores __MADRID__/__CATALUNA__ por los slugs reales de región. */
function resolveCondition(condition: FactorCondition | null, slugFor: Record<string, string>): FactorCondition | null {
  if (!condition) return null;
  const json = JSON.stringify(condition)
    .replace(/__MADRID__/g, slugFor.madrid)
    .replace(/__CATALUNA__/g, slugFor.cataluna);
  return JSON.parse(json) as FactorCondition;
}

async function main() {
  console.log("Limpiando datos gestionados por el seed...");
  await db.delete(userBudgetItems);
  await db.delete(userBudgets);
  await db.delete(estimateItems);
  await db.delete(estimateRanges);
  await db.delete(estimates);
  await db.delete(pricingFactors);
  await db.delete(vatRates);
  await db.delete(pricingRules);
  await db.delete(uncertaintyBands);
  await db.delete(materialLevels);
  await db.delete(cities);
  await db.delete(provinces);
  await db.delete(regions);
  await db.delete(serviceTypes);
  await db.delete(serviceCategories);
  await db.delete(dataSources);

  console.log("Sembrando geografía (CCAA)...");
  const insertedRegions = await db
    .insert(regions)
    .values(CCAA.map((name) => ({ slug: slugify(name), name })))
    .returning();
  const regionBySlug = Object.fromEntries(insertedRegions.map((r) => [r.slug, r]));
  const slugFor = { madrid: regionBySlug["comunidad-de-madrid"].slug, cataluna: regionBySlug["cataluna"].slug };

  console.log("Sembrando niveles de material...");
  await db.insert(materialLevels).values([
    { slug: "economica", name: "Económica", sortOrder: 1, description: "Marca genérica, eficiencia básica" },
    { slug: "media", name: "Media", sortOrder: 2, description: "Buena relación calidad-precio, la más habitual" },
    { slug: "premium", name: "Premium", sortOrder: 3, description: "Alta eficiencia, marcas de gama alta, bajo ruido" },
  ]);

  console.log("Sembrando fuentes de datos...");
  const insertedSources = await db
    .insert(dataSources)
    .values(Object.values(DATA_SOURCES))
    .returning();
  const sourceKeys = Object.keys(DATA_SOURCES) as DataSourceKey[];
  const sourceIdByKey = Object.fromEntries(sourceKeys.map((key, i) => [key, insertedSources[i].id]));

  console.log("Sembrando categoría y tipo de servicio...");
  const [aireAcondicionado] = await db
    .insert(serviceCategories)
    .values([{ slug: "aire-acondicionado", name: "Aire acondicionado" }])
    .returning();

  const [instalacion] = await db
    .insert(serviceTypes)
    .values([
      {
        categoryId: aireAcondicionado.id,
        slug: "instalacion",
        name: "Instalación de aire acondicionado",
        unitLabel: "metros adicionales de línea frigorífica / canaleta",
        vatReducedEligible: true,
      },
    ])
    .returning();

  console.log("Sembrando regla de precios v1...");
  const [rule] = await db
    .insert(pricingRules)
    .values([{ serviceTypeId: instalacion.id, version: 1, name: "Instalación A/C — v1 (2026.09)" }])
    .returning();

  console.log("Sembrando factores de precio...");
  await db.insert(pricingFactors).values(
    AIRE_ACONDICIONADO_INSTALACION_FACTORS.map((f) => ({
      ruleId: rule.id,
      key: f.key,
      label: f.label,
      kind: f.kind,
      groupKey: f.groupKey,
      perUnitOfQuantity: f.perUnitOfQuantity ?? null,
      valueMin: f.valueMin,
      valueMax: f.valueMax,
      confidence: f.confidence,
      condition: resolveCondition(f.condition, slugFor),
      sourceId: sourceIdByKey[f.sourceKey],
      notes: f.notes ?? null,
    })),
  );

  console.log("Sembrando tarifas de IVA...");
  await db.insert(vatRates).values(
    VAT_RATES_DEF.map((v) => ({
      serviceTypeId: instalacion.id,
      scenario: v.scenario,
      ratePct: v.ratePct,
      description: v.description,
      sourceId: sourceIdByKey[v.sourceKey],
    })),
  );

  console.log("Sembrando bandas de incertidumbre...");
  await db.insert(uncertaintyBands).values(UNCERTAINTY_BANDS_DEF);

  console.log("Seed completado.");
  console.log(`Regiones: ${insertedRegions.length}, factores: ${AIRE_ACONDICIONADO_INSTALACION_FACTORS.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
