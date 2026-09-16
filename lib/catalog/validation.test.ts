import { describe, expect, it } from "vitest";
import { directLeadFormSchema, notifyMeFormSchema } from "./validation";

describe("notifyMeFormSchema", () => {
  it("acepta un email válido con serviceTypeId", () => {
    const result = notifyMeFormSchema.safeParse({
      serviceTypeId: "11111111-1111-4111-8111-111111111111",
      email: "ana@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza un email inválido", () => {
    const result = notifyMeFormSchema.safeParse({
      serviceTypeId: "11111111-1111-4111-8111-111111111111",
      email: "no-es-un-email",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un serviceTypeId que no es un uuid", () => {
    const result = notifyMeFormSchema.safeParse({ serviceTypeId: "no-es-un-uuid", email: "ana@example.com" });
    expect(result.success).toBe(false);
  });
});

describe("directLeadFormSchema", () => {
  const base = {
    contactName: "Ana",
    contactEmail: "ana@example.com",
    description: "Tengo una fuga en la cocina y necesito que la reparen esta semana.",
    consentAccepted: true,
  };

  it("acepta una solicitud directa mínima y válida (sin serviceTypeId, se pasa aparte)", () => {
    const result = directLeadFormSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rechaza si no se acepta el consentimiento", () => {
    const result = directLeadFormSchema.safeParse({ ...base, consentAccepted: false });
    expect(result.success).toBe(false);
  });

  it("rechaza una descripción demasiado corta (evita solicitudes vacías de contenido)", () => {
    const result = directLeadFormSchema.safeParse({ ...base, description: "hola" });
    expect(result.success).toBe(false);
  });

  it("rechaza un nombre demasiado corto", () => {
    const result = directLeadFormSchema.safeParse({ ...base, contactName: "A" });
    expect(result.success).toBe(false);
  });

  it("normaliza una zona vacía a undefined", () => {
    const result = directLeadFormSchema.safeParse({ ...base, regionSlug: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.regionSlug).toBeUndefined();
    }
  });
});
