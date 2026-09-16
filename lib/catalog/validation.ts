import { z } from "zod";

export const notifyMeFormSchema = z.object({
  serviceTypeId: z.string().uuid(),
  email: z.string().trim().email("Escribe un email válido"),
  /** Honeypot — igual que en lib/leads/validation.ts. */
  website: z.string().optional(),
});

export type NotifyMeFormValues = z.infer<typeof notifyMeFormSchema>;

/**
 * Mismo texto de consentimiento que un lead con estimación, salvo que aquí
 * no hay ningún rango que mostrar (el servicio no tiene calculadora): se
 * pide presupuesto directamente, no se compara nada.
 */
export const DIRECT_LEAD_CONSENT_TEXT =
  "Acepto que Presupuesto Claro comparta esta solicitud (el servicio, la ubicación y esta descripción) con " +
  "profesionales que verifique para poder recibir presupuestos, y que me contacten por email o teléfono para " +
  "gestionarla.";

/**
 * `serviceTypeId` NO forma parte de este esquema a propósito: llega como
 * argumento aparte a `submitDirectLeadAction` (nunca desde un campo de
 * formulario que el cliente podría manipular) y se usa directamente, sin
 * pasar por `parsed.data` — ver lib/catalog/actions.ts.
 */
export const directLeadFormSchema = z.object({
  regionSlug: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  contactName: z.string().trim().min(2, "Escribe tu nombre").max(200),
  contactEmail: z.string().trim().email("Escribe un email válido"),
  contactPhone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => (v ? v : undefined)),
  description: z.string().trim().max(2000, "Máximo 2000 caracteres").min(10, "Cuéntanos brevemente qué necesitas"),
  consentAccepted: z.boolean().refine((v) => v === true, {
    message: "Tienes que aceptar el consentimiento para poder enviar la solicitud",
  }),
  website: z.string().optional(),
});

export type DirectLeadFormValues = z.infer<typeof directLeadFormSchema>;
