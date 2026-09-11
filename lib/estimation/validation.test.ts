import { describe, expect, it } from "vitest";
import { calculatorFormSchema, declaredBudgetSchema, toEstimationInput } from "./validation";

const VALID_FORM = {
  systemType: "split-1x1" as const,
  materialLevel: "media" as const,
  potenciaKw: 3.5,
  retiradaEquipo: "no" as const,
  metrosLineaFrigorificaExtra: 0,
  canaletaVistaMetros: 0,
  necesitaBombaCondensados: false,
  instalacionElectricaDedicada: false,
  accesoDificil: false,
  regionSlug: null,
  clientePersonaFisicaUsoParticular: true,
  viviendaMasDeDosAnos: true,
};

describe("calculatorFormSchema", () => {
  it("acepta un formulario válido", () => {
    expect(calculatorFormSchema.safeParse(VALID_FORM).success).toBe(true);
  });

  it("rechaza un systemType desconocido", () => {
    const result = calculatorFormSchema.safeParse({ ...VALID_FORM, systemType: "split-4x1" });
    expect(result.success).toBe(false);
  });

  it("rechaza potencia negativa o cero", () => {
    expect(calculatorFormSchema.safeParse({ ...VALID_FORM, potenciaKw: 0 }).success).toBe(false);
    expect(calculatorFormSchema.safeParse({ ...VALID_FORM, potenciaKw: -3 }).success).toBe(false);
  });

  it("rechaza una potencia disparatadamente alta", () => {
    expect(calculatorFormSchema.safeParse({ ...VALID_FORM, potenciaKw: 500 }).success).toBe(false);
  });

  it("rechaza metros de línea negativos", () => {
    expect(calculatorFormSchema.safeParse({ ...VALID_FORM, metrosLineaFrigorificaExtra: -1 }).success).toBe(false);
  });

  it("rechaza un valor de retiradaEquipo fuera del enum", () => {
    expect(calculatorFormSchema.safeParse({ ...VALID_FORM, retiradaEquipo: "sí" }).success).toBe(false);
  });
});

describe("declaredBudgetSchema", () => {
  it("acepta un presupuesto sin partidas (solo el total)", () => {
    expect(declaredBudgetSchema.safeParse({ total: 1200 }).success).toBe(true);
  });

  it("acepta un presupuesto con descripción y partidas", () => {
    const result = declaredBudgetSchema.safeParse({
      total: 1200,
      description: "Split Mitsubishi con retirada de equipo antiguo",
      lines: [
        { label: "Equipo", category: "equipo", amount: 700 },
        { label: "Instalación", category: "mano_obra", amount: 500 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rechaza un total negativo o cero", () => {
    expect(declaredBudgetSchema.safeParse({ total: 0 }).success).toBe(false);
    expect(declaredBudgetSchema.safeParse({ total: -500 }).success).toBe(false);
  });

  it("rechaza una partida con importe negativo", () => {
    const result = declaredBudgetSchema.safeParse({
      total: 1000,
      lines: [{ label: "Equipo", category: "equipo", amount: -100 }],
    });
    expect(result.success).toBe(false);
  });

  it("rechaza una partida sin nombre", () => {
    const result = declaredBudgetSchema.safeParse({
      total: 1000,
      lines: [{ label: "", category: "equipo", amount: 100 }],
    });
    expect(result.success).toBe(false);
  });

  it("rechaza una categoría de partida desconocida", () => {
    const result = declaredBudgetSchema.safeParse({
      total: 1000,
      lines: [{ label: "Equipo", category: "mano-de-obra-mal-escrito", amount: 100 }],
    });
    expect(result.success).toBe(false);
  });

  it("rechaza más de 30 partidas", () => {
    const lines = Array.from({ length: 31 }, (_, i) => ({ label: `Partida ${i}`, category: "otros" as const, amount: 10 }));
    expect(declaredBudgetSchema.safeParse({ total: 1000, lines }).success).toBe(false);
  });

  it("rechaza un total absurdamente alto", () => {
    expect(declaredBudgetSchema.safeParse({ total: 50_000_000 }).success).toBe(false);
  });
});

describe("toEstimationInput", () => {
  it("mapea el formulario validado a la forma que espera el motor", () => {
    const input = toEstimationInput(VALID_FORM);
    expect(input.selections.systemType).toBe("split-1x1");
    expect(input.selections.materialLevel).toBe("media");
    expect(input.quantities.metrosLineaFrigorificaExtra).toBe(0);
    expect(input.regionSlug).toBeNull();
  });
});
