import { describe, expect, it } from "vitest";
import { evaluateRite } from "./rite";

describe("evaluateRite", () => {
  it("no exige documentación por debajo de 5 kW", () => {
    expect(evaluateRite(3.5).superaUmbral).toBe(false);
  });

  it("exige memoria técnica y registro por encima de 5 kW", () => {
    const result = evaluateRite(5.5);
    expect(result.superaUmbral).toBe(true);
    expect(result.mensaje).toMatch(/memoria técnica/);
  });

  it("5 kW exactos NO supera el umbral (el límite es estrictamente mayor que 5)", () => {
    expect(evaluateRite(5).superaUmbral).toBe(false);
  });
});
