import { describe, expect, it } from "vitest";
import { genericCalculatorFormSchema, toGenericEstimationInput } from "./validation";

const base = {
  categorySlug: "instalaciones",
  serviceSlug: "cambiar-un-grifo",
  selections: { tipoGrifo: "fregadero_lavabo" },
  quantities: {},
  flags: { requiereAdaptacion: false },
  regionSlug: null,
  clientePersonaFisicaUsoParticular: true,
  viviendaMasDeDosAnos: true,
};

describe("genericCalculatorFormSchema", () => {
  it("acepta un formulario válido mínimo", () => {
    expect(genericCalculatorFormSchema.safeParse(base).success).toBe(true);
  });

  it("acepta cantidades y selecciones combinadas", () => {
    const result = genericCalculatorFormSchema.safeParse({
      ...base,
      serviceSlug: "instalar-un-armario-a-medida",
      selections: { material: "mdf_lacado" },
      quantities: { ml: 2.5 },
      flags: {},
    });
    expect(result.success).toBe(true);
  });

  it("rechaza más de 20 claves en selections (protección ante abuso)", () => {
    const selections: Record<string, string> = {};
    for (let i = 0; i < 25; i++) selections[`campo${i}`] = "x";
    const result = genericCalculatorFormSchema.safeParse({ ...base, selections });
    expect(result.success).toBe(false);
  });

  it("rechaza una cantidad negativa", () => {
    const result = genericCalculatorFormSchema.safeParse({ ...base, quantities: { m2: -5 } });
    expect(result.success).toBe(false);
  });

  it("rechaza una cantidad absurdamente grande (protección ante abuso)", () => {
    const result = genericCalculatorFormSchema.safeParse({ ...base, quantities: { m2: 999_999_999 } });
    expect(result.success).toBe(false);
  });

  it("rechaza categorySlug/serviceSlug vacíos", () => {
    expect(genericCalculatorFormSchema.safeParse({ ...base, categorySlug: "" }).success).toBe(false);
    expect(genericCalculatorFormSchema.safeParse({ ...base, serviceSlug: "" }).success).toBe(false);
  });

  it("toGenericEstimationInput traslada selections/quantities/flags tal cual al motor", () => {
    const parsed = genericCalculatorFormSchema.parse({
      ...base,
      quantities: { m2: 12 },
      flags: { quitarGotele: true },
      regionSlug: "andalucia",
    });
    const input = toGenericEstimationInput(parsed);
    expect(input.selections).toEqual({ tipoGrifo: "fregadero_lavabo" });
    expect(input.quantities).toEqual({ m2: 12 });
    expect(input.flags).toEqual({ quitarGotele: true });
    expect(input.regionSlug).toBe("andalucia");
  });
});
