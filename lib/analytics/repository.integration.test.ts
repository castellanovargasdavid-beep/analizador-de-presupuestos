/**
 * Test de integración contra Postgres real. Se salta si no hay
 * DATABASE_URL. Usa un `entryPath` único por ejecución para no mezclar sus
 * filas con datos reales o de otras ejecuciones al calcular el funnel, y
 * borra sus propios eventos al terminar.
 */
import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { analyticsEvents } from "@/db/schema";
import { getLandingPageFunnelStats, logEvent } from "./repository";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("analytics repository (integración con Postgres real)", () => {
  const entryPath = `/test-funnel-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  afterAll(async () => {
    await db.delete(analyticsEvents).where(eq(analyticsEvents.entryPath, entryPath));
  });

  it("registra eventos y calcula el funnel por página de entrada", async () => {
    await logEvent({ eventType: "page_view", sessionId: "s1", entryPath, path: entryPath });
    await logEvent({ eventType: "page_view", sessionId: "s2", entryPath, path: entryPath });
    await logEvent({ eventType: "calculator_start", sessionId: "s1", entryPath, path: "/aire-acondicionado/instalacion" });
    await logEvent({ eventType: "estimate_result_view", sessionId: "s1", entryPath, path: "/resultado/abc" });
    await logEvent({ eventType: "lead_submitted", sessionId: "s1", entryPath, path: "/resultado/abc" });

    const stats = await getLandingPageFunnelStats();
    const row = stats.find((r) => r.entryPath === entryPath);

    expect(row).toBeDefined();
    expect(row?.pageViews).toBe(2);
    expect(row?.calculatorStarts).toBe(1);
    expect(row?.results).toBe(1);
    expect(row?.leads).toBe(1);
    expect(row?.leadRate).toBeCloseTo(0.5, 5);
  });

  it("nunca inventa un leadRate para una página sin ninguna vista", async () => {
    const stats = await getLandingPageFunnelStats();
    const zeroViewsRow = stats.find((r) => r.pageViews === 0);
    if (zeroViewsRow) {
      expect(zeroViewsRow.leadRate).toBe(0);
    }
  });
});
