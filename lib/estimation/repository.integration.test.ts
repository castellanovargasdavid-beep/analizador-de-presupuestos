/**
 * Test de integración: ejercita la capa real de Postgres (repository.ts)
 * contra la base de datos sembrada por `npm run db:seed`. Se salta solo si
 * no hay DATABASE_URL configurada, para no romper `npm test` en un entorno
 * sin Postgres levantado — pero si existe DATABASE_URL, corre de verdad
 * contra la base de datos real, sin mocks.
 */
import { afterAll, describe, expect, it } from "vitest";
import { evaluateEstimate } from "./engine";
import { evaluateRite } from "./rite";
import {
  countEstimatesByRegion,
  getComparisonForDisplay,
  getEstimateForDisplay,
  listRegions,
  loadPricingContext,
  persistEstimate,
  persistUserBudget,
} from "./repository";
import { compareBudget } from "./compare";
import { canGenerateTerritoryPage, MIN_OWN_ESTIMATES_FOR_TERRITORY_PAGE } from "@/lib/content/territory-gate";
import { toEstimationInput, type CalculatorFormValues } from "./validation";
import { db } from "@/db/client";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("repository (integración con Postgres real)", () => {
  const createdEstimateIds: string[] = [];

  afterAll(async () => {
    // No borramos filas: son datos de prueba anónimos y de bajo volumen, y
    // el objetivo de este test es verificar el cableado, no dejar la base
    // impoluta. Se documenta explícitamente para que no sorprenda.
  });

  it("carga el contexto de precios sembrado para aire-acondicionado/instalacion", async () => {
    const context = await loadPricingContext("aire-acondicionado", "instalacion");
    expect(context.factors.length).toBeGreaterThan(0);
    expect(context.vatRates.length).toBe(2);
    expect(context.uncertaintyBands.length).toBe(3);
  });

  it("calcula, persiste y vuelve a leer una estimación completa", async () => {
    const context = await loadPricingContext("aire-acondicionado", "instalacion");
    const form: CalculatorFormValues = {
      systemType: "split-1x1",
      materialLevel: "media",
      potenciaKw: 3.5,
      retiradaEquipo: "no",
      metrosLineaFrigorificaExtra: 0,
      canaletaVistaMetros: 0,
      necesitaBombaCondensados: false,
      instalacionElectricaDedicada: false,
      accesoDificil: false,
      regionSlug: null,
      clientePersonaFisicaUsoParticular: true,
      viviendaMasDeDosAnos: true,
    };
    const input = toEstimationInput(form);
    const evaluation = evaluateEstimate({
      factors: context.factors,
      input,
      uncertaintyBands: context.uncertaintyBands,
      vatRates: context.vatRates,
      vatEligibility: { clientePersonaFisicaUsoParticular: true, viviendaMasDeDosAnos: true },
      serviceTypeVatReducedEligible: context.serviceTypeVatReducedEligible,
    });

    const estimateId = await persistEstimate({
      context,
      input,
      evaluation,
      regionSlug: null,
      materialLevelSlug: "media",
    });
    createdEstimateIds.push(estimateId);

    const display = await getEstimateForDisplay(estimateId);
    expect(display).not.toBeNull();
    expect(display!.items.length).toBeGreaterThan(0);
    expect(display!.estimate.totalMin).toBeLessThanOrEqual(display!.estimate.totalMax);

    const rite = evaluateRite(form.potenciaKw);
    const declared = {
      total: evaluation.total.max + 300,
      description: "Presupuesto de prueba de integración",
      lines: [{ label: "Equipo Mitsubishi", category: "equipo" as const, amount: 700 }],
    };
    const comparison = compareBudget(evaluation, declared, { riteSuperaUmbral: rite.superaUmbral });
    const comparisonId = await persistUserBudget({ estimateId, declared, comparison });

    const comparisonDisplay = await getComparisonForDisplay(comparisonId);
    expect(comparisonDisplay).not.toBeNull();
    expect(comparisonDisplay!.budgets).toHaveLength(1);
    expect(comparisonDisplay!.budgets[0].budget.verdict).toBe("por_encima");
    expect(comparisonDisplay!.budgets[0].lines).toHaveLength(1);
    expect(comparisonDisplay!.estimate.estimate.id).toBe(estimateId);
  });

  it("hoy ninguna región supera el umbral de datos propios para generar una página de territorio", async () => {
    const allRegions = await listRegions();
    expect(allRegions.length).toBeGreaterThan(0);
    for (const region of allRegions) {
      const ownEstimateCount = await countEstimatesByRegion(region.slug);
      // Sanidad: si esto falla algún día es una BUENA noticia (hay suficiente
      // dato propio) — pero entonces hay que construir la página de verdad,
      // no subir el test para que pase.
      expect(ownEstimateCount).toBeLessThan(MIN_OWN_ESTIMATES_FOR_TERRITORY_PAGE);
      const gate = canGenerateTerritoryPage({ regionSlug: region.slug, ownEstimateCount, hasCitedMarketDifferential: false });
      expect(gate.allowed).toBe(false);
    }
  });
});

afterAll(async () => {
  if (hasDatabase) {
    // Cierra el pool para que `vitest run` no quede colgado esperando conexiones abiertas.
    await db.$client.end();
  }
});
