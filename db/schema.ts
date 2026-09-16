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
import type { GuideBlock, RelatedLinkEntry } from "../lib/content/blocks";

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

/**
 * Ciclo de vida completo de un lead, gestionado a mano por un administrador
 * (no hay automatización de matching todavía):
 * `nuevo`: recién capturado, sin revisar.
 * `validado`: un administrador ha comprobado que la solicitud es real y útil.
 * `descartado`: se ha decidido no gestionarla (ver `discardReason`).
 * `asignado`: se ha decidido a qué profesional se le ofrecerá.
 * `enviado`: los datos ya se han hecho llegar al profesional asignado.
 * `contactado`: el profesional ha contactado con el usuario (ver `contactOutcome`).
 * `sin_cobertura`: no hay ningún profesional verificado para ese servicio/zona
 * todavía (estado honesto, no se inventa un match) — se asigna automáticamente
 * al crear el lead, nunca a mano.
 * `cerrado`: fin del ciclo de vida del lead, con o sin contratación.
 * `con_incidencia`: algo ha ido mal en el proceso (ver `incidentNotes`) y
 * requiere atención manual antes de continuar.
 */
export const leadStatusEnum = pgEnum("lead_status", [
  "nuevo",
  "validado",
  "descartado",
  "asignado",
  "enviado",
  "contactado",
  "sin_cobertura",
  "cerrado",
  "con_incidencia",
]);

/** Nivel de intención de compra declarado por el propio usuario al pedir presupuestos. */
export const leadPurchaseIntentEnum = pgEnum("lead_purchase_intent", [
  "explorando",
  "comparando_presupuestos",
  "listo_para_contratar",
]);

/**
 * Cobro manual al profesional por el lead (sin pasarela de pago todavía).
 * `no_aplica`: no procede cobro (p. ej. lead descartado o sin cobertura).
 */
export const leadPaymentStatusEnum = pgEnum("lead_payment_status", ["no_aplica", "pendiente", "pagado"]);

export const professionalVerificationStatusEnum = pgEnum("professional_verification_status", [
  "pendiente",
  "verificado",
  "rechazado",
]);

/**
 * `borrador`: en edición, nunca se sirve en público. `publicado`: visible
 * en el sitio. `archivado`: existió, ya no se muestra, pero se conserva
 * (nunca se borra contenido publicado por si hay enlaces/índice de Google
 * apuntando a él — se archiva y esa URL puede empezar a dar 404 a propósito).
 */
export const contentStatusEnum = pgEnum("content_status", ["borrador", "publicado", "archivado"]);

export const analyticsEventTypeEnum = pgEnum("analytics_event_type", [
  "page_view",
  "calculator_start",
  "calculator_step",
  "estimate_result_view",
  "comparison_result_view",
  "lead_form_opened",
  "lead_submitted",
  "wizard_abandoned",
  "internal_search",
]);

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
  /** Clave de icono para el catálogo público (ver components/ui/icons.tsx), null = icono genérico. */
  iconKey: text("icon_key"),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

/**
 * Profesión dentro de una categoría (p. ej. "Instalador de aire
 * acondicionado" bajo "Aire acondicionado", o "Fontanero" bajo
 * "Instalaciones"). Capa de catalogación/SEO, separada de `serviceTypes`
 * a propósito: varias profesiones pueden compartir categoría, y una
 * profesión agrupa uno o más servicios concretos (cada uno con su propia
 * regla de precio, si la tiene).
 */
export const professions = pgTable(
  "professions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => serviceCategories.id),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    /** Texto informativo real para la página pública de la profesión (nunca relleno genérico). */
    description: text("description"),
    iconKey: text("icon_key"),
    /** `borrador` nunca se sirve en público — mismo criterio que seo_guides/seo_questions. */
    status: contentStatusEnum("status").notNull().default("borrador"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [unique().on(t.categoryId, t.slug)],
);

/**
 * `disponible`: tiene calculadora funcional y solicitud de presupuesto.
 * `solo_solicitud`: sin estimación automática todavía, pero se puede pedir
 * presupuesto directamente (sin inventar un rango de precio sin datos).
 * `proximamente`: solo página informativa + aviso de interés, nada más.
 */
export const serviceAvailabilityEnum = pgEnum("service_availability", [
  "disponible",
  "solo_solicitud",
  "proximamente",
]);

export const serviceTypes = pgTable(
  "service_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => serviceCategories.id),
    /**
     * Nullable a propósito: es la capa de catalogación añadida después de
     * `categoryId`, y no todos los entornos tienen por qué haber hecho ya
     * el backfill. La validación de que un servicio nuevo elija profesión
     * vive en `lib/admin/catalog/validation.ts`, no aquí.
     */
    professionId: uuid("profession_id").references(() => professions.id),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    /** Explica qué representa "cantidad" para este servicio (p. ej. "metros de línea adicionales"). */
    unitLabel: text("unit_label"),
    /** Si este servicio puede llegar a tributar al 10% de IVA reducido (obra en vivienda particular). */
    vatReducedEligible: boolean("vat_reduced_eligible").notNull().default(true),
    availabilityStatus: serviceAvailabilityEnum("availability_status").notNull().default("proximamente"),
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
  /** Una fuente obsoleta se desactiva (deja de poder citarse en un factor nuevo), nunca se borra. */
  isActive: boolean("is_active").notNull().default(true),
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

// ---------------------------------------------------------------------------
// Profesionales y leads — arquitectura de monetización.
//
// `professionals` empieza y sigue vacía hasta que exista una red real
// verificada: no se siembra ni un solo proveedor de ejemplo. `leads` sí es
// real desde el primer usuario: cada solicitud queda guardada aunque hoy
// no haya ningún profesional al que asignarla (estado `sin_cobertura`,
// nunca un match inventado).
// ---------------------------------------------------------------------------

export const professionals = pgTable("professionals", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  verificationStatus: professionalVerificationStatusEnum("verification_status").notNull().default("pendiente"),
  isActive: boolean("is_active").notNull().default(false),
  notes: text("notes"),
  ...timestamps,
});

/** A qué (servicio, región) atiende un profesional. `regionId` null = toda España. */
export const professionalServiceAreas = pgTable("professional_service_areas", {
  id: uuid("id").primaryKey().defaultRandom(),
  professionalId: uuid("professional_id")
    .notNull()
    .references(() => professionals.id),
  serviceTypeId: uuid("service_type_id")
    .notNull()
    .references(() => serviceTypes.id),
  regionId: uuid("region_id").references(() => regions.id),
  ...timestamps,
});

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  /**
   * Nullable a propósito: un servicio en estado `solo_solicitud` (sin
   * calculadora todavía) genera un lead sin haber pasado por una
   * Estimate — pedir presupuesto no puede depender de inventar un rango
   * de precio que no existe.
   */
  estimateId: uuid("estimate_id").references(() => estimates.id),
  /** Si el lead viene de una comparación (ya tenía un presupuesto), se referencia también. */
  comparisonId: uuid("comparison_id").references(() => budgetComparisons.id),
  serviceTypeId: uuid("service_type_id")
    .notNull()
    .references(() => serviceTypes.id),
  regionId: uuid("region_id").references(() => regions.id),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  /** Descripción libre adicional del trabajo, aparte de lo ya capturado en la Estimate/UserBudget. */
  description: text("description"),
  /** Cuándo quiere el usuario que se haga la instalación, en sus propias palabras (sin normativizar). */
  desiredTimeframe: text("desired_timeframe"),
  purchaseIntent: leadPurchaseIntentEnum("purchase_intent"),
  /** El usuario ha confirmado explícitamente que entiende que el rango es orientativo, no un precio cerrado. */
  rangeAcknowledged: boolean("range_acknowledged").notNull().default(false),
  status: leadStatusEnum("status").notNull().default("nuevo"),
  /** Motivo por el que se ha descartado, obligatorio cuando status = descartado (ver validación de la acción). */
  discardReason: text("discard_reason"),
  /** Profesional al que se ha asignado, si alguno (null mientras no haya red real). */
  assignedProfessionalId: uuid("assigned_professional_id").references(() => professionals.id),
  validatedAt: timestamp("validated_at", { withTimezone: true }),
  assignedAt: timestamp("assigned_at", { withTimezone: true }),
  sentToProfessionalAt: timestamp("sent_to_professional_at", { withTimezone: true }),
  contactedAt: timestamp("contacted_at", { withTimezone: true }),
  /** Resultado del contacto del profesional con el usuario, en texto libre (no hay integración real con el profesional todavía). */
  contactOutcome: text("contact_outcome"),
  /** Precio que el profesional y el usuario han acordado, si se ha registrado a mano. */
  agreedPrice: money("agreed_price"),
  paymentStatus: leadPaymentStatusEnum("payment_status").notNull().default("no_aplica"),
  paymentAmount: money("payment_amount"),
  paymentRegisteredAt: timestamp("payment_registered_at", { withTimezone: true }),
  incidentNotes: text("incident_notes"),
  /** Texto exacto del consentimiento aceptado, para poder demostrarlo (auditoría RGPD). */
  consentVersion: text("consent_version").notNull(),
  consentAcceptedAt: timestamp("consent_accepted_at", { withTimezone: true }).notNull(),
  /** De qué landing page SEO viene la sesión que generó este lead (atribución). */
  entryPath: text("entry_path"),
  ...timestamps,
});

/**
 * "Avísame cuando esté disponible" para un servicio en estado
 * `proximamente`. Deliberadamente mínima (solo email): no es un lead, no
 * se comparte con ningún profesional, solo mide interés real por servicio
 * antes de invertir en construir su calculadora.
 */
export const serviceInterestSignups = pgTable("service_interest_signups", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceTypeId: uuid("service_type_id")
    .notNull()
    .references(() => serviceTypes.id),
  email: text("email").notNull(),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Analítica propia — sin cookies de terceros. `sessionId` vive solo en
// sessionStorage del navegador (se pierde al cerrar la pestaña), nunca en
// una cookie persistente ni se comparte con nadie fuera de esta base de
// datos. Sirve para responder "qué página SEO produce leads", no para
// perfilar usuarios.
// ---------------------------------------------------------------------------

export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: analyticsEventTypeEnum("event_type").notNull(),
  sessionId: text("session_id").notNull(),
  /** Primera página de la sesión (para atribuir conversión a la landing page SEO de entrada). */
  entryPath: text("entry_path").notNull(),
  path: text("path").notNull(),
  estimateId: uuid("estimate_id").references(() => estimates.id),
  comparisonId: uuid("comparison_id").references(() => budgetComparisons.id),
  leadId: uuid("lead_id").references(() => leads.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Rate limiting — sin Redis: un contador de ventana fija por clave
// ("acción:ip") en la propia Postgres. Suficiente para el tráfico de un
// formulario público; si el volumen lo exigiera algún día, se sustituiría
// por un almacén en memoria compartido sin cambiar quién lo llama
// (lib/security/rate-limit.ts es el único punto de esa decisión).
// ---------------------------------------------------------------------------

export const rateLimitBuckets = pgTable("rate_limit_buckets", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull(),
});

// ---------------------------------------------------------------------------
// Contenido editorial gestionable desde /admin — sustituye a los arrays de
// TypeScript que antes vivían en lib/content/*.ts y en cada page.tsx
// (FAQ_ITEMS hardcodeados). Todo lo que es información comercial/editorial
// (preguntas, guías, FAQs) vive aquí; el CÓDIGO solo sabe leerlo y
// renderizarlo — nunca contiene el texto en sí.
// ---------------------------------------------------------------------------

/** Guías largas (plantilla "Guías" de docs/04). Cuerpo estructurado en bloques, ver lib/content/blocks.ts. */
export const seoGuides = pgTable("seo_guides", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  metaDescription: text("meta_description").notNull(),
  intro: text("intro").notNull(),
  body: jsonb("body").$type<GuideBlock[]>().notNull(),
  /** CTA principal (botón destacado), distinto de los enlaces relacionados de abajo. Opcional. */
  ctaHref: text("cta_href"),
  ctaLabel: text("cta_label"),
  relatedLinks: jsonb("related_links").$type<RelatedLinkEntry[]>().notNull().default([]),
  status: contentStatusEnum("status").notNull().default("borrador"),
  /** Se incrementa cada vez que se publica una edición — para poder citar "versión N" igual que en pricing_rules. */
  version: integer("version").notNull().default(1),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ...timestamps,
});

/** Preguntas concretas (plantilla "Preguntas" de docs/04): una intención real por fila. */
export const seoQuestions = pgTable("seo_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  question: text("question").notNull(),
  shortAnswer: text("short_answer").notNull(),
  detail: jsonb("detail").$type<string[]>().notNull(),
  relatedLinks: jsonb("related_links").$type<RelatedLinkEntry[]>().notNull().default([]),
  status: contentStatusEnum("status").notNull().default("borrador"),
  version: integer("version").notNull().default(1),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ...timestamps,
});

/**
 * FAQ de una página concreta (home, calculadora, precios...), identificada
 * por `pageKey` — no son las guías/preguntas de arriba (esas son páginas
 * propias); esto es el bloque de preguntas frecuentes embebido dentro de
 * OTRA página. `pageKey` es una clave estable que cada page.tsx declara al
 * pedir sus FAQs (ver lib/content/repository.ts).
 */
export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageKey: text("page_key").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ...timestamps,
});

/**
 * Quién cambió qué desde /admin y cuándo — la mitad "administrativa" de la
 * auditoría (la otra mitad, "por qué esta estimación dio este rango", no
 * necesita tabla propia: se reconstruye consultando estimate_items ->
 * pricing_factors -> data_sources, que ya quedan enlazados por id).
 * `actor` es un texto simple porque hoy solo existe un admin (ver
 * lib/admin/auth.ts) — el día que haya varios, esta columna ya está lista
 * para llevar su identificador real sin cambiar el esquema.
 */
export const adminAuditLog = pgTable("admin_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
