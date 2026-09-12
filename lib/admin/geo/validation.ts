import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones");

export const regionFormSchema = z.object({
  id: z.string().uuid().optional(),
  slug,
  name: z.string().trim().min(2).max(200),
});

export const provinceFormSchema = z.object({
  id: z.string().uuid().optional(),
  regionId: z.string().uuid("Elige una región"),
  slug,
  name: z.string().trim().min(2).max(200),
});

export const cityFormSchema = z.object({
  id: z.string().uuid().optional(),
  provinceId: z.string().uuid("Elige una provincia"),
  slug,
  name: z.string().trim().min(2).max(200),
});
