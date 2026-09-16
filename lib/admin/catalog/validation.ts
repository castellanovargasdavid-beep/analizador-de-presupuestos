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
  iconKey: z.string().trim().max(50).optional().transform((v) => v || undefined),
  isActive: z.boolean(),
});

export const serviceFormSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid("Elige una categoría"),
  professionId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  slug,
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().transform((v) => v || undefined),
  unitLabel: z.string().trim().max(200).optional().transform((v) => v || undefined),
  vatReducedEligible: z.boolean(),
  availabilityStatus: z.enum(["disponible", "solo_solicitud", "proximamente"]),
  isActive: z.boolean(),
});

/**
 * Profesión del catálogo (categoría → profesión → servicio) — no
 * confundir con `professionals` (el profesional real que se asigna a un
 * lead, ver lib/admin/professionals/). Son dos tablas y dos conceptos
 * distintos que comparten nombre en español por venir del mismo dominio.
 */
export const catalogProfessionFormSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid("Elige una categoría"),
  slug,
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().transform((v) => v || undefined),
  iconKey: z.string().trim().max(50).optional().transform((v) => v || undefined),
  status: z.enum(["borrador", "publicado", "archivado"]),
  sortOrder: z.coerce.number().int().min(0).max(1000),
});

export const materialLevelFormSchema = z.object({
  id: z.string().uuid().optional(),
  slug,
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().transform((v) => v || undefined),
  sortOrder: z.coerce.number().int().min(0).max(1000),
});
