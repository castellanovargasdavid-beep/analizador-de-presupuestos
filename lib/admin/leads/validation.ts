import { z } from "zod";

export const leadUpdateFormSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["nuevo", "en_revision", "contactado", "sin_cobertura", "cerrado"]),
  assignedProfessionalId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});
