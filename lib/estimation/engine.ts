/**
 * Motor de evaluación — puro, sin acceso a base de datos. Recibe los
 * factores ya cargados (de Postgres en producción, de fixtures en tests) y
 * calcula el rango explicable.
 *
 * Orden de cálculo (el mismo que se muestra en la traza):
 *   1. Factores base (equipo, mano de obra, paquete de conductos...) — se
 *      agrupan por `groupKey` y se SUMAN dentro de cada grupo.
 *   2. Factores aditivos (extras condicionales, por unidad o planos).
 *   3. Suma de todos los grupos -> subtotal antes de ubicación.
 *   4. Multiplicadores (p. ej. ajuste por zona) -> subtotal ajustado.
 *   5. Incertidumbre: ensancha el rango según la confianza agregada.
 *   6. IVA (10%/21% según el test legal) -> total con IVA incluido.
 *
 * Ningún resultado puede ser negativo: se recorta a 0 en cada paso.
 */
import { matchesCondition, type EvaluationScalar } from "./condition-types";
import { InvalidEstimationInputError, MissingPricingDataError } from "./errors";
import { computeConfidenceScore, pickUncertaintyBand, type ConfidenceContribution } from "./uncertainty";
import type { VatEligibilityInput } from "./vat";
import { decideVatScenario } from "./vat";
import type {
  EstimateLineItem,
  EstimateRangeGroup,
  EstimationInput,
  EvaluationResult,
  PlainFactor,
  TraceStep,
  UncertaintyBand,
  VatRateOption,
} from "./types";

const GROUP_LABELS: Record<string, string> = {
  equipo: "Equipo",
  mano_obra: "Mano de obra",
  extras: "Extras",
  paquete_conductos: "Equipo + instalación (conductos)",
  ubicacion: "Ajuste por ubicación",
  subtotal: "Subtotal (antes de IVA)",
  iva: "IVA",
  total: "Total estimado",
};

function clampNonNegative(range: { min: number; max: number }): { min: number; max: number } {
  return { min: Math.max(0, range.min), max: Math.max(0, range.max) };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildContext(input: EstimationInput): Record<string, EvaluationScalar> {
  return {
    ...input.selections,
    ...input.quantities,
    ...input.flags,
    regionSlug: input.regionSlug ?? undefined,
  };
}

export interface EvaluateArgs {
  factors: PlainFactor[];
  input: EstimationInput;
  uncertaintyBands: UncertaintyBand[];
  vatRates: VatRateOption[];
  vatEligibility: Omit<VatEligibilityInput, "materialesSharePct" | "serviceTypeVatReducedEligible">;
  serviceTypeVatReducedEligible: boolean;
}

export function evaluateEstimate(args: EvaluateArgs): EvaluationResult {
  const { factors, input, uncertaintyBands, vatRates } = args;

  if (factors.length === 0) {
    throw new MissingPricingDataError("No hay factores de precio activos para este servicio y regla.");
  }

  const context = buildContext(input);
  const matched = factors.filter((f) => f.condition === null || f.condition === undefined || matchesCondition(f.condition, context));

  const items: EstimateLineItem[] = [];
  const trace: TraceStep[] = [];
  const warnings: string[] = [];
  const contributions: ConfidenceContribution[] = [];
  const groupTotals = new Map<string, { min: number; max: number }>();

  function addToGroup(groupKey: string, min: number, max: number) {
    const current = groupTotals.get(groupKey) ?? { min: 0, max: 0 };
    groupTotals.set(groupKey, { min: current.min + min, max: current.max + max });
  }

  // 1-2. Base + aditivos
  for (const factor of matched) {
    if (factor.kind === "multiplier") continue; // se procesan después, sobre el subtotal

    let min = factor.valueMin;
    let max = factor.valueMax;

    if (factor.perUnitOfQuantity) {
      const quantity = input.quantities[factor.perUnitOfQuantity] ?? 0;
      if (quantity <= 0) continue; // no se factura ni se muestra si no aplica
      min *= quantity;
      max *= quantity;
    }

    addToGroup(factor.groupKey, min, max);
    items.push({
      key: factor.key,
      label: factor.label,
      kind: factor.kind,
      groupKey: factor.groupKey,
      min: round2(min),
      max: round2(max),
      confidence: factor.confidence,
      isOptional: factor.kind === "additive",
    });
    contributions.push({ confidence: factor.confidence, magnitude: (min + max) / 2 });
    trace.push({
      label: factor.label,
      detail: `${factor.kind === "additive" ? "+ " : ""}${min.toFixed(2)}–${max.toFixed(2)} €`,
      runningMin: 0,
      runningMax: 0,
    });
  }

  if (groupTotals.size === 0) {
    throw new InvalidEstimationInputError(
      "Ningún factor de precio coincide con esta combinación de selecciones. Revisa el input (¿systemType/materialLevel válidos?).",
    );
  }

  let preMultiplier = { min: 0, max: 0 };
  for (const [groupKey, total] of groupTotals) {
    preMultiplier = { min: preMultiplier.min + total.min, max: preMultiplier.max + total.max };
    trace.push({
      label: `Subtotal ${GROUP_LABELS[groupKey] ?? groupKey}`,
      detail: `${total.min.toFixed(2)}–${total.max.toFixed(2)} €`,
      runningMin: total.min,
      runningMax: total.max,
    });
  }

  // 4. Multiplicadores (ubicación, etc.) sobre el subtotal completo
  const multiplierFactors = matched.filter((f) => f.kind === "multiplier");
  let multMin = 1;
  let multMax = 1;
  for (const factor of multiplierFactors) {
    multMin *= factor.valueMin;
    multMax *= factor.valueMax;
    const midpoint = (preMultiplier.min + preMultiplier.max) / 2;
    const factorMid = (factor.valueMin + factor.valueMax) / 2;
    contributions.push({ confidence: factor.confidence, magnitude: Math.abs((factorMid - 1) * midpoint) });
    // Se muestra como impacto en euros (no como ratio en bruto: un "1.08" sería
    // ilegible formateado como moneda), consistente con el resto de partidas.
    items.push({
      key: factor.key,
      label: factor.label,
      kind: "multiplier",
      groupKey: factor.groupKey,
      min: round2(preMultiplier.min * (factor.valueMin - 1)),
      max: round2(preMultiplier.max * (factor.valueMax - 1)),
      confidence: factor.confidence,
      isOptional: true,
    });
  }

  const afterMultiplier = clampNonNegative({
    min: preMultiplier.min * multMin,
    max: preMultiplier.max * multMax,
  });
  if (multiplierFactors.length > 0) {
    trace.push({
      label: "Ajuste por ubicación",
      detail: `× ${multMin.toFixed(2)}–${multMax.toFixed(2)}`,
      runningMin: afterMultiplier.min,
      runningMax: afterMultiplier.max,
    });
  }

  // 5. Incertidumbre
  const confidenceScore = computeConfidenceScore(contributions);
  const band = pickUncertaintyBand(confidenceScore, uncertaintyBands);
  const padded = clampNonNegative({
    min: afterMultiplier.min * (1 - band.paddingPct),
    max: afterMultiplier.max * (1 + band.paddingPct),
  });
  trace.push({
    label: `Incertidumbre (${band.label})`,
    detail: `± ${(band.paddingPct * 100).toFixed(0)}%`,
    runningMin: padded.min,
    runningMax: padded.max,
  });

  const subtotal = { min: round2(padded.min), max: round2(padded.max) };

  // 6. IVA
  const equipoRange = groupTotals.get("equipo") ?? groupTotals.get("paquete_conductos") ?? { min: 0, max: 0 };
  const equipoMid = (equipoRange.min + equipoRange.max) / 2;
  const preMultiplierMid = (preMultiplier.min + preMultiplier.max) / 2;
  const materialesSharePct = preMultiplierMid > 0 ? equipoMid / preMultiplierMid : 0;

  const vat = decideVatScenario(
    {
      serviceTypeVatReducedEligible: args.serviceTypeVatReducedEligible,
      clientePersonaFisicaUsoParticular: args.vatEligibility.clientePersonaFisicaUsoParticular,
      viviendaMasDeDosAnos: args.vatEligibility.viviendaMasDeDosAnos,
      materialesSharePct,
    },
    vatRates,
  );

  const total = clampNonNegative({
    min: subtotal.min * (1 + vat.ratePct),
    max: subtotal.max * (1 + vat.ratePct),
  });
  trace.push({
    label: `IVA (${(vat.ratePct * 100).toFixed(0)}%)`,
    detail: vat.motivo,
    runningMin: total.min,
    runningMax: total.max,
  });

  const ranges: EstimateRangeGroup[] = [
    ...Array.from(groupTotals.entries()).map(([groupKey, r]) => ({
      groupKey,
      label: GROUP_LABELS[groupKey] ?? groupKey,
      min: round2(r.min),
      max: round2(r.max),
    })),
    { groupKey: "subtotal", label: GROUP_LABELS.subtotal, min: subtotal.min, max: subtotal.max },
    {
      groupKey: "iva",
      label: GROUP_LABELS.iva,
      min: round2(total.min - subtotal.min),
      max: round2(total.max - subtotal.max),
    },
    { groupKey: "total", label: GROUP_LABELS.total, min: round2(total.min), max: round2(total.max) },
  ];

  if (band.paddingPct >= 0.15) {
    warnings.push(
      "Esta estimación se apoya en gran medida en heurísticas propias (confianza C), así que el rango se ha " +
        "ensanchado deliberadamente. Trátalo como una referencia amplia, no como una cifra ajustada.",
    );
  }

  return {
    items,
    ranges,
    confidenceScore: round2(confidenceScore * 100) / 100,
    uncertaintyBand: band,
    vat,
    subtotal,
    total: { min: round2(total.min), max: round2(total.max) },
    trace,
    warnings,
  };
}
