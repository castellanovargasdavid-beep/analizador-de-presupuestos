import type { Confidence } from "@/lib/pricing/types";

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

export function ConfidenceTag({ confidence }: { confidence: Confidence }) {
  return (
    <span
      title={LABEL[confidence]}
      className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${CLASS[confidence]}`}
    >
      {confidence}
    </span>
  );
}
