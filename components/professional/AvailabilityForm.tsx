"use client";

import { useActionState, useState } from "react";
import { updateAvailabilityAction, type ActionResult } from "@/lib/professional/lead-actions";
import { Button } from "@/components/ui/Button";

const initialState: ActionResult = { ok: true };

export function AvailabilityForm({ initiallyPaused, currentReason }: { initiallyPaused: boolean; currentReason: string | null }) {
  const [state, formAction, isPending] = useActionState(
    (_prev: ActionResult, formData: FormData) => updateAvailabilityAction(formData),
    initialState,
  );
  const [paused, setPaused] = useState(initiallyPaused);

  return (
    <form action={formAction} className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input name="paused" type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} />
        No quiero recibir nuevas solicitudes ahora mismo
      </label>

      {paused && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-neutral-800">Motivo (opcional)</span>
            <input
              name="reason"
              type="text"
              defaultValue={currentReason ?? ""}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-800">Durante cuántas horas</span>
            <input
              name="hours"
              type="number"
              min={1}
              max={24 * 90}
              defaultValue={24 * 7}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
        </div>
      )}

      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}
