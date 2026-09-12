"use client";

import { useActionState } from "react";
import { saveVatRateAction, type ActionResult } from "@/lib/admin/pricing/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

export function VatRateForm({
  initial,
  services,
  sources,
}: {
  initial?: {
    id?: string;
    serviceTypeId?: string;
    scenario?: string;
    ratePct?: number;
    description?: string;
    sourceId?: string | null;
    isActive?: boolean;
  };
  services: { id: string; name: string }[];
  sources: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(saveVatRateAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Servicio</span>
        <select
          name="serviceTypeId"
          defaultValue={initial?.serviceTypeId}
          required
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">Elige un servicio</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Escenario (clave interna)</span>
          <input
            name="scenario"
            defaultValue={initial?.scenario}
            required
            placeholder="general / reducido_vivienda_particular"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Tipo (0-1, ej. 0.21 = 21%)</span>
          <input
            name="ratePct"
            type="number"
            step="0.01"
            min={0}
            max={1}
            defaultValue={initial?.ratePct}
            required
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Descripción (requisitos legales, en texto claro)</span>
        <textarea
          name="description"
          defaultValue={initial?.description}
          required
          rows={2}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Fuente</span>
        <select
          name="sourceId"
          defaultValue={initial?.sourceId ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">Sin fuente citada</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="isActive" type="checkbox" defaultChecked={initial?.isActive ?? true} />
        Activa
      </label>

      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}

      <SubmitButton>{initial?.id ? "Guardar cambios" : "Crear tarifa"}</SubmitButton>
    </form>
  );
}
