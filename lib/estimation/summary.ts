import { formatEUR, formatPct } from "@/lib/format";
import type { AlertSignal, BudgetLineVerdict, Verdict } from "./compare";

const VERDICT_TITULO: Record<Verdict, string> = {
  dentro_de_rango: "Dentro del rango estimado",
  por_encima: "Por encima del rango estimado",
  por_debajo: "Por debajo del rango estimado",
};

export interface SummaryArgs {
  totalRange: { min: number; max: number };
  declaredTotal: number;
  verdict: Verdict;
  deviationAbsolute: number;
  deviationPct: number;
  lineVerdicts: BudgetLineVerdict[];
  partidasAusentes: string[];
  senalesDeAlerta: AlertSignal[];
  posiblesRazones: string[];
  preguntasRecomendadas: string[];
  url: string;
}

/** Resumen en texto plano descargable — sin depender de ninguna librería de generación de PDF. */
export function buildComparisonSummaryText(args: SummaryArgs): string {
  const lines: string[] = [];
  lines.push("PRESUPUESTO CLARO — Resumen de tu comparación");
  lines.push("Instalación de aire acondicionado");
  lines.push("");
  lines.push(`Estimación orientativa (IVA incluido): ${formatEUR(args.totalRange.min)} - ${formatEUR(args.totalRange.max)}`);
  lines.push(`Tu presupuesto: ${formatEUR(args.declaredTotal)}`);
  lines.push(`Resultado: ${VERDICT_TITULO[args.verdict]}`);
  if (args.verdict !== "dentro_de_rango") {
    lines.push(
      `Diferencia aproximada: ${formatEUR(args.deviationAbsolute)} (${formatPct(args.deviationPct)}${
        args.verdict === "por_encima" ? " por encima del máximo" : " por debajo del mínimo"
      } estimado)`,
    );
  }
  lines.push("");

  if (args.lineVerdicts.length > 0) {
    lines.push("PARTIDAS DECLARADAS VS. ESPERADAS");
    for (const lv of args.lineVerdicts) {
      const declarado = lv.declared === null ? "no indicado" : formatEUR(lv.declared);
      lines.push(`- ${lv.label}: ${declarado} (esperado ${formatEUR(lv.expectedMin)} - ${formatEUR(lv.expectedMax)})`);
    }
    lines.push("");
  }

  if (args.partidasAusentes.length > 0) {
    lines.push("PARTIDAS AUSENTES");
    for (const p of args.partidasAusentes) lines.push(`- ${p}`);
    lines.push("");
  }

  if (args.senalesDeAlerta.length > 0) {
    lines.push("SEÑALES A REVISAR");
    for (const s of args.senalesDeAlerta) lines.push(`- ${s.message}`);
    lines.push("");
  }

  if (args.posiblesRazones.length > 0) {
    lines.push("POSIBLES RAZONES DE LA DIFERENCIA");
    for (const r of args.posiblesRazones) lines.push(`- ${r}`);
    lines.push("");
  }

  lines.push("PREGUNTAS RECOMENDADAS PARA TU INSTALADOR");
  for (const p of args.preguntasRecomendadas) lines.push(`- ${p}`);
  lines.push("");

  lines.push(`Enlace a este resultado: ${args.url}`);
  lines.push("");
  lines.push("Esto es una estimación orientativa, no una tasación profesional ni una acusación hacia tu instalador.");

  return lines.join("\n");
}
