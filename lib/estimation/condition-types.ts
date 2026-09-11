/**
 * Mini-lenguaje de condiciones para `pricing_factors.condition`.
 *
 * Deliberadamente pequeño y cerrado (no un DSL arbitrario): así se puede
 * validar con Zod, testear exhaustivamente y editar desde SQL sin arriesgar
 * inyectar lógica no controlada. Se evalúa contra un `EvaluationInput` plano
 * (ver engine.ts).
 */

export type FactorCondition =
  | { field: string; op: "eq"; value: string | number | boolean }
  | { field: string; op: "in"; values: (string | number)[] }
  | { field: string; op: "gt" | "gte" | "lt" | "lte"; value: number }
  | { field: string; op: "truthy" }
  | { all: FactorCondition[] }
  | { any: FactorCondition[] };

export type EvaluationScalar = string | number | boolean | undefined;

export function matchesCondition(
  condition: FactorCondition | null | undefined,
  input: Record<string, EvaluationScalar>,
): boolean {
  if (!condition) return true;

  if ("all" in condition) return condition.all.every((c) => matchesCondition(c, input));
  if ("any" in condition) return condition.any.some((c) => matchesCondition(c, input));

  const actual = input[condition.field];

  switch (condition.op) {
    case "eq":
      return actual === condition.value;
    case "in":
      return typeof actual !== "undefined" && condition.values.includes(actual as string | number);
    case "truthy":
      return Boolean(actual);
    case "gt":
      return typeof actual === "number" && actual > condition.value;
    case "gte":
      return typeof actual === "number" && actual >= condition.value;
    case "lt":
      return typeof actual === "number" && actual < condition.value;
    case "lte":
      return typeof actual === "number" && actual <= condition.value;
    default:
      return false;
  }
}
