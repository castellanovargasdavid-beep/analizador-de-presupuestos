import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(2)
  .max(150)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones");

export const guideFormSchema = z.object({
  id: z.string().uuid().optional(),
  slug,
  title: z.string().trim().min(2).max(300),
  summary: z.string().trim().min(2).max(500),
  metaDescription: z.string().trim().min(2).max(300),
  intro: z.string().trim().min(2).max(1000),
  bodyText: z.string().trim().min(2).max(10000),
  ctaHref: z.string().trim().max(300).optional().transform((v) => (v ? v : undefined)),
  ctaLabel: z.string().trim().max(200).optional().transform((v) => (v ? v : undefined)),
  relatedLinksText: z.string().max(2000).optional().default(""),
  status: z.enum(["borrador", "publicado", "archivado"]),
});

export const questionFormSchema = z.object({
  id: z.string().uuid().optional(),
  slug,
  question: z.string().trim().min(2).max(300),
  shortAnswer: z.string().trim().min(2).max(500),
  detailText: z.string().trim().min(2).max(5000),
  relatedLinksText: z.string().max(2000).optional().default(""),
  status: z.enum(["borrador", "publicado", "archivado"]),
});

export const faqFormSchema = z.object({
  id: z.string().uuid().optional(),
  pageKey: z.string().trim().min(2).max(150),
  question: z.string().trim().min(2).max(300),
  answer: z.string().trim().min(2).max(1000),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  isActive: z.boolean(),
});
