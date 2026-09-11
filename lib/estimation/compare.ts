import type { DeclaredBudgetValues } from "./validation";
import type { EvaluationResult } from "./types";

export type Verdict = "dentro_de_rango" | "por_encima" | "por_debajo";
export type LineStatus = "dentro" | "por_encima" | "no_declarado";

export interface BudgetLineVerdict {
  groupKey: string;
  label: string;
  declared: number | null;
  expectedMin: number;
  expectedMax: number;
  status: LineStatus;
}

export interface ComparisonResult {
  verdict: Verdict;
  deviationPct: number;
  deviationAbsolute: number;
  lineVerdicts: BudgetLineVerdict[];
  posiblesRazones: string[];
  preguntasRecomendadas: string[];
}

const RAZONES_POR_ENCIMA = [
  "Equipo de una gama superior a la considerada en la estimación (marca, eficiencia energética, nivel de ruido).",
  "Dificultad de instalación no capturada en el formulario (accesos complicados, fachada protegida, altura).",
  "Trabajos adicionales incluidos que no se han indicado (obra, refuerzo de instalación eléctrica, andamiaje).",
  "Desplazamiento o urgencia del servicio.",
  "Garantía ampliada o mantenimiento incluido en el precio.",
];

const RAZONES_POR_DEBAJO = [
  "Puede faltar alcance: revisa que el presupuesto incluya retirada del equipo antiguo, materiales y puesta en marcha.",
  "Equipo de gama más económica de lo esperado.",
  "Posible ausencia de garantía por escrito o de certificado/boletín de la instalación.",
];

const PREGUNTAS_BASE = [
  "¿El precio incluye la retirada y reciclaje del equipo antiguo?",
  "¿Cuántos metros de línea frigorífica están incluidos en el precio, y cuánto cuesta cada metro adicional?",
  "¿Qué marca y modelo exacto de equipo se va a instalar?",
  "¿El presupuesto incluye el certificado/boletín de la instalación?",
  "¿Qué garantía tiene la instalación (no solo el equipo) y quién responde si falla en los primeros meses?",
];

const GROUP_LABELS: Record<string, string> = {
  equipo: "Equipo",
  paquete_conductos: "Equipo + instalación (conductos)",
  mano_obra: "Mano de obra",
  extras: "Extras",
};

const DECLARED_FIELD_BY_GROUP: Record<string, keyof DeclaredBudgetValues> = {
  equipo: "equipo",
  paquete_conductos: "equipo",
  mano_obra: "instalacionManoObra",
  extras: "materialesExtras",
};

function verdictFromRange(total: number, range: { min: number; max: number }): { verdict: Verdict; deviationPct: number } {
  if (total > range.max) return { verdict: "por_encima", deviationPct: (total - range.max) / range.max };
  if (total < range.min) return { verdict: "por_debajo", deviationPct: (range.min - total) / range.min };
  return { verdict: "dentro_de_rango", deviationPct: 0 };
}

export function compareBudget(
  evaluation: EvaluationResult,
  declared: DeclaredBudgetValues,
  options: { riteSuperaUmbral: boolean },
): ComparisonResult {
  const totalRange = evaluation.ranges.find((r) => r.groupKey === "total")!;
  const { verdict, deviationPct } = verdictFromRange(declared.total, totalRange);
  const deviationAbsolute =
    verdict === "por_encima"
      ? declared.total - totalRange.max
      : verdict === "por_debajo"
        ? totalRange.min - declared.total
        : 0;

  const lineVerdicts: BudgetLineVerdict[] = [];
  for (const groupKey of ["equipo", "paquete_conductos", "mano_obra", "extras"]) {
    const range = evaluation.ranges.find((r) => r.groupKey === groupKey);
    if (!range) continue;
    const field = DECLARED_FIELD_BY_GROUP[groupKey];
    const declaredValue = declared[field];
    lineVerdicts.push({
      groupKey,
      label: GROUP_LABELS[groupKey] ?? groupKey,
      declared: declaredValue ?? null,
      expectedMin: range.min,
      expectedMax: range.max,
      status: declaredValue === undefined ? "no_declarado" : declaredValue > range.max ? "por_encima" : "dentro",
    });
  }

  return {
    verdict,
    deviationPct,
    deviationAbsolute,
    lineVerdicts,
    posiblesRazones: posiblesRazonesFor(verdict),
    preguntasRecomendadas: preguntasRecomendadasFor({
      riteSuperaUmbral: options.riteSuperaUmbral,
      materialesSharePctAlto: evaluation.vat.materialesSharePct > 0.4,
    }),
  };
}

/**
 * Separadas de `compareBudget` a propósito: son puramente texto derivado de
 * (verdict / RITE / reparto de materiales), así que la página de resultado
 * puede recalcularlas a partir de una `Estimate` ya guardada sin tener que
 * persistir el texto en la base de datos (los NÚMEROS sí se congelan al
 * guardarse; el texto explicativo puede mejorar con el tiempo).
 */
export function posiblesRazonesFor(verdict: Verdict): string[] {
  if (verdict === "por_encima") return RAZONES_POR_ENCIMA;
  if (verdict === "por_debajo") return RAZONES_POR_DEBAJO;
  return [];
}

/** Reconstruye el reparto de materiales a partir de los rangos agregados ya persistidos. */
export function materialesSharePctFromRanges(ranges: { groupKey: string; min: number; max: number }[]): number {
  const componentGroups = ["equipo", "mano_obra", "extras", "paquete_conductos"];
  const equipo = ranges.find((r) => r.groupKey === "equipo" || r.groupKey === "paquete_conductos");
  const preMultiplierMid = ranges
    .filter((r) => componentGroups.includes(r.groupKey))
    .reduce((sum, r) => sum + (r.min + r.max) / 2, 0);
  if (!equipo || preMultiplierMid === 0) return 0;
  return (equipo.min + equipo.max) / 2 / preMultiplierMid;
}

export function preguntasRecomendadasFor(options: { riteSuperaUmbral: boolean; materialesSharePctAlto: boolean }): string[] {
  const preguntas = [...PREGUNTAS_BASE];
  if (options.riteSuperaUmbral) {
    preguntas.unshift(
      "Esta instalación supera 5 kW: ¿el presupuesto incluye la memoria técnica y el registro ante la Comunidad Autónoma?",
    );
  }
  if (options.materialesSharePctAlto) {
    preguntas.push(
      "El equipo representa más del 40% del presupuesto: si compras el equipo por separado y solo contratas la " +
        "instalación, el IVA de la mano de obra podría reducirse al 10%. Pregúntalo.",
    );
  }
  return preguntas;
}
