import { describe, expect, it } from "vitest";
import { isPlausibleRange } from "./sanity";

describe("isPlausibleRange", () => {
  it("acepta un rango normal", () => {
    expect(isPlausibleRange(780, 1180)).toBe(true);
  });

  it("acepta un rango de un único valor (min === max)", () => {
    expect(isPlausibleRange(500, 500)).toBe(true);
  });

  it("acepta cero como mínimo", () => {
    expect(isPlausibleRange(0, 100)).toBe(true);
  });

  it("rechaza un rango invertido (min > max)", () => {
    expect(isPlausibleRange(1000, 500)).toBe(false);
  });

  it("rechaza valores negativos", () => {
    expect(isPlausibleRange(-100, 500)).toBe(false);
  });

  it("rechaza NaN o infinito", () => {
    expect(isPlausibleRange(NaN, 500)).toBe(false);
    expect(isPlausibleRange(0, Infinity)).toBe(false);
  });
});
