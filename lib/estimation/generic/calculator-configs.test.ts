/**
 * Test de cordura mencionado en el comentario de cabecera de
 * `calculator-configs.ts`: compara las claves de campos de cada config
 * declarativa contra los `condition.field` / `perUnitOfQuantity` realmente
 * sembrados en Postgres (`db/seed-multi-service-calculators.ts`). El motor
 * (`evaluateEstimate`) no lanza error si una clave no coincide — el factor
 * simplemente nunca se aplica — así que un desajuste sería un bug silencioso
 * de precios, no una excepción. Se salta si no hay DATABASE_URL, igual que
 * el resto de tests de integración de este proyecto.
 */
import { describe, expect, it } from "vitest";
import { loadPricingContext } from "@/lib/estimation/repository";
import type { FactorCondition } from "@/lib/estimation/condition-types";
import { CALCULATOR_CONFIGS } from "./calculator-configs";

const hasDatabase = Boolean(process.env.DATABASE_URL);

function collectFields(condition: FactorCondition | null | undefined, out: Set<string>): void {
  if (!condition) return;
  if ("all" in condition) {
    condition.all.forEach((c) => collectFields(c, out));
    return;
  }
  if ("any" in condition) {
    condition.any.forEach((c) => collectFields(c, out));
    return;
  }
  out.add(condition.field);
}

describe.skipIf(!hasDatabase)("CALCULATOR_CONFIGS vs. factores sembrados (consistencia)", () => {
  for (const config of CALCULATOR_CONFIGS) {
    it(`${config.categorySlug}/${config.serviceSlug}: cada campo del formulario controla al menos un factor real`, async () => {
      const context = await loadPricingContext(config.categorySlug, config.serviceSlug);

      const fieldsUsedBySeed = new Set<string>();
      for (const factor of context.factors) {
        collectFields(factor.condition, fieldsUsedBySeed);
        if (factor.perUnitOfQuantity) fieldsUsedBySeed.add(factor.perUnitOfQuantity);
      }

      const configKeys = config.fields.map((f) => f.key);

      for (const key of configKeys) {
        expect(
          fieldsUsedBySeed.has(key),
          `El campo "${key}" del formulario de "${config.serviceSlug}" no controla ningún factor sembrado (revisa condition.field / perUnitOfQuantity en el seed) — sería un campo que el usuario rellena pero que no afecta al precio.`,
        ).toBe(true);
      }
    });
  }
});
