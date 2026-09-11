/**
 * Validación de entrada — compartida entre cliente (formulario) y servidor
 * (Server Action). Nunca se confía en el input del cliente: el servidor
 * vuelve a validar siempre con este mismo esquema antes de tocar el motor.
 */
import { z } from "zod";
import type { EstimationInput } from "./types";

export const systemTypeSchema = z.enum(["split-1x1", "split-2x1", "split-3x1", "conductos"]);
export const materialLevelSchema = z.enum(["economica", "media", "premium"]);
export const retiradaEquipoSchema = z.enum(["no", "desechar", "reutilizar"]);

export const calculatorFormSchema = z.object({
  systemType: systemTypeSchema,
  materialLevel: materialLevelSchema,
  potenciaKw: z.number().min(0.5, "La potencia mínima es 0,5 kW").max(30, "Revisa la potencia introducida"),
  retiradaEquipo: retiradaEquipoSchema,
  metrosLineaFrigorificaExtra: z.number().min(0).max(100),
  canaletaVistaMetros: z.number().min(0).max(100),
  necesitaBombaCondensados: z.boolean(),
  instalacionElectricaDedicada: z.boolean(),
  accesoDificil: z.boolean(),
  regionSlug: z.string().min(1).nullable().optional(),
  clientePersonaFisicaUsoParticular: z.boolean(),
  viviendaMasDeDosAnos: z.boolean(),
});

export type CalculatorFormValues = z.infer<typeof calculatorFormSchema>;

const MAX_PRESUPUESTO = 1_000_000;
const MAX_PARTIDAS = 30;

export const budgetLineCategorySchema = z.enum(["equipo", "mano_obra", "extras", "otros"]);

export const declaredBudgetLineSchema = z.object({
  label: z.string().trim().min(1, "Ponle un nombre a la partida").max(200),
  category: budgetLineCategorySchema,
  amount: z.number().nonnegative("El importe no puede ser negativo").max(MAX_PRESUPUESTO),
});

export const declaredBudgetSchema = z.object({
  total: z.number().positive("El total debe ser mayor que 0").max(MAX_PRESUPUESTO, "Revisa el importe introducido"),
  description: z.string().trim().max(2000).optional(),
  lines: z.array(declaredBudgetLineSchema).max(MAX_PARTIDAS, `Como mucho ${MAX_PARTIDAS} partidas`).default([]),
});

export type DeclaredBudgetLineValues = z.infer<typeof declaredBudgetLineSchema>;
export type DeclaredBudgetValues = z.infer<typeof declaredBudgetSchema>;

export function toEstimationInput(values: CalculatorFormValues): EstimationInput {
  return {
    selections: {
      systemType: values.systemType,
      materialLevel: values.materialLevel,
      retiradaEquipo: values.retiradaEquipo,
    },
    quantities: {
      metrosLineaFrigorificaExtra: values.metrosLineaFrigorificaExtra,
      canaletaVistaMetros: values.canaletaVistaMetros,
      potenciaKw: values.potenciaKw,
    },
    flags: {
      necesitaBombaCondensados: values.necesitaBombaCondensados,
      instalacionElectricaDedicada: values.instalacionElectricaDedicada,
      accesoDificil: values.accesoDificil,
    },
    regionSlug: values.regionSlug ?? null,
  };
}
