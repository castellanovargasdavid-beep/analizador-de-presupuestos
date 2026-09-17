/**
 * Métricas de error de una calculadora frente a presupuestos reales — ver
 * docs/PRICE-VALIDATION-PROTOCOL.md. Motor puro (sin Drizzle): recibe las
 * muestras ya cargadas (`lib/quality/repository.ts` hace el join real con
 * Postgres) y devuelve las métricas exigidas por
 * docs/CALCULATOR-QUALITY-STANDARD.md.
 *
 * Solo las muestras con una Estimate de calculadora asociada
 * (`relatedEstimateId`) pueden compararse contra un rango — un lead de un
 * servicio `solo_solicitud` no tiene rango con el que contrastar, así que
 * cuenta para el catálogo de precios reales pero no para el error medido.
 * Esto se refleja separando `comparableSampleSize` de `totalSampleSize` en
 * el resultado, en vez de fingir que todas las muestras son comparables.
 */

export const EXTREME_CASE_THRESHOLD_PCT = 0.5;

export interface ValidationSampleForMetrics {
  id: string;
  finalPriceWithVat: number;
  /** Rango de la Estimate asociada, o null si no hay ninguna (p. ej. lead solo_solicitud). */
  estimateRange: { totalMin: number; totalMax: number } | null;
}

export interface ExtremeCase {
  sampleId: string;
  finalPriceWithVat: number;
  estimateMidpoint: number;
  absolutePercentError: number;
}

export interface ValidationMetricsResult {
  totalSampleSize: number;
  /** Muestras que sí tienen una Estimate asociada y por tanto entran en el resto de métricas. */
  comparableSampleSize: number;
  /** Error absoluto medio, en euros, entre el punto medio del rango estimado y el precio real. Null si no hay muestras comparables. */
  meanAbsoluteError: number | null;
  /** Error porcentual medio (MAPE), relativo al precio real. Null si no hay muestras comparables. */
  meanAbsolutePercentError: number | null;
  /** Mediana del error porcentual absoluto — menos sensible a casos extremos que la media. Null si no hay muestras comparables. */
  medianAbsolutePercentError: number | null;
  /** % de casos en los que el precio real cae dentro de [totalMin, totalMax] del rango estimado. Null si no hay muestras comparables. */
  hitRatePct: number | null;
  /**
   * Sesgo sistemático medio: media de (puntoMedioEstimado - precioReal) / precioReal.
   * Positivo => el sistema tiende a SOBREVALORAR. Negativo => tiende a INFRAVALORAR.
   * Null si no hay muestras comparables.
   */
  biasPct: number | null;
  /** Casos donde el error porcentual supera EXTREME_CASE_THRESHOLD_PCT, para revisión manual. */
  extremeCases: ExtremeCase[];
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function computeValidationMetrics(samples: ValidationSampleForMetrics[]): ValidationMetricsResult {
  const totalSampleSize = samples.length;
  const comparable = samples.filter(
    (s): s is ValidationSampleForMetrics & { estimateRange: { totalMin: number; totalMax: number } } =>
      s.estimateRange !== null,
  );
  const comparableSampleSize = comparable.length;

  if (comparableSampleSize === 0) {
    return {
      totalSampleSize,
      comparableSampleSize: 0,
      meanAbsoluteError: null,
      meanAbsolutePercentError: null,
      medianAbsolutePercentError: null,
      hitRatePct: null,
      biasPct: null,
      extremeCases: [],
    };
  }

  const perSample = comparable.map((s) => {
    const midpoint = (s.estimateRange.totalMin + s.estimateRange.totalMax) / 2;
    const absoluteError = Math.abs(midpoint - s.finalPriceWithVat);
    const percentError = absoluteError / s.finalPriceWithVat;
    const signedRelativeError = (midpoint - s.finalPriceWithVat) / s.finalPriceWithVat;
    const withinRange = s.finalPriceWithVat >= s.estimateRange.totalMin && s.finalPriceWithVat <= s.estimateRange.totalMax;
    return { id: s.id, midpoint, absoluteError, percentError, signedRelativeError, withinRange };
  });

  const meanAbsoluteError = perSample.reduce((sum, s) => sum + s.absoluteError, 0) / comparableSampleSize;
  const meanAbsolutePercentError = perSample.reduce((sum, s) => sum + s.percentError, 0) / comparableSampleSize;
  const medianAbsolutePercentError = median(perSample.map((s) => s.percentError));
  const hitRatePct = perSample.filter((s) => s.withinRange).length / comparableSampleSize;
  const biasPct = perSample.reduce((sum, s) => sum + s.signedRelativeError, 0) / comparableSampleSize;

  const extremeCases: ExtremeCase[] = perSample
    .filter((s) => s.percentError > EXTREME_CASE_THRESHOLD_PCT)
    .map((s) => ({
      sampleId: s.id,
      finalPriceWithVat: comparable.find((c) => c.id === s.id)!.finalPriceWithVat,
      estimateMidpoint: s.midpoint,
      absolutePercentError: s.percentError,
    }));

  return {
    totalSampleSize,
    comparableSampleSize,
    meanAbsoluteError,
    meanAbsolutePercentError,
    medianAbsolutePercentError,
    hitRatePct,
    biasPct,
    extremeCases,
  };
}
