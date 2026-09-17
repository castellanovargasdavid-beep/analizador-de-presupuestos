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

export const leadPropertyTypeOptions = ["piso", "casa", "local", "otro"] as const;
export const leadUrgencyOptions = ["normal", "urgente"] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

/**
 * `serviceTypeId` NO forma parte de este esquema a propósito: llega como
 * argumento aparte a `submitDirectLeadAction` (nunca desde un campo de
 * formulario que el cliente podría manipular) y se usa directamente, sin
 * pasar por `parsed.data` — ver lib/catalog/actions.ts.
 *
 * Los campos añadidos tras `description` son todos opcionales a propósito
 * ("no añadas campos irrelevantes ni obligues a responder lo que no haga
 * falta") — existen para que un profesional pueda valorar el trabajo sin
 * tener que preguntarlo todo por teléfono, no para alargar el formulario.
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
  propertyType: z
    .enum(leadPropertyTypeOptions)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  urgency: z
    .enum(leadUrgencyOptions)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  desiredTimeframe: optionalText(200),
  currentState: optionalText(1000),
  approxDimensions: optionalText(200),
  userStatedBudget: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v.replace(/[^0-9.]/g, "")) : undefined))
    .refine((v) => v === undefined || (Number.isFinite(v) && v > 0 && v <= 1_000_000), {
      message: "Introduce un importe válido",
    }),
  consentAccepted: z.boolean().refine((v) => v === true, {
    message: "Tienes que aceptar el consentimiento para poder enviar la solicitud",
  }),
  website: z.string().optional(),
});

export type DirectLeadFormValues = z.infer<typeof directLeadFormSchema>;
