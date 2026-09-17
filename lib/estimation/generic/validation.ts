/**
 * Validación del formulario genérico de calculadora — usado por los 11
 * servicios nuevos con calculadora orientativa (grifo, cerradura, pintura,
 * enchufes, puntos de luz, termo, fuga, alicatado, tabique, armario).
 *
 * A diferencia de `lib/estimation/validation.ts` (con nombres de campo
 * fijos, específicos de aire acondicionado), aquí el input es un mapa
 * genérico de `selections`/`quantities`/`flags` — el significado de cada
 * clave lo define `calculator-configs.ts` por servicio, y el motor
 * (`engine.ts`) ya es agnóstico a esos nombres.
 */
import { z } from "zod";
import type { EstimationInput } from "../types";

const MAX_KEYS = 20;
const MAX_STRING_LEN = 100;
const MAX_QUANTITY = 100_000;

export const genericCalculatorFormSchema = z.object({
  categorySlug: z.string().trim().min(1).max(100),
  serviceSlug: z.string().trim().min(1).max(100),
  selections: z.record(z.string().max(MAX_STRING_LEN), z.string().max(MAX_STRING_LEN)).refine((o) => Object.keys(o).length <= MAX_KEYS, {
    message: `Como mucho ${MAX_KEYS} selecciones`,
  }),
  quantities: z
    .record(z.string().max(MAX_STRING_LEN), z.number().min(0).max(MAX_QUANTITY))
    .refine((o) => Object.keys(o).length <= MAX_KEYS, { message: `Como mucho ${MAX_KEYS} cantidades` }),
  flags: z.record(z.string().max(MAX_STRING_LEN), z.boolean()).refine((o) => Object.keys(o).length <= MAX_KEYS, {
    message: `Como mucho ${MAX_KEYS} indicadores`,
  }),
  regionSlug: z.string().trim().min(1).max(100).nullable().optional(),
  clientePersonaFisicaUsoParticular: z.boolean(),
  viviendaMasDeDosAnos: z.boolean(),
});

export type GenericCalculatorFormValues = z.infer<typeof genericCalculatorFormSchema>;

export function toGenericEstimationInput(values: GenericCalculatorFormValues): EstimationInput {
  return {
    selections: values.selections,
    quantities: values.quantities,
    flags: values.flags,
    regionSlug: values.regionSlug ?? null,
  };
}
