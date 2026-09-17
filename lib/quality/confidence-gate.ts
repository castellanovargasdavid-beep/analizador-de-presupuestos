/**
 * Deriva el nivel de confianza JUSTIFICABLE de una regla de precio a
 * partir de datos reales — nunca a partir de una decisión manual. Ver
 * docs/CALCULATOR-QUALITY-STANDARD.md para la definición completa de cada
 * criterio; este fichero es su implementación mecánica.
 *
 * Motor puro, sin acceso a base de datos (igual que lib/estimation/engine.ts):
 * recibe los datos ya cargados y devuelve un veredicto explicable. La capa
 * que sí toca Postgres es lib/quality/repository.ts.
 *
 * Principio de diseño: este archivo NUNCA debe tener un modo de "forzar" un
 * nivel. Si en el futuro alguien necesita que un servicio muestre "A" sin
 * cumplir los criterios, la respuesta correcta es cambiar los datos reales
 * (conseguir muestras, revisar la metodología), nunca añadir un parámetro
 * que lo salte.
 */
import type { Confidence, SourceType } from "./types";

/** Ver docs/CALCULATOR-QUALITY-STANDARD.md §5 para la justificación de cada umbral. */
export const QUALITY_THRESHOLDS = {
  MIN_SAMPLE_SIZE_FOR_A: 20,
  MIN_HIT_RATE_FOR_A: 0.7,
  MAX_ABS_BIAS_FOR_A: 0.15,
  REVIEW_INTERVAL_MONTHS_FOR_A: 12,
} as const;

export interface GateFactorInput {
  key: string;
  kind: "base" | "multiplier" | "additive";
  isActive: boolean;
  sourceType: SourceType | null;
  sourceIsActive: boolean | null;
  sourceRetrievedOn: string | null;
}

export interface GateRuleInput {
  methodologyDocPath: string | null;
  geographicScope: string | null;
  lastReviewedAt: Date | null;
  whatIncluded: string | null;
  whatExcluded: string | null;
}

export interface GateValidationInput {
  sampleSize: number;
  hitRatePct: number | null;
  biasPct: number | null;
}

export interface GateCriterion {
  id: string;
  label: string;
  met: boolean;
  detail: string;
}

export interface ConfidenceGateResult {
  level: Confidence;
  /** Todos los criterios evaluados para el nivel más alto solicitado, cumplidos o no — para mostrar en el admin. */
  criteria: GateCriterion[];
  /** Motivos concretos, en lenguaje llano, de por qué no se alcanzó un nivel superior. Vacío si se alcanzó el máximo (A). */
  blockingReasons: string[];
}

function evaluateBCriteria(rule: GateRuleInput, factors: GateFactorInput[]): GateCriterion[] {
  const activeFactors = factors.filter((f) => f.isActive);
  const baseFactors = activeFactors.filter((f) => f.kind === "base");

  const hasNonHeuristicSource = baseFactors.some(
    (f) => f.sourceType !== null && f.sourceType !== "heuristica_propia",
  );
  const everyFactorHasSource = activeFactors.every((f) => f.sourceType !== null && f.sourceRetrievedOn !== null);
  const noExpiredSource = activeFactors.every((f) => f.sourceIsActive !== false);

  return [
    {
      id: "B1_methodology_doc",
      label: "Existe documento de metodología específico",
      met: Boolean(rule.methodologyDocPath),
      detail: rule.methodologyDocPath
        ? `Documentado en ${rule.methodologyDocPath}`
        : "No hay ningún documento de metodología enlazado (pricing_rules.methodologyDocPath).",
    },
    {
      id: "B2_scope_defined",
      label: "Alcance incluido/excluido definido",
      met: Boolean(rule.whatIncluded) && Boolean(rule.whatExcluded),
      detail:
        Boolean(rule.whatIncluded) && Boolean(rule.whatExcluded)
          ? "whatIncluded y whatExcluded están rellenos."
          : "Falta describir qué incluye y/o qué excluye el cálculo (service_types.whatIncluded/whatExcluded).",
    },
    {
      id: "B3_geographic_scope",
      label: "Cobertura geográfica declarada",
      met: Boolean(rule.geographicScope),
      detail: rule.geographicScope
        ? `Cobertura declarada: ${rule.geographicScope}`
        : "No se ha declarado la cobertura geográfica de esta fórmula (pricing_rules.geographicScope).",
    },
    {
      id: "B4_not_purely_heuristic",
      label: "Al menos un factor base no depende únicamente de una heurística propia",
      met: baseFactors.length > 0 && hasNonHeuristicSource,
      detail:
        baseFactors.length === 0
          ? "No hay ningún factor 'base' activo que evaluar."
          : hasNonHeuristicSource
            ? "Al menos un factor base cita una fuente externa (oficial, catálogo real o de mercado)."
            : "Todos los factores base se apoyan únicamente en heurística propia, sin ningún dato externo.",
    },
    {
      id: "B5_every_factor_sourced",
      label: "Cada factor activo cita una fuente con fecha de consulta",
      met: everyFactorHasSource,
      detail: everyFactorHasSource
        ? "Todos los factores activos tienen sourceId y fecha de consulta."
        : "Hay al menos un factor activo sin fuente citada o sin fecha de consulta registrada.",
    },
    {
      id: "B6_reviewed",
      label: "La regla ha pasado al menos una revisión formal",
      met: rule.lastReviewedAt !== null,
      detail: rule.lastReviewedAt
        ? `Última revisión: ${rule.lastReviewedAt.toISOString().slice(0, 10)}`
        : "pricing_rules.lastReviewedAt está vacío: la metodología nunca se ha revisado formalmente.",
    },
    {
      id: "B7_no_expired_sources",
      label: "Ninguna fuente citada está desactivada/caducada",
      met: noExpiredSource,
      detail: noExpiredSource
        ? "Todas las fuentes citadas siguen activas."
        : "Al menos un factor activo cita una fuente que ya se marcó como inactiva (data_sources.isActive = false).",
    },
  ];
}

function evaluateACriteria(rule: GateRuleInput, validation: GateValidationInput | null, now: Date): GateCriterion[] {
  const sampleSize = validation?.sampleSize ?? 0;
  const hitRatePct = validation?.hitRatePct ?? null;
  const biasPct = validation?.biasPct ?? null;

  const reviewAgeMonths = rule.lastReviewedAt
    ? (now.getTime() - rule.lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    : null;

  return [
    {
      id: "A1_sample_size",
      label: `Muestra de al menos ${QUALITY_THRESHOLDS.MIN_SAMPLE_SIZE_FOR_A} presupuestos reales`,
      met: sampleSize >= QUALITY_THRESHOLDS.MIN_SAMPLE_SIZE_FOR_A,
      detail: `${sampleSize} muestra(s) registrada(s) en price_validation_samples (mínimo exigido: ${QUALITY_THRESHOLDS.MIN_SAMPLE_SIZE_FOR_A}).`,
    },
    {
      id: "A2_hit_rate",
      label: `Al menos ${Math.round(QUALITY_THRESHOLDS.MIN_HIT_RATE_FOR_A * 100)}% de aciertos dentro de rango`,
      met: hitRatePct !== null && hitRatePct >= QUALITY_THRESHOLDS.MIN_HIT_RATE_FOR_A,
      detail:
        hitRatePct === null
          ? "No se puede calcular el porcentaje de acierto: no hay muestras con Estimate asociada para comparar."
          : `${Math.round(hitRatePct * 100)}% de los casos reales cayeron dentro del rango estimado (mínimo exigido: ${Math.round(QUALITY_THRESHOLDS.MIN_HIT_RATE_FOR_A * 100)}%).`,
    },
    {
      id: "A3_no_systematic_bias",
      label: `Sesgo sistemático dentro de ±${Math.round(QUALITY_THRESHOLDS.MAX_ABS_BIAS_FOR_A * 100)}%`,
      met: biasPct !== null && Math.abs(biasPct) <= QUALITY_THRESHOLDS.MAX_ABS_BIAS_FOR_A,
      detail:
        biasPct === null
          ? "No se puede calcular el sesgo: no hay muestras suficientes con Estimate asociada."
          : `Sesgo medido: ${(biasPct * 100).toFixed(1)}% (${biasPct > 0 ? "el sistema tiende a sobrevalorar" : "el sistema tiende a infravalorar"}). Límite: ±${Math.round(QUALITY_THRESHOLDS.MAX_ABS_BIAS_FOR_A * 100)}%.`,
    },
    {
      id: "A4_review_current",
      label: `Revisión vigente (menos de ${QUALITY_THRESHOLDS.REVIEW_INTERVAL_MONTHS_FOR_A} meses)`,
      met: reviewAgeMonths !== null && reviewAgeMonths <= QUALITY_THRESHOLDS.REVIEW_INTERVAL_MONTHS_FOR_A,
      detail:
        reviewAgeMonths === null
          ? "No hay ninguna revisión registrada todavía."
          : `Última revisión hace ${reviewAgeMonths.toFixed(1)} meses (límite: ${QUALITY_THRESHOLDS.REVIEW_INTERVAL_MONTHS_FOR_A}).`,
    },
  ];
}

/**
 * Calcula el nivel de confianza justificable HOY para una regla de precio.
 * Evalúa siempre los criterios de B; si B se cumple entero, evalúa también
 * los de A. Nunca devuelve A si algún criterio de B falla, aunque la
 * validación empírica sea perfecta — A exige B como base, no lo sustituye.
 */
export function computeJustifiableConfidence(
  rule: GateRuleInput,
  factors: GateFactorInput[],
  validation: GateValidationInput | null,
  now: Date = new Date(),
): ConfidenceGateResult {
  const bCriteria = evaluateBCriteria(rule, factors);
  const bMet = bCriteria.every((c) => c.met);

  if (!bMet) {
    return {
      level: "C",
      criteria: bCriteria,
      blockingReasons: bCriteria.filter((c) => !c.met).map((c) => c.detail),
    };
  }

  const aCriteria = evaluateACriteria(rule, validation, now);
  const aMet = aCriteria.every((c) => c.met);
  const allCriteria = [...bCriteria, ...aCriteria];

  if (!aMet) {
    return {
      level: "B",
      criteria: allCriteria,
      blockingReasons: aCriteria.filter((c) => !c.met).map((c) => c.detail),
    };
  }

  return { level: "A", criteria: allCriteria, blockingReasons: [] };
}
