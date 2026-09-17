"use server";

/**
 * Server Action de cálculo para los servicios con calculadora genérica
 * (ver GenericWizard.tsx y calculator-configs.ts). Reutiliza el mismo
 * motor y la misma persistencia que aire acondicionado
 * (`evaluateEstimate`/`loadPricingContext`/`persistEstimate`) — la única
 * diferencia real es que aquí no hay campos de formulario fijos ni lógica
 * RITE (específica de A/C), y no hay "nivel de material" en la mayoría de
 * estos servicios.
 */
import { evaluateEstimate } from "../engine";
import { loadPricingContext, persistEstimate } from "../repository";
import { genericCalculatorFormSchema, toGenericEstimationInput } from "./validation";
import { toSafeError, type ErrorKind } from "@/lib/errors/safe-message";

export interface ActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  errorKind?: ErrorKind;
}

const FALLBACK_MESSAGE = "No hemos podido calcular tu estimación ahora mismo. Inténtalo de nuevo en unos minutos.";

export async function calculateGenericEstimateAction(
  rawForm: unknown,
): Promise<ActionResult<{ estimateId: string }>> {
  const parsed = genericCalculatorFormSchema.safeParse(rawForm);
  if (!parsed.success) {
    return {
      ok: false,
      errorKind: "validation",
      error: "El formulario tiene datos inválidos: " + parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  const values = parsed.data;

  try {
    const context = await loadPricingContext(values.categorySlug, values.serviceSlug);
    const input = toGenericEstimationInput(values);

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

    const estimateId = await persistEstimate({
      context,
      input,
      evaluation,
      regionSlug: values.regionSlug ?? null,
      materialLevelSlug: null,
    });

    return { ok: true, data: { estimateId } };
  } catch (err) {
    const safe = toSafeError(err, "calculateGenericEstimateAction", FALLBACK_MESSAGE);
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }
}
