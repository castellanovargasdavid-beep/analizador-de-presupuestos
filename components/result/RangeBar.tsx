import { formatEUR } from "@/lib/format";
import type { Tone } from "../ui/Badge";

const toneToBar: Record<Tone, string> = {
  good: "bg-good",
  warning: "bg-warning",
  info: "bg-info",
  neutral: "bg-neutral-500",
};

/**
 * Barra de rango con marcador de posición — la visualización central del
 * resultado. Un único trazo (rango estimado) más un marcador puntual
 * (presupuesto declarado), nunca un color como única señal: el marcador
 * siempre va acompañado de una etiqueta numérica visible.
 */
export function RangeBar({
  rangeMin,
  rangeMax,
  marker,
}: {
  rangeMin: number;
  rangeMax: number;
  marker?: { value: number; tone: Tone; label: string };
}) {
  const values = [rangeMin, rangeMax, marker?.value].filter((v): v is number => typeof v === "number");
  const domainMin = Math.max(0, Math.min(...values) * 0.85);
  const domainMax = Math.max(...values) * 1.15;
  const span = domainMax - domainMin || 1;

  const toPct = (v: number) => ((v - domainMin) / span) * 100;
  const rangeStartPct = toPct(rangeMin);
  const rangeWidthPct = toPct(rangeMax) - rangeStartPct;
  const markerPct = marker ? toPct(marker.value) : null;

  return (
    <div className="w-full" role="img" aria-label={ariaLabel({ rangeMin, rangeMax, marker })}>
      {markerPct !== null && marker && (
        <div className="relative mb-1 h-6" style={{ marginLeft: `${markerPct}%` }}>
          <span
            className={`absolute -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-bold text-white ${toneToBar[marker.tone]}`}
          >
            {marker.label}: {formatEUR(marker.value)}
          </span>
        </div>
      )}

      <div className="relative h-5 rounded-full bg-neutral-200">
        <div
          className="absolute h-5 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-[width,left] duration-700 ease-out"
          style={{ left: `${rangeStartPct}%`, width: `${rangeWidthPct}%` }}
        />
        {markerPct !== null && marker && (
          <div
            className={`absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white ${toneToBar[marker.tone]}`}
            style={{ left: `${markerPct}%` }}
          />
        )}
      </div>

      <div className="relative mt-1 h-4 text-xs font-semibold text-neutral-700">
        <span className="absolute -translate-x-1/2" style={{ left: `${rangeStartPct}%` }}>
          {formatEUR(rangeMin)}
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: `${rangeStartPct + rangeWidthPct}%` }}>
          {formatEUR(rangeMax)}
        </span>
      </div>
    </div>
  );
}

function ariaLabel({
  rangeMin,
  rangeMax,
  marker,
}: {
  rangeMin: number;
  rangeMax: number;
  marker?: { value: number; tone: Tone; label: string };
}) {
  const base = `Rango estimado entre ${formatEUR(rangeMin)} y ${formatEUR(rangeMax)}.`;
  if (!marker) return base;
  return `${base} ${marker.label}: ${formatEUR(marker.value)}.`;
}
