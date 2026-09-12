import { describe, expect, it } from "vitest";
import { parseConditionInput } from "./condition-schema";

describe("parseConditionInput", () => {
  it("acepta vacío como 'sin condición'", () => {
    const result = parseConditionInput("");
    expect(result).toEqual({ ok: true, value: null });
  });

  it("acepta un eq válido", () => {
    const result = parseConditionInput('{"field":"regionSlug","op":"eq","value":"comunidad-de-madrid"}');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ field: "regionSlug", op: "eq", value: "comunidad-de-madrid" });
  });

  it("acepta un all anidado", () => {
    const result = parseConditionInput(
      '{"all":[{"field":"systemType","op":"eq","value":"conductos"},{"field":"potenciaKw","op":"gt","value":5}]}',
    );
    expect(result.ok).toBe(true);
  });

  it("rechaza JSON mal formado", () => {
    const result = parseConditionInput("{ field: regionSlug }");
    expect(result.ok).toBe(false);
  });

  it("rechaza una forma no reconocida (op inventado)", () => {
    const result = parseConditionInput('{"field":"x","op":"contains","value":"y"}');
    expect(result.ok).toBe(false);
  });

  it("rechaza value numérico donde 'in' pide un array", () => {
    const result = parseConditionInput('{"field":"x","op":"in","values":"no-es-un-array"}');
    expect(result.ok).toBe(false);
  });
});
