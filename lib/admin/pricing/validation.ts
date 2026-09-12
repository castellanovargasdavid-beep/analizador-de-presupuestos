import { z } from "zod";

export const dataSourceFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(300),
  url: z.string().trim().url().max(500).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  sourceType: z.enum(["oficial", "catalogo_real", "mercado", "heuristica_propia"]),
  confidence: z.enum(["A", "B", "C"]),
  geographicScope: z.string().trim().min(2).max(200),
  publishedOn: z.string().trim().max(20).optional().transform((v) => (v ? v : undefined)),
  retrievedOn: z.string().trim().min(4).max(20),
  notes: z.string().trim().min(1).max(2000),
  isActive: z.boolean(),
});

export const pricingRuleFormSchema = z.object({
  id: z.string().uuid().optional(),
  serviceTypeId: z.string().uuid("Elige un servicio"),
  version: z.coerce.number().int().min(1),
  name: z.string().trim().min(2).max(300),
  isActive: z.boolean(),
});

export const pricingFactorFormSchema = z.object({
  id: z.string().uuid().optional(),
  ruleId: z.string().uuid(),
  key: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9_]+$/, "Solo minúsculas, números y guion bajo (ej. 'equipo_base')"),
  label: z.string().trim().min(2).max(300),
  kind: z.enum(["base", "multiplier", "additive"]),
  groupKey: z.string().trim().min(2).max(100),
  perUnitOfQuantity: z.string().trim().max(100).optional().transform((v) => (v ? v : undefined)),
  valueMin: z.coerce.number(),
  valueMax: z.coerce.number(),
  conditionRaw: z.string().max(2000).optional().default(""),
  sourceId: z.string().uuid().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  confidence: z.enum(["A", "B", "C"]),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  isActive: z.boolean(),
  notes: z.string().trim().max(2000).optional().transform((v) => (v ? v : undefined)),
}).refine((data) => data.valueMax >= data.valueMin, {
  message: "El máximo no puede ser menor que el mínimo",
  path: ["valueMax"],
});

export const vatRateFormSchema = z.object({
  id: z.string().uuid().optional(),
  serviceTypeId: z.string().uuid("Elige un servicio"),
  scenario: z.string().trim().min(2).max(100),
  ratePct: z.coerce.number().min(0).max(1),
  description: z.string().trim().min(2).max(500),
  sourceId: z.string().uuid().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  isActive: z.boolean(),
});

export const uncertaintyBandFormSchema = z
  .object({
    id: z.string().uuid().optional(),
    label: z.string().trim().min(2).max(200),
    minConfidenceScore: z.coerce.number().min(0).max(1),
    maxConfidenceScore: z.coerce.number().min(0).max(1),
    paddingPct: z.coerce.number().min(0).max(2),
    notes: z.string().trim().max(1000).optional().transform((v) => (v ? v : undefined)),
    isActive: z.boolean(),
  })
  .refine((data) => data.maxConfidenceScore >= data.minConfidenceScore, {
    message: "El máximo de confianza no puede ser menor que el mínimo",
    path: ["maxConfidenceScore"],
  });
