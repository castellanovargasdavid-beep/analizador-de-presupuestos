import { Card } from "@/components/ui/Card";
import { InfoIcon } from "@/components/ui/icons";
import type { Confidence } from "@/lib/quality/types";

const COPY: Record<Confidence, { title: string; body: string }> = {
  A: {
    title: "De dónde sale este rango",
    body:
      "Este rango se ha contrastado contra trabajos reales cerrados a través de esta plataforma y ha demostrado ser preciso (ver la metodología completa). Sigue sin ser un presupuesto cerrado, pero es la referencia más fiable que ofrecemos hoy.",
  },
  B: {
    title: "De dónde sale este rango",
    body:
      "El dato de mercado más fiable que tenemos para este servicio es de confianza B (portales que agregan presupuestos reales o tarifas de mercado, pero todavía sin contrastar contra trabajos reales cerrados en esta plataforma) — no hay ninguna fuente oficial o normativa equivalente a la de otras calculadoras de este sitio, ni suficientes casos reales todavía para medir el error. Por eso el margen de este rango es deliberadamente amplio.",
  },
  C: {
    title: "De dónde sale este rango (dato limitado)",
    body:
      "Los datos disponibles para este servicio son todavía escasos o indirectos — este rango es puramente orientativo y debe tomarse con más cautela que el resto de calculadoras de este sitio.",
  },
};

/**
 * Aviso de confianza para servicios que no son aire acondicionado — el
 * nivel llega ya calculado por `lib/quality/confidence-gate.ts` (nunca
 * declarado a mano), así que este componente solo se ocupa de explicarlo
 * en lenguaje llano. Ver docs/CALCULATOR-QUALITY-STANDARD.md.
 */
export function ConfidenceDisclosure({ level }: { level: Confidence }) {
  const { title, body } = COPY[level];
  return (
    <Card className="mt-6 border-info-bg bg-info-bg/40">
      <div className="flex gap-3">
        <InfoIcon className="mt-0.5 size-5 shrink-0 text-info-text" />
        <div>
          <h2 className="font-bold text-neutral-950">{title}</h2>
          <p className="mt-2 text-sm text-neutral-700">
            {body} Esto <strong>no es un presupuesto vinculante</strong>: es una referencia para negociar con
            criterio, no un precio cerrado.
          </p>
        </div>
      </div>
    </Card>
  );
}
