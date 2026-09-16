import { z } from "zod";

export const professionalFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Escribe un nombre").max(200),
  email: z.string().trim().email("Escribe un email válido"),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => (v ? v : undefined)),
  verificationStatus: z.enum(["pendiente", "verificado", "rechazado"]),
  isActive: z.boolean(),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  maxConcurrentLeads: z.coerce.number().int().min(1, "Debe ser al menos 1").max(100).default(5),
  /** Contraseña de acceso al portal. En blanco = no cambiar (o sin acceso todavía si nunca se ha fijado). */
  newPassword: z
    .string()
    .trim()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(200)
    .optional()
    .transform((v) => (v ? v : undefined)),
  pauseReason: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : undefined)),
  /** > 0 = pausar desde ahora esas horas. 0/vacío = no tocar la pausa existente, salvo que `resumeNow` esté marcado. */
  pauseHours: z.coerce.number().int().min(0).max(8760).optional().default(0),
  /** Levanta explícitamente una pausa existente, aunque `pauseHours` sea 0. */
  resumeNow: z.boolean().default(false),
});

export type ProfessionalFormValues = z.infer<typeof professionalFormSchema>;

export const serviceAreaFormSchema = z.object({
  professionalId: z.string().uuid(),
  serviceTypeId: z.string().uuid("Elige un servicio"),
  regionId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});

export type ServiceAreaFormValues = z.infer<typeof serviceAreaFormSchema>;
