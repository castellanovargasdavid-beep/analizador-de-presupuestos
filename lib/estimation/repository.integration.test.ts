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
  getEstimateForDisplay,
  getUserBudgetForDisplay,
  loadPricingContext,
  persistEstimate,
  persistUserBudget,
} from "./repository";
import { compareBudget } from "./compare";
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
    const comparison = compareBudget(evaluation, { total: evaluation.total.max + 300 }, { riteSuperaUmbral: rite.superaUmbral });
    const userBudgetId = await persistUserBudget({ estimateId, declared: { total: evaluation.total.max + 300 }, comparison });

    const budgetDisplay = await getUserBudgetForDisplay(userBudgetId);
    expect(budgetDisplay).not.toBeNull();
    expect(budgetDisplay!.budget.verdict).toBe("por_encima");
    expect(budgetDisplay!.estimate.estimate.id).toBe(estimateId);
  });
});

afterAll(async () => {
  if (hasDatabase) {
    // Cierra el pool para que `vitest run` no quede colgado esperando conexiones abiertas.
    await db.$client.end();
  }
});
