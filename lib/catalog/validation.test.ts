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

  it("acepta los campos adicionales opcionales (tipo de inmueble, urgencia, dimensiones, presupuesto...)", () => {
    const result = directLeadFormSchema.safeParse({
      ...base,
      propertyType: "piso",
      urgency: "urgente",
      desiredTimeframe: "Esta semana",
      currentState: "No sube la persiana, el motor no hace ruido.",
      approxDimensions: "2 metros de ancho",
      userStatedBudget: "150",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.propertyType).toBe("piso");
      expect(result.data.urgency).toBe("urgente");
      expect(result.data.userStatedBudget).toBe(150);
    }
  });

  it("los campos adicionales son opcionales: se puede omitirlos todos", () => {
    const result = directLeadFormSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.propertyType).toBeUndefined();
      expect(result.data.urgency).toBeUndefined();
      expect(result.data.userStatedBudget).toBeUndefined();
    }
  });

  it("rechaza un tipo de inmueble que no está en la lista cerrada", () => {
    const result = directLeadFormSchema.safeParse({ ...base, propertyType: "castillo" });
    expect(result.success).toBe(false);
  });

  it("rechaza un presupuesto no numérico, cero o fuera de rango", () => {
    expect(directLeadFormSchema.safeParse({ ...base, userStatedBudget: "no-es-un-numero" }).success).toBe(false);
    expect(directLeadFormSchema.safeParse({ ...base, userStatedBudget: "0" }).success).toBe(false);
    expect(directLeadFormSchema.safeParse({ ...base, userStatedBudget: "9999999" }).success).toBe(false);
  });
});
