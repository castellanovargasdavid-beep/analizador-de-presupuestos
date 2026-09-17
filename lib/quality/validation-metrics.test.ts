import { describe, expect, it } from "vitest";
import { computeValidationMetrics, EXTREME_CASE_THRESHOLD_PCT, type ValidationSampleForMetrics } from "./validation-metrics";

function sample(id: string, finalPrice: number, range: { totalMin: number; totalMax: number } | null): ValidationSampleForMetrics {
  return { id, finalPriceWithVat: finalPrice, estimateRange: range };
}

describe("computeValidationMetrics", () => {
  it("devuelve todo en null si no hay ninguna muestra", () => {
    const result = computeValidationMetrics([]);
    expect(result.totalSampleSize).toBe(0);
    expect(result.comparableSampleSize).toBe(0);
    expect(result.hitRatePct).toBeNull();
    expect(result.biasPct).toBeNull();
  });

  it("cuenta las muestras sin Estimate asociada en totalSampleSize pero no en comparableSampleSize ni en las métricas", () => {
    const result = computeValidationMetrics([sample("1", 100, null), sample("2", 200, null)]);
    expect(result.totalSampleSize).toBe(2);
    expect(result.comparableSampleSize).toBe(0);
    expect(result.hitRatePct).toBeNull();
  });

  it("un precio real exactamente en el punto medio del rango da error 0 y hit rate 100%", () => {
    const result = computeValidationMetrics([sample("1", 100, { totalMin: 80, totalMax: 120 })]);
    expect(result.meanAbsoluteError).toBe(0);
    expect(result.meanAbsolutePercentError).toBe(0);
    expect(result.hitRatePct).toBe(1);
    expect(result.biasPct).toBe(0);
  });

  it("un precio real dentro del rango pero no en el punto medio cuenta como acierto (hit) aunque el error no sea 0", () => {
    const result = computeValidationMetrics([sample("1", 85, { totalMin: 80, totalMax: 120 })]);
    // midpoint = 100, real = 85 -> error absoluto 15, dentro de [80,120] -> hit
    expect(result.hitRatePct).toBe(1);
    expect(result.meanAbsoluteError).toBe(15);
  });

  it("un precio real por debajo del rango cuenta como fallo (no hit) y sesgo positivo (sobrevaloración)", () => {
    const result = computeValidationMetrics([sample("1", 50, { totalMin: 80, totalMax: 120 })]);
    expect(result.hitRatePct).toBe(0);
    // midpoint 100, real 50 -> el sistema estimó por encima del precio real -> sobrevalora -> bias positivo
    expect(result.biasPct).toBeGreaterThan(0);
  });

  it("un precio real por encima del rango cuenta como fallo y sesgo negativo (infravaloración)", () => {
    const result = computeValidationMetrics([sample("1", 200, { totalMin: 80, totalMax: 120 })]);
    expect(result.hitRatePct).toBe(0);
    expect(result.biasPct).toBeLessThan(0);
  });

  it("el sesgo es 0 cuando el precio real coincide exactamente con el punto medio estimado", () => {
    const result = computeValidationMetrics([sample("1", 50, { totalMin: 50, totalMax: 50 })]);
    expect(result.biasPct).toBe(0);
  });

  it("calcula la mediana correctamente con un número impar de muestras", () => {
    const result = computeValidationMetrics([
      sample("1", 100, { totalMin: 100, totalMax: 100 }), // error% 0
      sample("2", 100, { totalMin: 80, totalMax: 80 }), // midpoint 80, real 100 -> error% 0.2
      sample("3", 100, { totalMin: 50, totalMax: 50 }), // midpoint 50, real 100 -> error% 0.5
    ]);
    expect(result.medianAbsolutePercentError).toBeCloseTo(0.2, 5);
  });

  it("calcula la mediana correctamente con un número par de muestras (promedio de los dos centrales)", () => {
    const result = computeValidationMetrics([
      sample("1", 100, { totalMin: 100, totalMax: 100 }), // 0
      sample("2", 100, { totalMin: 90, totalMax: 90 }), // 0.1
      sample("3", 100, { totalMin: 80, totalMax: 80 }), // 0.2
      sample("4", 100, { totalMin: 50, totalMax: 50 }), // 0.5
    ]);
    expect(result.medianAbsolutePercentError).toBeCloseTo((0.1 + 0.2) / 2, 5);
  });

  it("identifica como caso extremo una muestra cuyo error porcentual supera el umbral", () => {
    const result = computeValidationMetrics([
      sample("normal", 100, { totalMin: 95, totalMax: 105 }),
      sample("extremo", 1000, { totalMin: 95, totalMax: 105 }), // midpoint 100, real 1000 -> error% 0.9
    ]);
    expect(result.extremeCases).toHaveLength(1);
    expect(result.extremeCases[0].sampleId).toBe("extremo");
    expect(result.extremeCases[0].absolutePercentError).toBeGreaterThan(EXTREME_CASE_THRESHOLD_PCT);
  });

  it("no marca ningún caso extremo si todos los errores están por debajo del umbral", () => {
    const result = computeValidationMetrics([
      sample("1", 100, { totalMin: 95, totalMax: 105 }),
      sample("2", 105, { totalMin: 95, totalMax: 105 }),
    ]);
    expect(result.extremeCases).toHaveLength(0);
  });

  it("mezcla de muestras comparables y no comparables: las métricas solo usan las comparables", () => {
    const result = computeValidationMetrics([
      sample("con-estimate", 100, { totalMin: 80, totalMax: 120 }),
      sample("sin-estimate", 9999, null),
    ]);
    expect(result.totalSampleSize).toBe(2);
    expect(result.comparableSampleSize).toBe(1);
    expect(result.hitRatePct).toBe(1);
  });
});
