import { z } from "zod";

export const LEAD_STATUS_OPTIONS = [
  "nuevo",
  "validado",
  "descartado",
  "asignado",
  "enviado",
  "contactado",
  "sin_cobertura",
  "cerrado",
  "con_incidencia",
] as const;

export const LEAD_PAYMENT_STATUS_OPTIONS = ["no_aplica", "pendiente", "pagado"] as const;

const optionalMoney = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? Number(v) : undefined))
  .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0 && v <= 1_000_000), {
    message: "Introduce un importe válido",
  });

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const leadUpdateFormSchema = z
  .object({
    id: z.string().uuid(),
    status: z.enum(LEAD_STATUS_OPTIONS),
    assignedProfessionalId: z
      .string()
      .uuid()
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v : undefined)),
    discardReason: optionalText(500),
    contactOutcome: optionalText(1000),
    agreedPrice: optionalMoney,
    paymentStatus: z.enum(LEAD_PAYMENT_STATUS_OPTIONS),
    paymentAmount: optionalMoney,
    incidentNotes: optionalText(1000),
  })
  .superRefine((data, ctx) => {
    if (data.status === "descartado" && !data.discardReason) {
      ctx.addIssue({ code: "custom", path: ["discardReason"], message: "Indica el motivo del descarte" });
    }
    if (data.status === "con_incidencia" && !data.incidentNotes) {
      ctx.addIssue({ code: "custom", path: ["incidentNotes"], message: "Describe la incidencia" });
    }
    if (data.paymentStatus === "pagado" && data.paymentAmount === undefined) {
      ctx.addIssue({ code: "custom", path: ["paymentAmount"], message: "Indica el importe cobrado" });
    }
  });

export type LeadUpdateFormValues = z.infer<typeof leadUpdateFormSchema>;
