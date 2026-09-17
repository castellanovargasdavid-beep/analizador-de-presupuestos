import { Badge, type Tone } from "@/components/ui/Badge";
import type { RuleConfidenceReport } from "@/lib/quality/repository";

const LEVEL_TONE: Record<"A" | "B" | "C", Tone> = { A: "good", B: "info", C: "warning" };

const LEVEL_LABEL: Record<"A" | "B" | "C", string> = {
  A: "A — metodología documentada Y validada empíricamente",
  B: "B — metodología razonable, sin validación empírica suficiente",
  C: "C — orientativo, dato escaso o indirecto",
};

/**
 * Muestra el nivel de confianza CALCULADO (nunca editable a mano) de una
 * regla de precio, con el desglose de criterios que lo justifican. Ver
 * docs/CALCULATOR-QUALITY-STANDARD.md — este componente es literalmente el
 * "no permitas publicar como A si no cumple los criterios" hecho interfaz:
 * no existe ningún control en esta página para forzar un nivel.
 */
export function ConfidenceGateCard({ report }: { report: RuleConfidenceReport }) {
  const { gate, metrics } = report;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold text-neutral-950">Nivel de confianza (calculado, no editable)</h2>
        <Badge tone={LEVEL_TONE[gate.level]}>Confianza {gate.level}</Badge>
      </div>
      <p className="mt-1 text-sm text-neutral-600">{LEVEL_LABEL[gate.level]}</p>

      {gate.blockingReasons.length > 0 && (
        <div className="mt-4 rounded-xl border border-warning-bg bg-warning-bg/40 p-4">
          <p className="text-sm font-semibold text-neutral-950">
            Qué falta para el siguiente nivel {gate.level === "C" ? "(B)" : "(A)"}:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
            {gate.blockingReasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Checklist evaluado</p>
        <ul className="mt-2 divide-y divide-neutral-100">
          {gate.criteria.map((c) => (
            <li key={c.id} className="flex items-start gap-3 py-2">
              <span className={`mt-0.5 text-sm font-bold ${c.met ? "text-good-text" : "text-critical-text"}`}>
                {c.met ? "✓" : "✗"}
              </span>
              <div>
                <p className="text-sm font-medium text-neutral-950">{c.label}</p>
                <p className="text-xs text-neutral-500">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl bg-neutral-50 p-4 sm:grid-cols-2">
        <p className="text-sm text-neutral-700">
          <span className="font-semibold">Muestras totales:</span> {metrics.totalSampleSize} (
          {metrics.comparableSampleSize} comparables con una Estimate)
        </p>
        <p className="text-sm text-neutral-700">
          <span className="font-semibold">% dentro de rango:</span>{" "}
          {metrics.hitRatePct !== null ? `${Math.round(metrics.hitRatePct * 100)}%` : "sin datos suficientes"}
        </p>
        <p className="text-sm text-neutral-700">
          <span className="font-semibold">Error medio (MAE):</span>{" "}
          {metrics.meanAbsoluteError !== null ? `${metrics.meanAbsoluteError.toFixed(0)} €` : "sin datos suficientes"}
        </p>
        <p className="text-sm text-neutral-700">
          <span className="font-semibold">Error % medio (MAPE):</span>{" "}
          {metrics.meanAbsolutePercentError !== null
            ? `${Math.round(metrics.meanAbsolutePercentError * 100)}%`
            : "sin datos suficientes"}
        </p>
        <p className="text-sm text-neutral-700">
          <span className="font-semibold">Mediana del error %:</span>{" "}
          {metrics.medianAbsolutePercentError !== null
            ? `${Math.round(metrics.medianAbsolutePercentError * 100)}%`
            : "sin datos suficientes"}
        </p>
        <p className="text-sm text-neutral-700">
          <span className="font-semibold">Sesgo:</span>{" "}
          {metrics.biasPct !== null
            ? `${(metrics.biasPct * 100).toFixed(1)}% (${metrics.biasPct > 0 ? "tiende a sobrevalorar" : metrics.biasPct < 0 ? "tiende a infravalorar" : "sin sesgo"})`
            : "sin datos suficientes"}
        </p>
      </div>

      {metrics.extremeCases.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Casos extremos ({metrics.extremeCases.length}) — revisar a mano
          </p>
          <ul className="mt-2 space-y-1 text-xs text-neutral-600">
            {metrics.extremeCases.map((c) => (
              <li key={c.sampleId}>
                Muestra {c.sampleId.slice(0, 8)}…: real {c.finalPriceWithVat} € vs. estimado {c.estimateMidpoint.toFixed(0)} € (
                {Math.round(c.absolutePercentError * 100)}% de error)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
