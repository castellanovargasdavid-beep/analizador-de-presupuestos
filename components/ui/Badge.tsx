import type { ReactNode } from "react";
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon } from "./icons";

export type Tone = "good" | "warning" | "info" | "neutral";

const toneClasses: Record<Tone, string> = {
  good: "bg-good-bg text-good-text",
  warning: "bg-warning-bg text-warning-text",
  info: "bg-info-bg text-info-text",
  neutral: "bg-neutral-100 text-neutral-700",
};

const toneIcon: Record<Tone, ReactNode> = {
  good: <CheckCircleIcon />,
  warning: <AlertTriangleIcon />,
  info: <InfoIcon />,
  neutral: null,
};

/**
 * Insignia de estado. Nunca solo color: siempre icono + texto, según la
 * guía de accesibilidad de dataviz (un color de estado nunca es la única
 * señal).
 */
export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${toneClasses[tone]}`}
    >
      {toneIcon[tone]}
      {children}
    </span>
  );
}
