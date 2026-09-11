/**
 * Esquema de datos del motor de estimación.
 *
 * Principio rector: ningún precio, factor o multiplicador vive como
 * constante en TypeScript. Todo lo que puede cambiar sin que cambie el
 * *comportamiento* del motor (un precio, un rango, un multiplicador, una
 * fuente) es una fila en estas tablas — editable por un futuro panel de
 * administración o directamente por SQL, sin desplegar código nuevo.
 *
 * Lo que SÍ vive en código es la lógica de evaluación (cómo se combinan los
 * factores) y el test legal del IVA reducido (es una norma, no un precio de
 * mercado) — ver lib/estimation/engine.ts y lib/estimation/vat.ts.
 */

import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type { FactorCondition } from "../lib/estimation/condition-types";

export const confidenceEnum = pgEnum("confidence", ["A", "B", "C"]);

export const sourceTypeEnum = pgEnum("source_type", [
  "oficial",
  "catalogo_real",
  "mercado",
  "heuristica_propia",
]);

export const factorKindEnum = pgEnum("factor_kind", ["base", "multiplier", "additive"]);

export const verdictEnum = pgEnum("verdict", ["dentro_de_rango", "por_encima", "por_debajo"]);

export const budgetLineStatusEnum = pgEnum("budget_line_status", [
  "dentro",
  "por_encima",
  "no_declarado",
]);

export const budgetLineCategoryEnum = pgEnum("budget_line_category", ["equipo", "mano_obra", "extras", "otros"]);

const money = (name: string) => numeric(name, { precision: 10, scale: 2, mode: "number" });
const pct = (name: string) => numeric(name, { precision: 5, scale: 4, mode: "number" });
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
};

// ---------------------------------------------------------------------------
// Taxonomía de servicios
// ---------------------------------------------------------------------------

export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export const serviceTypes = pgTable(
  "service_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => serviceCategories.id),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    /** Explica qué representa "cantidad" para este servicio (p. ej. "metros de línea adicionales"). */
    unitLabel: text("unit_label"),
    /** Si este servicio puede llegar a tributar al 10% de IVA reducido (obra en vivienda particular). */
    vatReducedEligible: boolean("vat_reduced_eligible").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [unique().on(t.categoryId, t.slug)],
);

// ---------------------------------------------------------------------------
// Geografía — jerarquía completa disponible, pero solo se siembra lo que
// tiene evidencia real (ver docs/01). Nada de multiplicadores inventados
// por provincia.
// ---------------------------------------------------------------------------

export const regions = pgTable("regions", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  ...timestamps,
});

export const provinces = pgTable(
  "provinces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (t) => [unique().on(t.regionId, t.slug)],
);

export const cities = pgTable(
  "cities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provinceId: uuid("province_id")
      .notNull()
      .references(() => provinces.id),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (t) => [unique().on(t.provinceId, t.slug)],
);

// ---------------------------------------------------------------------------
// Calidad / material — genérico entre verticales (gama de un equipo, calidad
// de un alicatado, etc. en el futuro)
// ---------------------------------------------------------------------------

export const materialLevels = pgTable("material_levels", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Fuentes de datos — la traducción a tabla de docs/01. Cada factor y cada
// tarifa de IVA cita una fila de aquí.
// ---------------------------------------------------------------------------

export const dataSources = pgTable("data_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  url: text("url"),
  sourceType: sourceTypeEnum("source_type").notNull(),
  confidence: confidenceEnum("confidence").notNull(),
  geographicScope: text("geographic_scope").notNull(),
  /** Fecha de publicación de la fuente, si se conoce. */
  publishedOn: text("published_on"),
  /** Fecha en la que NOSOTROS verificamos el dato (siempre conocida). */
  retrievedOn: text("retrieved_on").notNull(),
  notes: text("notes").notNull(),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Motor de reglas de precio — versionado explícitamente. Una Estimate
// siempre referencia el id de la regla exacta con la que se calculó, así
// que cambiar los factores de mañana no reescribe el pasado.
// ---------------------------------------------------------------------------

export const pricingRules = pgTable(
  "pricing_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceTypeId: uuid("service_type_id")
      .notNull()
      .references(() => serviceTypes.id),
    version: integer("version").notNull(),
    name: text("name").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull().defaultNow(),
    validTo: timestamp("valid_to", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [unique().on(t.serviceTypeId, t.version)],
);

export const pricingFactors = pgTable("pricing_factors", {
  id: uuid("id").primaryKey().defaultRandom(),
  ruleId: uuid("rule_id")
    .notNull()
    .references(() => pricingRules.id),
  /** Clave estable para trazabilidad y tests, no se muestra al usuario. */
  key: text("key").notNull(),
  label: text("label").notNull(),
  kind: factorKindEnum("kind").notNull(),
  /** Agrupación semántica para el desglose (equipo, mano_obra, extras, ubicacion...). */
  groupKey: text("group_key").notNull(),
  /** Campo de `quantities` del input que multiplica este factor (null = factor plano). */
  perUnitOfQuantity: text("per_unit_of_quantity"),
  valueMin: money("value_min").notNull(),
  valueMax: money("value_max").notNull(),
  /** null = siempre se aplica. Si no, se evalúa contra el input (ver condition-types.ts). */
  condition: jsonb("condition").$type<FactorCondition | null>(),
  sourceId: uuid("source_id").references(() => dataSources.id),
  confidence: confidenceEnum("confidence").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// IVA — la tarifa es un dato (puede cambiar si cambia la ley); el TEST legal
// de elegibilidad (vivienda particular, >2 años, <=40% materiales) es lógica
// en lib/estimation/vat.ts porque es una norma, no un precio de mercado.
// ---------------------------------------------------------------------------

export const vatRates = pgTable("vat_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceTypeId: uuid("service_type_id")
    .notNull()
    .references(() => serviceTypes.id),
  scenario: text("scenario").notNull(), // 'reducido_vivienda_particular' | 'general'
  ratePct: pct("rate_pct").notNull(), // 0.10 / 0.21
  description: text("description").notNull(),
  sourceId: uuid("source_id").references(() => dataSources.id),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Incertidumbre — cuánto se ensancha el rango final según la mezcla de
// confianza (A/B/C) de los factores que han contribuido. Tabla pequeña,
// ajustable sin tocar código.
// ---------------------------------------------------------------------------

export const uncertaintyBands = pgTable("uncertainty_bands", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  minConfidenceScore: pct("min_confidence_score").notNull(),
  maxConfidenceScore: pct("max_confidence_score").notNull(),
  paddingPct: pct("padding_pct").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
});

// ---------------------------------------------------------------------------
// Resultados persistidos — calculado UNA vez, guardado tal cual. Si la
// metodología cambia después, una estimación ya compartida no cambia por
// debajo de los pies de quien la recibió.
// ---------------------------------------------------------------------------

export const estimates = pgTable("estimates", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceTypeId: uuid("service_type_id")
    .notNull()
    .references(() => serviceTypes.id),
  pricingRuleId: uuid("pricing_rule_id")
    .notNull()
    .references(() => pricingRules.id),
  regionId: uuid("region_id").references(() => regions.id),
  provinceId: uuid("province_id").references(() => provinces.id),
  materialLevelId: uuid("material_level_id").references(() => materialLevels.id),
  /** Input validado tal y como se recibió (auditoría + futura base de datos propia). */
  inputs: jsonb("inputs").notNull(),
  vatScenario: text("vat_scenario").notNull(),
  vatRatePct: pct("vat_rate_pct").notNull(),
  confidenceScore: pct("confidence_score").notNull(),
  uncertaintyPct: pct("uncertainty_pct").notNull(),
  subtotalMin: money("subtotal_min").notNull(),
  subtotalMax: money("subtotal_max").notNull(),
  totalMin: money("total_min").notNull(),
  totalMax: money("total_max").notNull(),
  /** Identificador anónimo de sesión de navegador, nunca datos personales. */
  anonymousSessionId: text("anonymous_session_id"),
  ...timestamps,
});

export const estimateItems = pgTable("estimate_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimateId: uuid("estimate_id")
    .notNull()
    .references(() => estimates.id),
  factorId: uuid("factor_id").references(() => pricingFactors.id),
  key: text("key").notNull(),
  label: text("label").notNull(),
  kind: factorKindEnum("kind").notNull(),
  groupKey: text("group_key").notNull(),
  min: money("min").notNull(),
  max: money("max").notNull(),
  confidence: confidenceEnum("confidence").notNull(),
  isOptional: boolean("is_optional").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** Rangos agregados (equipo, mano_obra, extras, subtotal, iva, total...). */
export const estimateRanges = pgTable("estimate_ranges", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimateId: uuid("estimate_id")
    .notNull()
    .references(() => estimates.id),
  groupKey: text("group_key").notNull(),
  label: text("label").notNull(),
  min: money("min").notNull(),
  max: money("max").notNull(),
});

/**
 * Agrupa uno o más `user_budgets` contra la MISMA `Estimate`. En el MVP
 * siempre hay un único presupuesto por comparación, pero el id de esta
 * tabla (no el de `user_budgets`) es el que se usa en la URL pública
 * (`/comparar/[id]`) precisamente para que añadir un segundo y un tercer
 * presupuesto ("compara 3 presupuestos") no rompa enlaces ya compartidos.
 */
export const budgetComparisons = pgTable("budget_comparisons", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimateId: uuid("estimate_id")
    .notNull()
    .references(() => estimates.id),
  ...timestamps,
});

export const userBudgets = pgTable("user_budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  comparisonId: uuid("comparison_id")
    .notNull()
    .references(() => budgetComparisons.id),
  /** Para cuando haya varios en la misma comparación (p. ej. "Presupuesto de Climas Pérez"). */
  label: text("label"),
  /** Descripción libre que el usuario pega o escribe del presupuesto recibido. */
  description: text("description"),
  total: money("total").notNull(),
  verdict: verdictEnum("verdict").notNull(),
  deviationPct: pct("deviation_pct").notNull(),
  deviationAbsolute: money("deviation_absolute").notNull(),
  ...timestamps,
});

/** Partidas tal y como las escribe el usuario (input crudo, no calculado). */
export const userBudgetLines = pgTable("user_budget_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  userBudgetId: uuid("user_budget_id")
    .notNull()
    .references(() => userBudgets.id),
  label: text("label").notNull(),
  category: budgetLineCategoryEnum("category").notNull(),
  amount: money("amount").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** Resumen calculado por categoría (declarado vs. esperado) — se deriva de `user_budget_lines`. */
export const userBudgetItems = pgTable("user_budget_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userBudgetId: uuid("user_budget_id")
    .notNull()
    .references(() => userBudgets.id),
  groupKey: text("group_key").notNull(),
  label: text("label").notNull(),
  declaredAmount: money("declared_amount").notNull(),
  expectedMin: money("expected_min").notNull(),
  expectedMax: money("expected_max").notNull(),
  status: budgetLineStatusEnum("status").notNull(),
});
