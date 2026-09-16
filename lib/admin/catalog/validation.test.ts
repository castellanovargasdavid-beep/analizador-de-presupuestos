import { describe, expect, it } from "vitest";
import { catalogProfessionFormSchema, serviceFormSchema } from "./validation";

describe("serviceFormSchema", () => {
  const base = {
    categoryId: "11111111-1111-4111-8111-111111111111",
    slug: "reparar-una-fuga",
    name: "Reparar una fuga",
    vatReducedEligible: true,
    availabilityStatus: "solo_solicitud" as const,
    isActive: true,
  };

  it("acepta un servicio sin profesión asignada (opcional)", () => {
    const result = serviceFormSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("acepta los tres estados de disponibilidad", () => {
    for (const availabilityStatus of ["disponible", "solo_solicitud", "proximamente"] as const) {
      const result = serviceFormSchema.safeParse({ ...base, availabilityStatus });
      expect(result.success).toBe(true);
    }
  });

  it("rechaza un estado de disponibilidad inventado", () => {
    const result = serviceFormSchema.safeParse({ ...base, availabilityStatus: "casi-listo" });
    expect(result.success).toBe(false);
  });
});

describe("catalogProfessionFormSchema", () => {
  const base = {
    categoryId: "11111111-1111-4111-8111-111111111111",
    slug: "fontanero",
    name: "Fontanero",
    status: "borrador" as const,
    sortOrder: 0,
  };

  it("acepta una profesión mínima válida", () => {
    const result = catalogProfessionFormSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rechaza un estado de publicación inventado", () => {
    const result = catalogProfessionFormSchema.safeParse({ ...base, status: "en-progreso" });
    expect(result.success).toBe(false);
  });

  it("rechaza un slug con mayúsculas", () => {
    const result = catalogProfessionFormSchema.safeParse({ ...base, slug: "Fontanero" });
    expect(result.success).toBe(false);
  });
});
