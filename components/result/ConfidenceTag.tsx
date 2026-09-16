"use client";

import { useState } from "react";
import type { Confidence } from "@/lib/estimation/types";

const LABEL: Record<Confidence, string> = {
  A: "Fuente verificable (normativa o catálogo real)",
  B: "Fuente de mercado, sin metodología pública robusta",
  C: "Heurística propia, sin fuente directa",
};

const CLASS: Record<Confidence, string> = {
  A: "bg-good-bg text-good-text",
  B: "bg-info-bg text-info-text",
  C: "bg-neutral-100 text-neutral-700",
};

/**
 * Antes dependía solo de `title` (hover), inútil al tacto en móvil. Ahora
 * es un botón: el `title` se mantiene para quien usa ratón, y un clic/tap
 * despliega la misma explicación de forma visible y accesible.
 */
export function ConfidenceTag({ confidence }: { confidence: Confidence }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        type="button"
        title={LABEL[confidence]}
        aria-expanded={open}
        aria-label={`Fiabilidad ${confidence}: ${LABEL[confidence]}`}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${CLASS[confidence]}`}
      >
        {confidence}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-10 mt-1.5 w-48 -translate-x-1/2 rounded-lg bg-neutral-950 px-2.5 py-1.5 text-xs font-normal text-white shadow-lg"
        >
          {LABEL[confidence]}
        </span>
      )}
    </span>
  );
}
