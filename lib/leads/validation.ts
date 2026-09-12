import { z } from "zod";

/**
 * Versionado explícito del texto de consentimiento: si el texto cambia,
 * se sube la versión. Así un lead guardado siempre puede demostrar
 * exactamente qué aceptó el usuario en su momento (auditoría RGPD), aunque
 * el texto mostrado hoy en la web sea distinto.
 */
export const LEAD_CONSENT_VERSION = "2026-09-lead-v1";

export const LEAD_CONSENT_TEXT =
  "Acepto que Presupuesto Claro comparta esta solicitud (el servicio, la ubicación, mi presupuesto si lo tengo y " +
  "esta descripción) con profesionales que verifique para poder recibir presupuestos, y que me contacten por " +
  "email o teléfono para gestionarla.";

export const leadFormSchema = z.object({
  contactName: z.string().trim().min(2, "Escribe tu nombre").max(200),
  contactEmail: z.string().trim().email("Escribe un email válido"),
  contactPhone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => (v ? v : undefined)),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  consentAccepted: z.boolean().refine((v) => v === true, {
    message: "Tienes que aceptar el consentimiento para poder enviar la solicitud",
  }),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
