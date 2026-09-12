"use client";

import { useActionState } from "react";
import { saveUncertaintyBandAction, type ActionResult } from "@/lib/admin/pricing/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

export function UncertaintyBandForm({
  initial,
}: {
  initial?: {
    id?: string;
    label?: string;
    minConfidenceScore?: number;
    maxConfidenceScore?: number;
    paddingPct?: number;
    notes?: string | null;
    isActive?: boolean;
  };
}) {
  const [state, formAction] = useActionState(saveUncertaintyBandAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Etiqueta</span>
        <input
          name="label"
          defaultValue={initial?.label}
          required
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Confianza mín. (0-1)</span>
          <input
            name="minConfidenceScore"
            type="number"
            step="0.01"
            min={0}
            max={1}
            defaultValue={initial?.minConfidenceScore}
            required
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Confianza máx. (0-1)</span>
          <input
            name="maxConfidenceScore"
            type="number"
            step="0.01"
            min={0}
            max={1}
            defaultValue={initial?.maxConfidenceScore}
            required
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Ensanche del rango (0-2)</span>
          <input
            name="paddingPct"
            type="number"
            step="0.01"
            min={0}
            max={2}
            defaultValue={initial?.paddingPct}
            required
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Notas (opcional)</span>
        <textarea
          name="notes"
          defaultValue={initial?.notes ?? ""}
          rows={2}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="isActive" type="checkbox" defaultChecked={initial?.isActive ?? true} />
        Activa
      </label>

      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}

      <SubmitButton>{initial?.id ? "Guardar cambios" : "Crear banda"}</SubmitButton>
    </form>
  );
}
