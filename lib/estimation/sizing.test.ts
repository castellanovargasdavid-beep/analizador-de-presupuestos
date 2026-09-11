import { describe, expect, it } from "vitest";
import { estimatePotenciaKwFromSuperficie } from "./sizing";

describe("estimatePotenciaKwFromSuperficie", () => {
  it("usa 100 frigorías/m² por defecto", () => {
    // 20 m2 * 100 fg/m2 = 2000 fg / 860 = 2.32... -> 2.3
    expect(estimatePotenciaKwFromSuperficie(20, false)).toBeCloseTo(2.3);
  });

  it("usa 130 frigorías/m² con mucho vidrio/orientación sur", () => {
    expect(estimatePotenciaKwFromSuperficie(20, true)).toBeCloseTo(3.0);
  });

  it("nunca da un valor negativo para superficies positivas", () => {
    expect(estimatePotenciaKwFromSuperficie(1, false)).toBeGreaterThan(0);
  });
});
