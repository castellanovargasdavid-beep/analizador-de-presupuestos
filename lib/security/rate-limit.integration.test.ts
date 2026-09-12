/**
 * Test de integración contra Postgres real (se salta sin DATABASE_URL).
 * Usa una clave única por ejecución para no interferir con otras
 * ejecuciones ni con tráfico real, y no necesita limpieza: una fila de
 * rate limit de una clave de prueba no tiene ningún efecto sobre nadie.
 */
import { describe, expect, it } from "vitest";
import { checkRateLimit } from "./rate-limit";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("checkRateLimit (integración con Postgres real)", () => {
  it("permite hasta el límite y luego bloquea dentro de la misma ventana", async () => {
    const key = `test:${Date.now()}:${Math.random().toString(36).slice(2)}`;

    const first = await checkRateLimit(key, { limit: 3, windowSeconds: 60 });
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(2);

    const second = await checkRateLimit(key, { limit: 3, windowSeconds: 60 });
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);

    const third = await checkRateLimit(key, { limit: 3, windowSeconds: 60 });
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);

    const fourth = await checkRateLimit(key, { limit: 3, windowSeconds: 60 });
    expect(fourth.allowed).toBe(false);
  });

  it("una clave distinta tiene su propio cupo, independiente de otras", async () => {
    const keyA = `test:${Date.now()}:a:${Math.random().toString(36).slice(2)}`;
    const keyB = `test:${Date.now()}:b:${Math.random().toString(36).slice(2)}`;

    await checkRateLimit(keyA, { limit: 1, windowSeconds: 60 });
    const blockedA = await checkRateLimit(keyA, { limit: 1, windowSeconds: 60 });
    expect(blockedA.allowed).toBe(false);

    const firstB = await checkRateLimit(keyB, { limit: 1, windowSeconds: 60 });
    expect(firstB.allowed).toBe(true);
  });

  it("reinicia el cupo una vez expira la ventana", async () => {
    const key = `test:${Date.now()}:window:${Math.random().toString(36).slice(2)}`;

    const first = await checkRateLimit(key, { limit: 1, windowSeconds: 1 });
    expect(first.allowed).toBe(true);
    const blocked = await checkRateLimit(key, { limit: 1, windowSeconds: 1 });
    expect(blocked.allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const afterWindow = await checkRateLimit(key, { limit: 1, windowSeconds: 1 });
    expect(afterWindow.allowed).toBe(true);
  });
});
