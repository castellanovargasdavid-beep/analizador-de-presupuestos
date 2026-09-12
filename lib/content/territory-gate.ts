/**
 * Puerta de generación de páginas de territorio (docs/02, sección 5): una
 * página regional ("precio instalar aire acondicionado en Madrid") solo se
 * genera si hay evidencia real, nunca por sustituir el nombre de una
 * ciudad en una plantilla. Función pura para poder testear el umbral sin
 * tocar la base de datos; `lib/estimation/repository.ts` aporta el conteo
 * real vía `countEstimatesByRegion`.
 */

/** Por debajo de esto, un rango "propio" por región sería ruido estadístico, no una señal. */
export const MIN_OWN_ESTIMATES_FOR_TERRITORY_PAGE = 30;

export interface TerritoryGateInput {
  regionSlug: string;
  ownEstimateCount: number;
  /**
   * Fuente de mercado verificada y citable (no un blog SEO) con un
   * diferencial real para esta región — hoy no hay ninguna así de
   * curada; se deja preparado para cuando docs/01 documente una.
   */
  hasCitedMarketDifferential: boolean;
}

export interface TerritoryGateResult {
  allowed: boolean;
  reason: string;
}

export function canGenerateTerritoryPage(input: TerritoryGateInput): TerritoryGateResult {
  if (input.ownEstimateCount >= MIN_OWN_ESTIMATES_FOR_TERRITORY_PAGE) {
    return {
      allowed: true,
      reason: `${input.ownEstimateCount} estimaciones propias registradas para ${input.regionSlug} (umbral: ${MIN_OWN_ESTIMATES_FOR_TERRITORY_PAGE}).`,
    };
  }
  if (input.hasCitedMarketDifferential) {
    return {
      allowed: true,
      reason: `Existe una fuente de mercado citable y verificada con diferencial propio para ${input.regionSlug}.`,
    };
  }
  return {
    allowed: false,
    reason:
      `Solo ${input.ownEstimateCount} estimaciones propias (umbral: ${MIN_OWN_ESTIMATES_FOR_TERRITORY_PAGE}) y sin ` +
      `fuente de mercado citable verificada todavía para ${input.regionSlug}.`,
  };
}
