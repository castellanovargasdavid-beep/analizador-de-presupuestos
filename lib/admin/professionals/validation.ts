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
