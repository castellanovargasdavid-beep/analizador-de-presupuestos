"use client";

import { useActionState } from "react";
import { savePricingRuleQualityAction, type ActionResult } from "@/lib/quality/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

export interface PricingRuleQualityValues {
  ruleId: string;
  methodologyDocPath?: string | null;
  geographicScope?: string | null;
  reviewedBy?: string | null;
  lastReviewedAt?: Date | null;
  nextReviewDueAt?: Date | null;
  knownIssues?: string | null;
}

function toDateInputValue(d?: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export function PricingRuleQualityForm({ initial }: { initial: PricingRuleQualityValues }) {
  const [state, formAction] = useActionState(savePricingRuleQualityAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="ruleId" value={initial.ruleId} />
      <p className="text-xs text-neutral-500">
        Ninguno de estos campos activa por sí solo &ldquo;confianza A&rdquo;: son los hechos que{" "}
        <code>confidence-gate.ts</code> comprueba para calcularla. Ver docs/CALCULATOR-QUALITY-STANDARD.md.
      </p>

      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">
          Ruta del documento de metodología (ej. docs/metodologia/cambiar-un-grifo.md)
        </span>
        <input
          name="methodologyDocPath"
          defaultValue={initial.methodologyDocPath ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Cobertura geográfica declarada</span>
        <input
          name="geographicScope"
          defaultValue={initial.geographicScope ?? ""}
          placeholder="España, sin diferenciación autonómica"
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Revisado por</span>
          <input
            name="reviewedBy"
            defaultValue={initial.reviewedBy ?? ""}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Última revisión</span>
          <input
            name="lastReviewedAt"
            type="date"
            defaultValue={toDateInputValue(initial.lastReviewedAt)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Próxima revisión debida</span>
          <input
            name="nextReviewDueAt"
            type="date"
            defaultValue={toDateInputValue(initial.nextReviewDueAt)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">
          Limitaciones conocidas (puede tener contenido incluso en confianza A — lo que no vale es que existan sin documentar)
        </span>
        <textarea
          name="knownIssues"
          defaultValue={initial.knownIssues ?? ""}
          rows={3}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}

      <SubmitButton>Guardar metadatos de metodología</SubmitButton>
    </form>
  );
}
