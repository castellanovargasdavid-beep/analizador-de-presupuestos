import { describe, expect, it } from "vitest";
import { compareBudget } from "./compare";
import { evaluateEstimate } from "./engine";
import { AIRE_ACONDICIONADO_INSTALACION_FACTORS, UNCERTAINTY_BANDS_DEF, VAT_RATES_DEF } from "./seed-data";
import type { EstimationInput, PlainFactor } from "./types";

const FACTORS: PlainFactor[] = AIRE_ACONDICIONADO_INSTALACION_FACTORS.map((f, i) => ({
  id: `factor-${i}`,
  key: f.key,
  label: f.label,
  kind: f.kind,
  groupKey: f.groupKey,
  perUnitOfQuantity: f.perUnitOfQuantity,
  valueMin: f.valueMin,
  valueMax: f.valueMax,
  confidence: f.confidence,
  condition: JSON.parse(JSON.stringify(f.condition ?? null).replace(/__MADRID__|__CATALUNA__/g, "andalucia")),
}));

const input: EstimationInput = {
  selections: { systemType: "split-1x1", materialLevel: "media", retiradaEquipo: "no" },
  quantities: { metrosLineaFrigorificaExtra: 0, canaletaVistaMetros: 0 },
  flags: { necesitaBombaCondensados: false, instalacionElectricaDedicada: false, accesoDificil: false },
  regionSlug: null,
};

function evaluate() {
  return evaluateEstimate({
    factors: FACTORS,
    input,
    uncertaintyBands: UNCERTAINTY_BANDS_DEF,
    vatRates: VAT_RATES_DEF,
    vatEligibility: { clientePersonaFisicaUsoParticular: true, viviendaMasDeDosAnos: true },
    serviceTypeVatReducedEligible: true,
  });
}

describe("compareBudget", () => {
  it("marca 'dentro_de_rango' cuando el total declarado cae en el rango", () => {
    const evaluation = evaluate();
    const mid = (evaluation.total.min + evaluation.total.max) / 2;
    const result = compareBudget(evaluation, { total: mid }, { riteSuperaUmbral: false });
    expect(result.verdict).toBe("dentro_de_rango");
    expect(result.deviationPct).toBe(0);
  });

  it("marca 'por_encima' y calcula la desviación cuando el total supera el máximo", () => {
    const evaluation = evaluate();
    const declarado = evaluation.total.max + 500;
    const result = compareBudget(evaluation, { total: declarado }, { riteSuperaUmbral: false });
    expect(result.verdict).toBe("por_encima");
    expect(result.deviationAbsolute).toBeCloseTo(500);
    expect(result.posiblesRazones.length).toBeGreaterThan(0);
  });

  it("marca 'por_debajo' cuando el total no llega al mínimo", () => {
    const evaluation = evaluate();
    const declarado = Math.max(1, evaluation.total.min - 200);
    const result = compareBudget(evaluation, { total: declarado }, { riteSuperaUmbral: false });
    expect(result.verdict).toBe("por_debajo");
  });

  it("nunca acusa: no hay ningún texto de razones para el caso dentro de rango", () => {
    const evaluation = evaluate();
    const mid = (evaluation.total.min + evaluation.total.max) / 2;
    const result = compareBudget(evaluation, { total: mid }, { riteSuperaUmbral: false });
    expect(result.posiblesRazones).toHaveLength(0);
  });

  it("marca 'no_declarado' en las partidas que el usuario no ha rellenado", () => {
    const evaluation = evaluate();
    const result = compareBudget(evaluation, { total: evaluation.total.min }, { riteSuperaUmbral: false });
    const equipo = result.lineVerdicts.find((l) => l.groupKey === "equipo");
    expect(equipo?.status).toBe("no_declarado");
    expect(equipo?.declared).toBeNull();
  });

  it("añade la pregunta de RITE cuando la instalación supera el umbral", () => {
    const evaluation = evaluate();
    const result = compareBudget(evaluation, { total: evaluation.total.min }, { riteSuperaUmbral: true });
    expect(result.preguntasRecomendadas.some((p) => p.includes("5 kW"))).toBe(true);
  });
});
