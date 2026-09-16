import { beforeEach, describe, expect, it, vi } from "vitest";

describe("deadline-config", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("usa los valores por defecto cuando no hay variables de entorno", async () => {
    const { DEADLINES, computeContactDeadline, computeQuoteDeadline, computeResponseDeadline } = await import(
      "./deadline-config"
    );
    expect(DEADLINES.CONTACT_CONFIRMATION_DEADLINE_HOURS).toBe(4);
    expect(DEADLINES.QUOTE_SUBMISSION_DEADLINE_HOURS).toBe(72);

    const now = new Date("2026-01-01T00:00:00Z");
    expect(computeContactDeadline(now).toISOString()).toBe("2026-01-01T04:00:00.000Z");
    expect(computeQuoteDeadline(now).toISOString()).toBe("2026-01-04T00:00:00.000Z");
    expect(computeResponseDeadline(now).toISOString()).toBe("2026-01-01T02:00:00.000Z");
  });

  it("respeta un valor válido definido por variable de entorno", async () => {
    process.env.CONTACT_CONFIRMATION_DEADLINE_HOURS = "8";
    try {
      const { DEADLINES } = await import("./deadline-config");
      expect(DEADLINES.CONTACT_CONFIRMATION_DEADLINE_HOURS).toBe(8);
    } finally {
      delete process.env.CONTACT_CONFIRMATION_DEADLINE_HOURS;
    }
  });

  it("ignora un valor de entorno inválido (no numérico o <= 0) y usa el valor por defecto", async () => {
    process.env.QUOTE_WARNING_DELAY_HOURS = "no-es-un-numero";
    try {
      const { DEADLINES } = await import("./deadline-config");
      expect(DEADLINES.QUOTE_WARNING_DELAY_HOURS).toBe(12);
    } finally {
      delete process.env.QUOTE_WARNING_DELAY_HOURS;
    }

    vi.resetModules();
    process.env.QUOTE_WARNING_DELAY_HOURS = "-5";
    try {
      const { DEADLINES } = await import("./deadline-config");
      expect(DEADLINES.QUOTE_WARNING_DELAY_HOURS).toBe(12);
    } finally {
      delete process.env.QUOTE_WARNING_DELAY_HOURS;
    }
  });
});
