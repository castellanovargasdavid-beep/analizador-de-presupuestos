import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones (ej. 'aire-acondicionado')");

export const categoryFormSchema = z.object({
  id: z.string().uuid().optional(),
  slug,
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().transform((v) => v || undefined),
  isActive: z.boolean(),
});

export const serviceFormSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid("Elige una categoría"),
  slug,
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().transform((v) => v || undefined),
  unitLabel: z.string().trim().max(200).optional().transform((v) => v || undefined),
  vatReducedEligible: z.boolean(),
  isActive: z.boolean(),
});

export const materialLevelFormSchema = z.object({
  id: z.string().uuid().optional(),
  slug,
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().transform((v) => v || undefined),
  sortOrder: z.coerce.number().int().min(0).max(1000),
});
