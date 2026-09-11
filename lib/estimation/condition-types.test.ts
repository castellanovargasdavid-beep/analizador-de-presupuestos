import { describe, expect, it } from "vitest";
import { matchesCondition } from "./condition-types";

describe("matchesCondition", () => {
  it("null/undefined siempre coincide", () => {
    expect(matchesCondition(null, {})).toBe(true);
    expect(matchesCondition(undefined, {})).toBe(true);
  });

  it("eq compara igualdad estricta", () => {
    expect(matchesCondition({ field: "a", op: "eq", value: "x" }, { a: "x" })).toBe(true);
    expect(matchesCondition({ field: "a", op: "eq", value: "x" }, { a: "y" })).toBe(false);
    expect(matchesCondition({ field: "a", op: "eq", value: "x" }, {})).toBe(false);
  });

  it("in comprueba pertenencia a la lista", () => {
    expect(matchesCondition({ field: "a", op: "in", values: ["x", "y"] }, { a: "y" })).toBe(true);
    expect(matchesCondition({ field: "a", op: "in", values: ["x", "y"] }, { a: "z" })).toBe(false);
    expect(matchesCondition({ field: "a", op: "in", values: ["x", "y"] }, {})).toBe(false);
  });

  it("truthy exige un valor verdadero", () => {
    expect(matchesCondition({ field: "a", op: "truthy" }, { a: true })).toBe(true);
    expect(matchesCondition({ field: "a", op: "truthy" }, { a: false })).toBe(false);
    expect(matchesCondition({ field: "a", op: "truthy" }, {})).toBe(false);
  });

  it("gt/gte/lt/lte solo comparan números", () => {
    expect(matchesCondition({ field: "a", op: "gt", value: 5 }, { a: 6 })).toBe(true);
    expect(matchesCondition({ field: "a", op: "gt", value: 5 }, { a: 5 })).toBe(false);
    expect(matchesCondition({ field: "a", op: "gte", value: 5 }, { a: 5 })).toBe(true);
    expect(matchesCondition({ field: "a", op: "lt", value: 5 }, { a: 4 })).toBe(true);
    expect(matchesCondition({ field: "a", op: "lte", value: 5 }, { a: 5 })).toBe(true);
    expect(matchesCondition({ field: "a", op: "gt", value: 5 }, { a: "6" })).toBe(false);
  });

  it("all requiere que todas las subcondiciones se cumplan", () => {
    const cond = { all: [{ field: "a", op: "eq" as const, value: "x" }, { field: "b", op: "truthy" as const }] };
    expect(matchesCondition(cond, { a: "x", b: true })).toBe(true);
    expect(matchesCondition(cond, { a: "x", b: false })).toBe(false);
  });

  it("any requiere que al menos una subcondición se cumpla", () => {
    const cond = { any: [{ field: "a", op: "eq" as const, value: "x" }, { field: "a", op: "eq" as const, value: "y" }] };
    expect(matchesCondition(cond, { a: "y" })).toBe(true);
    expect(matchesCondition(cond, { a: "z" })).toBe(false);
  });

  it("all/any anidados se evalúan recursivamente", () => {
    const cond = {
      all: [{ field: "a", op: "eq" as const, value: "x" }, { any: [{ field: "b", op: "eq" as const, value: "1" }, { field: "b", op: "eq" as const, value: "2" }] }],
    };
    expect(matchesCondition(cond, { a: "x", b: "2" })).toBe(true);
    expect(matchesCondition(cond, { a: "x", b: "3" })).toBe(false);
  });
});
