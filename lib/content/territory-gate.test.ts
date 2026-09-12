import { describe, expect, it } from "vitest";
import { canGenerateTerritoryPage, MIN_OWN_ESTIMATES_FOR_TERRITORY_PAGE } from "./territory-gate";

describe("canGenerateTerritoryPage", () => {
  it("no permite generar la página con 0 estimaciones propias y sin fuente citable", () => {
    const result = canGenerateTerritoryPage({
      regionSlug: "comunidad-de-madrid",
      ownEstimateCount: 0,
      hasCitedMarketDifferential: false,
    });
    expect(result.allowed).toBe(false);
  });

  it("no permite generar justo por debajo del umbral", () => {
    const result = canGenerateTerritoryPage({
      regionSlug: "cataluna",
      ownEstimateCount: MIN_OWN_ESTIMATES_FOR_TERRITORY_PAGE - 1,
      hasCitedMarketDifferential: false,
    });
    expect(result.allowed).toBe(false);
  });

  it("permite generar justo en el umbral", () => {
    const result = canGenerateTerritoryPage({
      regionSlug: "cataluna",
      ownEstimateCount: MIN_OWN_ESTIMATES_FOR_TERRITORY_PAGE,
      hasCitedMarketDifferential: false,
    });
    expect(result.allowed).toBe(true);
  });

  it("permite generar con una fuente de mercado citable aunque no haya datos propios", () => {
    const result = canGenerateTerritoryPage({
      regionSlug: "pais-vasco",
      ownEstimateCount: 0,
      hasCitedMarketDifferential: true,
    });
    expect(result.allowed).toBe(true);
  });

  it("el motivo siempre es una cadena no vacía (para poder loguearlo/auditarlo)", () => {
    const result = canGenerateTerritoryPage({
      regionSlug: "andalucia",
      ownEstimateCount: 5,
      hasCitedMarketDifferential: false,
    });
    expect(result.reason.length).toBeGreaterThan(0);
  });
});
