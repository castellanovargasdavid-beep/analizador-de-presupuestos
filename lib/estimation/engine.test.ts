import { describe, expect, it } from "vitest";
import { evaluateEstimate } from "./engine";
import { InvalidEstimationInputError, MissingPricingDataError } from "./errors";
import {
  AIRE_ACONDICIONADO_INSTALACION_FACTORS,
  UNCERTAINTY_BANDS_DEF,
  VAT_RATES_DEF,
} from "./seed-data";
import type { EstimationInput, PlainFactor } from "./types";

const MADRID_SLUG = "comunidad-de-madrid";
const CATALUNA_SLUG = "cataluna";

/** Mismos factores que siembra db/seed.ts, con los marcadores de región ya resueltos. */
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
  condition: JSON.parse(
    JSON.stringify(f.condition ?? null).replace(/__MADRID__/g, MADRID_SLUG).replace(/__CATALUNA__/g, CATALUNA_SLUG),
  ),
}));

function baseInput(overrides: Partial<EstimationInput> = {}): EstimationInput {
  return {
    selections: { systemType: "split-1x1", materialLevel: "media", retiradaEquipo: "no" },
    quantities: { metrosLineaFrigorificaExtra: 0, canaletaVistaMetros: 0 },
    flags: { necesitaBombaCondensados: false, instalacionElectricaDedicada: false, accesoDificil: false },
    regionSlug: null,
    ...overrides,
  };
}

function evaluate(input: EstimationInput, vatEligibility = { clientePersonaFisicaUsoParticular: true, viviendaMasDeDosAnos: true }) {
  return evaluateEstimate({
    factors: FACTORS,
    input,
    uncertaintyBands: UNCERTAINTY_BANDS_DEF,
    vatRates: VAT_RATES_DEF,
    vatEligibility,
    serviceTypeVatReducedEligible: true,
  });
}

describe("evaluateEstimate — casos normales", () => {
  it("calcula un split 1x1 medio sin extras dentro de los márgenes esperados", () => {
    const result = evaluate(baseInput());
    // equipo 550-900 + instalación 210-249 = 760-1149 antes de ubicación/incertidumbre/IVA
    expect(result.subtotal.min).toBeGreaterThan(0);
    expect(result.total.min).toBeLessThan(result.total.max);
    // El equipo domina el subtotal en una instalación de A/C (>40%), así que aunque la vivienda
    // cumpla los otros dos requisitos, el test legal de materiales hace que tribute al 21% general
    // (ver lib/estimation/vat.test.ts para el test legal aislado con distintos repartos).
    expect(result.vat.materialesSharePct).toBeGreaterThan(0.4);
    expect(result.vat.ratePct).toBeCloseTo(0.21);
  });

  it("el desglose incluye equipo e instalación base, y no incluye extras no solicitados", () => {
    const result = evaluate(baseInput());
    const keys = result.items.map((i) => i.key);
    expect(keys).toContain("equipo-split-1x1-media");
    expect(keys).toContain("instalacion-base-split-1x1");
    expect(keys).not.toContain("linea-frigorifica-extra");
    expect(keys).not.toContain("retirada-desechar");
  });

  it("añade la línea adicional solo si se piden metros > 0, y escala linealmente", () => {
    const sinExtra = evaluate(baseInput());
    const conExtra = evaluate(baseInput({ quantities: { metrosLineaFrigorificaExtra: 2, canaletaVistaMetros: 0 } }));
    const item = conExtra.items.find((i) => i.key === "linea-frigorifica-extra");
    expect(item).toBeDefined();
    expect(item!.min).toBeCloseTo(58); // 29 €/m * 2
    expect(conExtra.subtotal.min).toBeGreaterThan(sinExtra.subtotal.min);
  });
});

describe("evaluateEstimate — mínimos y máximos", () => {
  it("el mínimo del rango total nunca es mayor que el máximo", () => {
    for (const systemType of ["split-1x1", "split-2x1", "split-3x1", "conductos"]) {
      for (const materialLevel of ["economica", "media", "premium"]) {
        const result = evaluate(baseInput({ selections: { systemType, materialLevel, retiradaEquipo: "no" } }));
        expect(result.total.min).toBeLessThanOrEqual(result.total.max);
      }
    }
  });

  it("premium siempre da un rango igual o superior a económica para el mismo sistema", () => {
    const economica = evaluate(baseInput({ selections: { systemType: "split-2x1", materialLevel: "economica", retiradaEquipo: "no" } }));
    const premium = evaluate(baseInput({ selections: { systemType: "split-2x1", materialLevel: "premium", retiradaEquipo: "no" } }));
    expect(premium.total.min).toBeGreaterThan(economica.total.min);
    expect(premium.total.max).toBeGreaterThan(economica.total.max);
  });
});

describe("evaluateEstimate — casos extremos", () => {
  it("nunca produce un mínimo negativo, incluso con muchos extras acumulados", () => {
    const result = evaluate(
      baseInput({
        selections: { systemType: "split-1x1", materialLevel: "economica", retiradaEquipo: "reutilizar" },
        quantities: { metrosLineaFrigorificaExtra: 25, canaletaVistaMetros: 20 },
        flags: { necesitaBombaCondensados: true, instalacionElectricaDedicada: true, accesoDificil: true },
      }),
    );
    expect(result.total.min).toBeGreaterThanOrEqual(0);
    expect(result.subtotal.min).toBeGreaterThanOrEqual(0);
  });

  it("con cero metros y cero extras, el resultado es solo equipo + instalación base", () => {
    const result = evaluate(baseInput());
    expect(result.items).toHaveLength(2);
  });

  it("una cantidad de metros muy alta escala linealmente sin desbordar ni distorsionar el rango", () => {
    const result = evaluate(baseInput({ quantities: { metrosLineaFrigorificaExtra: 100, canaletaVistaMetros: 0 } }));
    const item = result.items.find((i) => i.key === "linea-frigorifica-extra")!;
    expect(item.min).toBeCloseTo(2900); // 29 * 100
  });
});

describe("evaluateEstimate — regiones distintas", () => {
  it("Madrid y Cataluña aplican el ajuste de zona; el resto de España no", () => {
    const resto = evaluate(baseInput({ regionSlug: "andalucia" }));
    const madrid = evaluate(baseInput({ regionSlug: MADRID_SLUG }));
    const cataluna = evaluate(baseInput({ regionSlug: CATALUNA_SLUG }));

    expect(madrid.total.min).toBeGreaterThan(resto.total.min);
    expect(cataluna.total.min).toBeGreaterThan(resto.total.min);
    expect(madrid.items.some((i) => i.key === "zona-madrid-cataluna")).toBe(true);
    expect(resto.items.some((i) => i.key === "zona-madrid-cataluna")).toBe(false);
  });

  it("sin región (null) se comporta igual que 'resto de España'", () => {
    const sinRegion = evaluate(baseInput({ regionSlug: null }));
    const resto = evaluate(baseInput({ regionSlug: "galicia" }));
    expect(sinRegion.total.min).toBeCloseTo(resto.total.min);
    expect(sinRegion.total.max).toBeCloseTo(resto.total.max);
  });
});

describe("evaluateEstimate — conductos (caso paquete completo)", () => {
  it("usa el rango total de conductos y no aplica factores de equipo/instalación de split", () => {
    const result = evaluate(baseInput({ selections: { systemType: "conductos", materialLevel: "media", retiradaEquipo: "no" } }));
    const keys = result.items.map((i) => i.key);
    expect(keys).toContain("conductos-paquete");
    expect(keys).not.toContain("equipo-split-1x1-media");
  });

  it("sí permite extras universales como retirada de equipo en conductos", () => {
    const result = evaluate(baseInput({ selections: { systemType: "conductos", materialLevel: "media", retiradaEquipo: "desechar" } }));
    expect(result.items.some((i) => i.key === "retirada-desechar")).toBe(true);
  });
});

describe("evaluateEstimate — IVA", () => {
  it("aplica el 21% si el cliente no es persona física con uso particular", () => {
    const result = evaluate(baseInput(), { clientePersonaFisicaUsoParticular: false, viviendaMasDeDosAnos: true });
    expect(result.vat.ratePct).toBeCloseTo(0.21);
  });

  it("aplica el 21% si la vivienda tiene menos de 2 años", () => {
    const result = evaluate(baseInput(), { clientePersonaFisicaUsoParticular: true, viviendaMasDeDosAnos: false });
    expect(result.vat.ratePct).toBeCloseTo(0.21);
  });

  it("aplica el 21% si el equipo (materiales) supera el 40% del subtotal, aunque el resto cumpla", () => {
    // Split premium: equipo domina claramente el subtotal frente a la instalación base.
    const result = evaluate(
      baseInput({ selections: { systemType: "split-1x1", materialLevel: "premium", retiradaEquipo: "no" } }),
    );
    expect(result.vat.materialesSharePct).toBeGreaterThan(0.4);
    expect(result.vat.ratePct).toBeCloseTo(0.21);
  });
});

describe("evaluateEstimate — combinaciones inválidas y ausencia de datos", () => {
  it("lanza InvalidEstimationInputError si no hay ningún factor base que coincida", () => {
    expect(() => evaluate(baseInput({ selections: { systemType: "no-existe", materialLevel: "media", retiradaEquipo: "no" } }))).toThrow(
      InvalidEstimationInputError,
    );
  });

  it("lanza MissingPricingDataError si no hay factores activos en absoluto", () => {
    expect(() =>
      evaluateEstimate({
        factors: [],
        input: baseInput(),
        uncertaintyBands: UNCERTAINTY_BANDS_DEF,
        vatRates: VAT_RATES_DEF,
        vatEligibility: { clientePersonaFisicaUsoParticular: true, viviendaMasDeDosAnos: true },
        serviceTypeVatReducedEligible: true,
      }),
    ).toThrow(MissingPricingDataError);
  });

  it("lanza MissingPricingDataError si faltan bandas de incertidumbre que cubran el score", () => {
    expect(() =>
      evaluateEstimate({
        factors: FACTORS,
        input: baseInput(),
        uncertaintyBands: [],
        vatRates: VAT_RATES_DEF,
        vatEligibility: { clientePersonaFisicaUsoParticular: true, viviendaMasDeDosAnos: true },
        serviceTypeVatReducedEligible: true,
      }),
    ).toThrow(MissingPricingDataError);
  });

  it("lanza MissingPricingDataError si falta la tarifa general de IVA", () => {
    expect(() =>
      evaluateEstimate({
        factors: FACTORS,
        input: baseInput(),
        uncertaintyBands: UNCERTAINTY_BANDS_DEF,
        vatRates: [],
        vatEligibility: { clientePersonaFisicaUsoParticular: true, viviendaMasDeDosAnos: true },
        serviceTypeVatReducedEligible: true,
      }),
    ).toThrow(MissingPricingDataError);
  });
});
