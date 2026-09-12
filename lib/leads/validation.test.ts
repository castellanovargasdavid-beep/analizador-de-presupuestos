import { describe, expect, it } from "vitest";
import { leadFormSchema } from "./validation";

describe("leadFormSchema", () => {
  it("acepta un formulario mínimo válido", () => {
    const result = leadFormSchema.safeParse({
      contactName: "Ana",
      contactEmail: "ana@example.com",
      contactPhone: "",
      description: "",
      consentAccepted: true,
    });
    expect(result.success).toBe(true);
  });

  it("rechaza si no se acepta el consentimiento", () => {
    const result = leadFormSchema.safeParse({
      contactName: "Ana",
      contactEmail: "ana@example.com",
      consentAccepted: false,
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un email inválido", () => {
    const result = leadFormSchema.safeParse({
      contactName: "Ana",
      contactEmail: "no-es-un-email",
      consentAccepted: true,
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un nombre demasiado corto", () => {
    const result = leadFormSchema.safeParse({
      contactName: "A",
      contactEmail: "ana@example.com",
      consentAccepted: true,
    });
    expect(result.success).toBe(false);
  });

  it("normaliza teléfono y descripción vacíos a undefined", () => {
    const result = leadFormSchema.safeParse({
      contactName: "Ana",
      contactEmail: "ana@example.com",
      contactPhone: "   ",
      description: "   ",
      consentAccepted: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contactPhone).toBeUndefined();
      expect(result.data.description).toBeUndefined();
    }
  });

  it("acepta teléfono y descripción cuando llevan contenido real", () => {
    const result = leadFormSchema.safeParse({
      contactName: "Ana",
      contactEmail: "ana@example.com",
      contactPhone: "600111222",
      description: "Instalación en un ático",
      consentAccepted: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contactPhone).toBe("600111222");
      expect(result.data.description).toBe("Instalación en un ático");
    }
  });
});
