import type { FactorCondition } from "./condition-types";

export type Confidence = "A" | "B" | "C";
export type FactorKind = "base" | "multiplier" | "additive";

/**
 * Representación plana de una fila de `pricing_factors`, desacoplada de
 * Drizzle a propósito: el motor de evaluación no sabe que existe una base
 * de datos, así que se puede testear con datos de fixture puros.
 */
export interface PlainFactor {
  id: string;
  key: string;
  label: string;
  kind: FactorKind;
  groupKey: string;
  perUnitOfQuantity?: string | null;
  valueMin: number;
  valueMax: number;
  condition?: FactorCondition | null;
  confidence: Confidence;
}

export interface UncertaintyBand {
  label: string;
  minConfidenceScore: number;
  maxConfidenceScore: number;
  paddingPct: number;
}

export interface VatRateOption {
  scenario: string;
  ratePct: number;
  description: string;
}

/** Entrada validada que recibe el motor. Todo lo que no sea numérico/booleano es una `selection`. */
export interface EstimationInput {
  selections: Record<string, string>;
  quantities: Record<string, number>;
  flags: Record<string, boolean>;
  regionSlug?: string | null;
}

export interface EstimateLineItem {
  key: string;
  label: string;
  kind: FactorKind;
  groupKey: string;
  min: number;
  max: number;
  confidence: Confidence;
  /** true = solo aparece si el input lo activa (extra, ajuste); false = parte del núcleo del cálculo. */
  isOptional: boolean;
}

export interface EstimateRangeGroup {
  groupKey: string;
  label: string;
  min: number;
  max: number;
}

export interface TraceStep {
  label: string;
  detail: string;
  runningMin: number;
  runningMax: number;
}

export interface VatDecision {
  scenario: string;
  ratePct: number;
  materialesSharePct: number;
  motivo: string;
}

export interface EvaluationResult {
  items: EstimateLineItem[];
  ranges: EstimateRangeGroup[];
  confidenceScore: number;
  uncertaintyBand: UncertaintyBand;
  vat: VatDecision;
  subtotal: { min: number; max: number };
  total: { min: number; max: number };
  trace: TraceStep[];
  warnings: string[];
}
