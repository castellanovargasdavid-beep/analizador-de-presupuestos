"use server";

import { evaluateEstimate } from "./engine";
import { compareBudget } from "./compare";
import { evaluateRite } from "./rite";
import { loadPricingContext, persistEstimate, persistUserBudget } from "./repository";
import { calculatorFormSchema, declaredBudgetSchema, toEstimationInput } from "./validation";

export interface ActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Calcula y persiste una estimación a partir de un formulario sin validar
 * (viene del cliente: nunca se confía en él). Devuelve el id de la
 * `Estimate` creada para redirigir a `/resultado/[id]`.
 */
export async function calculateEstimateAction(rawForm: unknown): Promise<ActionResult<{ estimateId: string }>> {
  const parsed = calculatorFormSchema.safeParse(rawForm);
  if (!parsed.success) {
    return { ok: false, error: "El formulario tiene datos inválidos: " + parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const values = parsed.data;

  try {
    const context = await loadPricingContext("aire-acondicionado", "instalacion");
    const input = toEstimationInput(values);
    const rite = evaluateRite(values.potenciaKw);

    const evaluation = evaluateEstimate({
      factors: context.factors,
      input,
      uncertaintyBands: context.uncertaintyBands,
      vatRates: context.vatRates,
      vatEligibility: {
        clientePersonaFisicaUsoParticular: values.clientePersonaFisicaUsoParticular,
        viviendaMasDeDosAnos: values.viviendaMasDeDosAnos,
      },
      serviceTypeVatReducedEligible: context.serviceTypeVatReducedEligible,
    });

    if (rite.superaUmbral) {
      evaluation.warnings.push(rite.mensaje);
    }

    const estimateId = await persistEstimate({
      context,
      input,
      evaluation,
      regionSlug: values.regionSlug ?? null,
      materialLevelSlug: values.materialLevel,
    });

    return { ok: true, data: { estimateId } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error inesperado al calcular la estimación." };
  }
}

export async function compareBudgetAction(
  rawForm: unknown,
  rawBudget: unknown,
): Promise<ActionResult<{ comparisonId: string }>> {
  const parsedForm = calculatorFormSchema.safeParse(rawForm);
  if (!parsedForm.success) {
    return { ok: false, error: "El formulario tiene datos inválidos." };
  }
  const parsedBudget = declaredBudgetSchema.safeParse(rawBudget);
  if (!parsedBudget.success) {
    return { ok: false, error: "El presupuesto introducido no es válido: " + parsedBudget.error.issues.map((i) => i.message).join("; ") };
  }

  const values = parsedForm.data;
  const declared = parsedBudget.data;

  try {
    const context = await loadPricingContext("aire-acondicionado", "instalacion");
    const input = toEstimationInput(values);
    const rite = evaluateRite(values.potenciaKw);

    const evaluation = evaluateEstimate({
      factors: context.factors,
      input,
      uncertaintyBands: context.uncertaintyBands,
      vatRates: context.vatRates,
      vatEligibility: {
        clientePersonaFisicaUsoParticular: values.clientePersonaFisicaUsoParticular,
        viviendaMasDeDosAnos: values.viviendaMasDeDosAnos,
      },
      serviceTypeVatReducedEligible: context.serviceTypeVatReducedEligible,
    });
    if (rite.superaUmbral) evaluation.warnings.push(rite.mensaje);

    const estimateId = await persistEstimate({
      context,
      input,
      evaluation,
      regionSlug: values.regionSlug ?? null,
      materialLevelSlug: values.materialLevel,
    });

    const comparison = compareBudget(evaluation, declared, { riteSuperaUmbral: rite.superaUmbral });
    const comparisonId = await persistUserBudget({ estimateId, declared, comparison });

    return { ok: true, data: { comparisonId } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error inesperado al comparar el presupuesto." };
  }
}
