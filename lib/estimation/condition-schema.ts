import { z } from "zod";
import type { FactorCondition } from "./condition-types";

/**
 * Espejo Zod de `FactorCondition` (condition-types.ts) — para poder
 * validar de verdad lo que un admin pega en el campo "condición" de un
 * factor de precio, en vez de aceptar cualquier JSON. El mini-lenguaje ya
 * estaba diseñado para ser seguro de editar; esto es lo que hace cumplir
 * esa promesa desde el formulario.
 */
const scalar = z.union([z.string(), z.number(), z.boolean()]);

export const factorConditionSchema: z.ZodType<FactorCondition> = z.lazy(() =>
  z.union([
    z.object({ field: z.string().min(1), op: z.literal("eq"), value: scalar }),
    z.object({ field: z.string().min(1), op: z.literal("in"), values: z.array(z.union([z.string(), z.number()])).min(1) }),
    z.object({ field: z.string().min(1), op: z.enum(["gt", "gte", "lt", "lte"]), value: z.number() }),
    z.object({ field: z.string().min(1), op: z.literal("truthy") }),
    z.object({ all: z.array(factorConditionSchema).min(1) }),
    z.object({ any: z.array(factorConditionSchema).min(1) }),
  ]),
);

/** Parsea el texto tal cual llega de un `<textarea>`: vacío = sin condición (siempre se aplica). */
export function parseConditionInput(raw: string): { ok: true; value: FactorCondition | null } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: true, value: null };

  let json: unknown;
  try {
    json = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "La condición no es JSON válido." };
  }

  const parsed = factorConditionSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, error: "La condición no tiene una forma reconocida (ver ejemplos junto al campo)." };
  }
  return { ok: true, value: parsed.data };
}
