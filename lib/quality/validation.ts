import { z } from "zod";

/**
 * Alta de una muestra de validación real — ver docs/PRICE-VALIDATION-PROTOCOL.md.
 * Deliberadamente no hay ningún campo "confidence" aquí: una muestra no
 * declara ni afecta el nivel de confianza directamente, solo aporta datos
 * que `lib/quality/confidence-gate.ts` usa para calcularlo.
 */
export const validationSampleFormSchema = z.object({
  id: z.string().uuid().optional(),
  serviceTypeId: z.string().uuid("Elige un servicio"),
  regionId: z.string().uuid().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  source: z.enum(["lead_cerrado", "aportado_manualmente"]),
  relatedLeadId: z.string().uuid().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  relatedEstimateId: z.string().uuid().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  projectCharacteristics: z.string().trim().max(2000).optional().transform((v) => (v ? v : undefined)),
  finalPriceWithVat: z.coerce.number().positive("El precio final debe ser mayor que 0").max(1_000_000),
  includesVat: z.boolean(),
  includesMaterials: z.boolean(),
  requiredVisit: z.boolean(),
  hadUnexpectedIssues: z.boolean(),
  quoteDate: z.string().trim().min(4, "Indica la fecha del presupuesto/trabajo real"),
  notes: z.string().trim().max(2000).optional().transform((v) => (v ? v : undefined)),
});

export type ValidationSampleFormValues = z.infer<typeof validationSampleFormSchema>;

/**
 * Metadatos de metodología/revisión de una regla de precio — ver
 * docs/CALCULATOR-QUALITY-STANDARD.md §2-3. Nunca incluye un campo de
 * "nivel de confianza": ese valor se calcula, nunca se declara aquí.
 */
export const pricingRuleQualityFormSchema = z.object({
  ruleId: z.string().uuid(),
  methodologyDocPath: z.string().trim().max(300).optional().transform((v) => (v ? v : undefined)),
  geographicScope: z.string().trim().max(200).optional().transform((v) => (v ? v : undefined)),
  reviewedBy: z.string().trim().max(200).optional().transform((v) => (v ? v : undefined)),
  lastReviewedAt: z.string().trim().max(20).optional().transform((v) => (v ? v : undefined)),
  nextReviewDueAt: z.string().trim().max(20).optional().transform((v) => (v ? v : undefined)),
  knownIssues: z.string().trim().max(2000).optional().transform((v) => (v ? v : undefined)),
});

export type PricingRuleQualityFormValues = z.infer<typeof pricingRuleQualityFormSchema>;
