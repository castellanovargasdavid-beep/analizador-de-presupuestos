/**
 * Test legal del tipo de IVA aplicable (art. 91.Uno.2.10º Ley 37/1992,
 * ver docs/01 y la fuente citada en el seed). Esto es lógica de código a
 * propósito: es una norma legal, no un precio de mercado que deba poder
 * editarse desde una tabla. Las TARIFAS (10% / 21%) sí son datos
 * (`vat_rates`), por si cambian.
 *
 * Requisitos simultáneos para el 10% reducido:
 *  1. Destinatario persona física que usa la vivienda para uso particular.
 *  2. Vivienda con más de 2 años desde construcción/última rehabilitación.
 *  3. Materiales aportados por la empresa <= 40% de la base imponible.
 * Si falta cualquiera, se tributa al tipo general.
 */
import { MissingPricingDataError } from "./errors";
import type { VatDecision, VatRateOption } from "./types";

export interface VatEligibilityInput {
  serviceTypeVatReducedEligible: boolean;
  clientePersonaFisicaUsoParticular: boolean;
  viviendaMasDeDosAnos: boolean;
  materialesSharePct: number;
}

const MATERIALES_LIMITE_PCT = 0.4;

export function decideVatScenario(input: VatEligibilityInput, rates: VatRateOption[]): VatDecision {
  const general = rates.find((r) => r.scenario === "general");
  if (!general) {
    throw new MissingPricingDataError("No hay una tarifa de IVA 'general' configurada para este servicio.");
  }

  const reduced = rates.find((r) => r.scenario === "reducido_vivienda_particular");

  const cumpleMateriales = input.materialesSharePct <= MATERIALES_LIMITE_PCT;
  const esElegible =
    input.serviceTypeVatReducedEligible &&
    input.clientePersonaFisicaUsoParticular &&
    input.viviendaMasDeDosAnos &&
    cumpleMateriales &&
    Boolean(reduced);

  if (esElegible && reduced) {
    return {
      scenario: reduced.scenario,
      ratePct: reduced.ratePct,
      materialesSharePct: input.materialesSharePct,
      motivo: "Cumple los tres requisitos del art. 91.Uno.2.10º: vivienda particular, >2 años y materiales <=40%.",
    };
  }

  const razones: string[] = [];
  if (!input.clientePersonaFisicaUsoParticular) razones.push("no es vivienda de uso particular");
  if (!input.viviendaMasDeDosAnos) razones.push("la vivienda no supera los 2 años");
  if (!cumpleMateriales) razones.push(`los materiales superan el ${MATERIALES_LIMITE_PCT * 100}% de la base imponible`);
  if (!input.serviceTypeVatReducedEligible) razones.push("este servicio no es elegible para el tipo reducido");

  return {
    scenario: general.scenario,
    ratePct: general.ratePct,
    materialesSharePct: input.materialesSharePct,
    motivo: razones.length > 0 ? `Tipo general porque ${razones.join(", ")}.` : "Tipo general.",
  };
}
