import { describe, expect, it } from "vitest";
import { decideVatScenario } from "./vat";
import { MissingPricingDataError } from "./errors";

const RATES = [
  { scenario: "reducido_vivienda_particular", ratePct: 0.1, description: "reducido" },
  { scenario: "general", ratePct: 0.21, description: "general" },
];

describe("decideVatScenario", () => {
  it("aplica el 10% cuando se cumplen los tres requisitos y los materiales no superan el 40%", () => {
    const result = decideVatScenario(
      {
        serviceTypeVatReducedEligible: true,
        clientePersonaFisicaUsoParticular: true,
        viviendaMasDeDosAnos: true,
        materialesSharePct: 0.3,
      },
      RATES,
    );
    expect(result.scenario).toBe("reducido_vivienda_particular");
    expect(result.ratePct).toBeCloseTo(0.1);
  });

  it("aplica el 21% si los materiales están justo por encima del 40%", () => {
    const result = decideVatScenario(
      {
        serviceTypeVatReducedEligible: true,
        clientePersonaFisicaUsoParticular: true,
        viviendaMasDeDosAnos: true,
        materialesSharePct: 0.401,
      },
      RATES,
    );
    expect(result.scenario).toBe("general");
  });

  it("el 40% exacto SÍ cumple el requisito (el límite es <=40%, no <40%)", () => {
    const result = decideVatScenario(
      {
        serviceTypeVatReducedEligible: true,
        clientePersonaFisicaUsoParticular: true,
        viviendaMasDeDosAnos: true,
        materialesSharePct: 0.4,
      },
      RATES,
    );
    expect(result.scenario).toBe("reducido_vivienda_particular");
  });

  it("aplica el 21% si el cliente no es persona física de uso particular, aunque el resto cumpla", () => {
    const result = decideVatScenario(
      {
        serviceTypeVatReducedEligible: true,
        clientePersonaFisicaUsoParticular: false,
        viviendaMasDeDosAnos: true,
        materialesSharePct: 0.1,
      },
      RATES,
    );
    expect(result.scenario).toBe("general");
  });

  it("aplica el 21% si el servicio no es elegible para el tipo reducido, aunque el resto cumpla", () => {
    const result = decideVatScenario(
      {
        serviceTypeVatReducedEligible: false,
        clientePersonaFisicaUsoParticular: true,
        viviendaMasDeDosAnos: true,
        materialesSharePct: 0.1,
      },
      RATES,
    );
    expect(result.scenario).toBe("general");
  });

  it("aplica el 21% si no existe una tarifa reducida configurada, sin lanzar error", () => {
    const result = decideVatScenario(
      {
        serviceTypeVatReducedEligible: true,
        clientePersonaFisicaUsoParticular: true,
        viviendaMasDeDosAnos: true,
        materialesSharePct: 0.1,
      },
      [RATES[1]],
    );
    expect(result.scenario).toBe("general");
  });

  it("lanza MissingPricingDataError si ni siquiera existe la tarifa general", () => {
    expect(() =>
      decideVatScenario(
        {
          serviceTypeVatReducedEligible: true,
          clientePersonaFisicaUsoParticular: true,
          viviendaMasDeDosAnos: true,
          materialesSharePct: 0.1,
        },
        [],
      ),
    ).toThrow(MissingPricingDataError);
  });
});
