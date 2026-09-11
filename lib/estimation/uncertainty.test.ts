import { describe, expect, it } from "vitest";
import { computeConfidenceScore, pickUncertaintyBand } from "./uncertainty";
import { MissingPricingDataError } from "./errors";
import { UNCERTAINTY_BANDS_DEF } from "./seed-data";

describe("computeConfidenceScore", () => {
  it("da score 1 cuando todas las contribuciones son A", () => {
    const score = computeConfidenceScore([
      { confidence: "A", magnitude: 100 },
      { confidence: "A", magnitude: 50 },
    ]);
    expect(score).toBeCloseTo(1);
  });

  it("da score bajo cuando todas las contribuciones son C", () => {
    const score = computeConfidenceScore([{ confidence: "C", magnitude: 100 }]);
    expect(score).toBeCloseTo(0.25);
  });

  it("pondera por magnitud: una contribución C pequeña no arrastra mucho un conjunto A", () => {
    const score = computeConfidenceScore([
      { confidence: "A", magnitude: 900 },
      { confidence: "C", magnitude: 10 },
    ]);
    expect(score).toBeGreaterThan(0.9);
  });

  it("devuelve 1 cuando no hay contribuciones (caso borde, nada que ser incierto)", () => {
    expect(computeConfidenceScore([])).toBe(1);
  });
});

describe("pickUncertaintyBand", () => {
  it("selecciona la banda de mayor padding para scores bajos", () => {
    const band = pickUncertaintyBand(0.2, UNCERTAINTY_BANDS_DEF);
    expect(band.paddingPct).toBeCloseTo(0.18);
  });

  it("selecciona la banda de menor padding para scores altos", () => {
    const band = pickUncertaintyBand(0.9, UNCERTAINTY_BANDS_DEF);
    expect(band.paddingPct).toBeCloseTo(0.05);
  });

  it("lanza MissingPricingDataError si ninguna banda cubre el score", () => {
    expect(() => pickUncertaintyBand(0.5, [])).toThrow(MissingPricingDataError);
  });
});
