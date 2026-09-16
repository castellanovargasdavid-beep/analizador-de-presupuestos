import { describe, expect, it } from "vitest";
import { leadFormSchema } from "./validation";

describe("leadFormSchema", () => {
  it("acepta un formulario mínimo válido", () => {
    const result = leadFormSchema.safeParse({
      contactName: "Ana",
      contactEmail: "ana@example.com",
      contactPhone: "",
      description: "",
      rangeAcknowledged: true,
      consentAccepted: true,
    });
    expect(result.success).toBe(true);
  });

  it("rechaza si no se acepta el consentimiento", () => {
    const result = leadFormSchema.safeParse({
      contactName: "Ana",
      contactEmail: "ana@example.com",
      rangeAcknowledged: true,
      consentAccepted: false,
    });
    expect(result.success).toBe(false);
  });

  it("rechaza si no se confirma haber visto el rango estimado", () => {
    const result = leadFormSchema.safeParse({
      contactName: "Ana",
      contactEmail: "ana@example.com",
      rangeAcknowledged: false,
      consentAccepted: true,
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un email inválido", () => {
    const result = leadFormSchema.safeParse({
      contactName: "Ana",
      contactEmail: "no-es-un-email",
      rangeAcknowledged: true,
      consentAccepted: true,
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un nombre demasiado corto", () => {
    const result = leadFormSchema.safeParse({
      contactName: "A",
      contactEmail: "ana@example.com",
      rangeAcknowledged: true,
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
      rangeAcknowledged: true,
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
      rangeAcknowledged: true,
      consentAccepted: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contactPhone).toBe("600111222");
      expect(result.data.description).toBe("Instalación en un ático");
    }
  });

  it("acepta plazo deseado e intención de compra cuando se indican", () => {
    const result = leadFormSchema.safeParse({
      contactName: "Ana",
      contactEmail: "ana@example.com",
      desiredTimeframe: "Lo antes posible",
      purchaseIntent: "listo_para_contratar",
      rangeAcknowledged: true,
      consentAccepted: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.desiredTimeframe).toBe("Lo antes posible");
      expect(result.data.purchaseIntent).toBe("listo_para_contratar");
    }
  });
});
