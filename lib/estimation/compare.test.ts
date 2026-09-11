import { describe, expect, it } from "vitest";
import { compareBudget, detectAlertSignals } from "./compare";
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
    const result = compareBudget(evaluation, { total: mid, lines: [] }, { riteSuperaUmbral: false });
    expect(result.verdict).toBe("dentro_de_rango");
    expect(result.deviationPct).toBe(0);
  });

  it("marca 'por_encima' y calcula la desviación cuando el total supera el máximo", () => {
    const evaluation = evaluate();
    const declarado = evaluation.total.max + 500;
    const result = compareBudget(evaluation, { total: declarado, lines: [] }, { riteSuperaUmbral: false });
    expect(result.verdict).toBe("por_encima");
    expect(result.deviationAbsolute).toBeCloseTo(500);
    expect(result.posiblesRazones.length).toBeGreaterThan(0);
  });

  it("marca 'por_debajo' cuando el total no llega al mínimo", () => {
    const evaluation = evaluate();
    const declarado = Math.max(1, evaluation.total.min - 200);
    const result = compareBudget(evaluation, { total: declarado, lines: [] }, { riteSuperaUmbral: false });
    expect(result.verdict).toBe("por_debajo");
  });

  it("nunca acusa: no hay ningún texto de razones para el caso dentro de rango", () => {
    const evaluation = evaluate();
    const mid = (evaluation.total.min + evaluation.total.max) / 2;
    const result = compareBudget(evaluation, { total: mid, lines: [] }, { riteSuperaUmbral: false });
    expect(result.posiblesRazones).toHaveLength(0);
  });

  it("marca 'no_declarado' y lo añade a partidasAusentes cuando no hay partidas de esa categoría", () => {
    const evaluation = evaluate();
    const result = compareBudget(evaluation, { total: evaluation.total.min, lines: [] }, { riteSuperaUmbral: false });
    const equipo = result.lineVerdicts.find((l) => l.groupKey === "equipo");
    expect(equipo?.status).toBe("no_declarado");
    expect(equipo?.declared).toBeNull();
    expect(result.partidasAusentes).toContain("Equipo");
  });

  it("añade la pregunta de RITE cuando la instalación supera el umbral", () => {
    const evaluation = evaluate();
    const result = compareBudget(evaluation, { total: evaluation.total.min, lines: [] }, { riteSuperaUmbral: true });
    expect(result.preguntasRecomendadas.some((p) => p.includes("5 kW"))).toBe(true);
  });

  it("suma varias partidas de la misma categoría antes de compararla con el rango esperado", () => {
    const evaluation = evaluate();
    const equipoRange = evaluation.ranges.find((r) => r.groupKey === "equipo")!;
    const result = compareBudget(
      evaluation,
      {
        total: evaluation.total.min,
        lines: [
          { label: "Unidad interior", category: "equipo", amount: equipoRange.max },
          { label: "Unidad exterior", category: "equipo", amount: 50 },
        ],
      },
      { riteSuperaUmbral: false },
    );
    const equipo = result.lineVerdicts.find((l) => l.groupKey === "equipo");
    expect(equipo?.declared).toBeCloseTo(equipoRange.max + 50);
    expect(equipo?.status).toBe("por_encima");
    expect(result.partidasAusentes).not.toContain("Equipo");
  });
});

describe("detectAlertSignals", () => {
  it("no genera señales si no hay partidas declaradas", () => {
    expect(detectAlertSignals({ total: 1000, lines: [] })).toHaveLength(0);
  });

  it("señala cuando el total no cuadra con la suma de las partidas", () => {
    const signals = detectAlertSignals({
      total: 1000,
      lines: [{ label: "Equipo", category: "equipo", amount: 400 }],
    });
    expect(signals.some((s) => s.key === "total-no-cuadra")).toBe(true);
  });

  it("no señala nada si el total y la suma de partidas coinciden (dentro de un margen razonable)", () => {
    const signals = detectAlertSignals({
      total: 1000,
      lines: [
        { label: "Equipo", category: "equipo", amount: 700 },
        { label: "Instalación", category: "mano_obra", amount: 300 },
      ],
    });
    expect(signals.some((s) => s.key === "total-no-cuadra")).toBe(false);
  });

  it("señala cuando la categoría 'otros' concentra una parte alta del total", () => {
    const signals = detectAlertSignals({
      total: 1000,
      lines: [
        { label: "Varios", category: "otros", amount: 400 },
        { label: "Equipo", category: "equipo", amount: 600 },
      ],
    });
    expect(signals.some((s) => s.key === "otros-alto")).toBe(true);
  });

  it("nunca usa lenguaje acusatorio en sus mensajes", () => {
    const signals = detectAlertSignals({
      total: 1000,
      lines: [{ label: "Varios", category: "otros", amount: 900 }],
    });
    for (const s of signals) {
      expect(s.message.toLowerCase()).not.toMatch(/estafa|fraude|engañ/);
    }
  });
});
