import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    // Los tests de integración (*.integration.test.ts) hacen decenas de
    // round-trips reales a Postgres en cadena (asignación, reasignación,
    // notificaciones) — el timeout por defecto de 5s es demasiado corto
    // para eso, aunque no haya ningún problema real.
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
