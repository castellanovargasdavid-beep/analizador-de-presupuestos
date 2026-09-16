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

export const LEAD_PURCHASE_INTENT_OPTIONS = [
  { value: "explorando", label: "Solo quiero informarme" },
  { value: "comparando_presupuestos", label: "Estoy comparando presupuestos" },
  { value: "listo_para_contratar", label: "Quiero contratar pronto" },
] as const;

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
  desiredTimeframe: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : undefined)),
  purchaseIntent: z
    .enum(["explorando", "comparando_presupuestos", "listo_para_contratar"])
    .optional(),
  /**
   * El usuario confirma que ha visto y entiende el rango orientativo antes
   * de pedir presupuestos — evidencia directa de la hipótesis H4 del
   * experimento de validación comercial (el filtro de rango reduce leads
   * de baja calidad). Obligatorio: es la base para poder decir a un
   * profesional que el usuario ya conoce y acepta el orden de magnitud.
   */
  rangeAcknowledged: z.boolean().refine((v) => v === true, {
    message: "Tienes que confirmar que has visto el rango estimado",
  }),
  consentAccepted: z.boolean().refine((v) => v === true, {
    message: "Tienes que aceptar el consentimiento para poder enviar la solicitud",
  }),
  /**
   * Honeypot: campo oculto por CSS que ningún usuario real rellena. Un bot
   * que auto-rellena formularios normalmente sí lo hace. No se valida como
   * error de formulario — se comprueba aparte para poder rechazar en
   * silencio sin dar pistas a quien lo dispara (ver lib/leads/actions.ts).
   */
  website: z.string().optional(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
