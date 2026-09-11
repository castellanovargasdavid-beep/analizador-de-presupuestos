/**
 * Ensancha el rango final según la mezcla de confianza (A/B/C) de los
 * factores que han contribuido. Es una heurística explícita sobre
 * heurísticas: documentada aquí, no escondida en un número mágico.
 *
 * Peso de cada nivel de confianza (cuánto "cuenta" para el score, no un
 * precio): A=1, B=0.6, C=0.25. El score final es la media ponderada por la
 * magnitud (en euros) de la contribución de cada factor — un factor C que
 * apenas mueve el precio no debería penalizar tanto como uno C que domina
 * el resultado.
 */
import { MissingPricingDataError } from "./errors";
import type { Confidence, UncertaintyBand } from "./types";

const CONFIDENCE_WEIGHT: Record<Confidence, number> = { A: 1, B: 0.6, C: 0.25 };

export interface ConfidenceContribution {
  confidence: Confidence;
  /** Magnitud (valor absoluto) de la contribución en euros; determina el peso en la media. */
  magnitude: number;
}

export function computeConfidenceScore(contributions: ConfidenceContribution[]): number {
  const totalWeight = contributions.reduce((sum, c) => sum + Math.abs(c.magnitude), 0);
  if (totalWeight === 0) return 1;
  const weighted = contributions.reduce(
    (sum, c) => sum + Math.abs(c.magnitude) * CONFIDENCE_WEIGHT[c.confidence],
    0,
  );
  return weighted / totalWeight;
}

export function pickUncertaintyBand(score: number, bands: UncertaintyBand[]): UncertaintyBand {
  const found = bands.find((b) => score >= b.minConfidenceScore && score <= b.maxConfidenceScore);
  if (!found) {
    throw new MissingPricingDataError(
      `No hay una banda de incertidumbre configurada que cubra el score de confianza ${score}.`,
    );
  }
  return found;
}
