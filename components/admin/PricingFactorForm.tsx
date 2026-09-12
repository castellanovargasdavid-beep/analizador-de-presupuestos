"use client";

import { useActionState } from "react";
import { savePricingFactorAction, type ActionResult } from "@/lib/admin/pricing/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

export interface PricingFactorFormValues {
  id?: string;
  key?: string;
  label?: string;
  kind?: string;
  groupKey?: string;
  perUnitOfQuantity?: string | null;
  valueMin?: number;
  valueMax?: number;
  condition?: unknown;
  sourceId?: string | null;
  confidence?: string;
  sortOrder?: number;
  isActive?: boolean;
  notes?: string | null;
}

export function PricingFactorForm({
  ruleId,
  initial,
  sources,
}: {
  ruleId: string;
  initial?: PricingFactorFormValues;
  sources: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(savePricingFactorAction, initialState);
  const conditionText = initial?.condition ? JSON.stringify(initial.condition) : "";

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="ruleId" value={ruleId} />
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Clave interna (key)</span>
          <input
            name="key"
            defaultValue={initial?.key}
            required
            placeholder="equipo_base"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Etiqueta (visible en el desglose)</span>
          <input
            name="label"
            defaultValue={initial?.label}
            required
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Tipo</span>
          <select
            name="kind"
            defaultValue={initial?.kind ?? "base"}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="base">Base (precio de partida)</option>
            <option value="multiplier">Multiplicador (%)</option>
            <option value="additive">Aditivo (suma un importe)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Grupo (desglose)</span>
          <input
            name="groupKey"
            defaultValue={initial?.groupKey}
            required
            placeholder="equipo / mano_obra / extras / ubicacion"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Por unidad de (opcional)</span>
          <input
            name="perUnitOfQuantity"
            defaultValue={initial?.perUnitOfQuantity ?? ""}
            placeholder="metrosLineaFrigorificaExtra"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Valor mínimo (€)</span>
          <input
            name="valueMin"
            type="number"
            step="0.01"
            defaultValue={initial?.valueMin}
            required
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Valor máximo (€)</span>
          <input
            name="valueMax"
            type="number"
            step="0.01"
            defaultValue={initial?.valueMax}
            required
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>
      <p className="text-xs text-neutral-500">
        Un factor <code>multiplier</code> se expresa como fracción: 1.08 = +8%. Un <code>base</code>/<code>additive</code> es un
        importe en euros.
      </p>

      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Condición (opcional, JSON — vacío = siempre se aplica)</span>
        <textarea
          name="conditionRaw"
          defaultValue={conditionText}
          rows={2}
          placeholder='{"field":"systemType","op":"eq","value":"conductos"}'
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 font-mono text-xs focus:border-brand-500 focus:outline-none"
        />
        <span className="mt-1 block text-xs text-neutral-500">
          Formas válidas: <code>{"{field,op:'eq',value}"}</code>, <code>{"{field,op:'in',values:[]}"}</code>,{" "}
          <code>{"{field,op:'gt'|'gte'|'lt'|'lte',value}"}</code>, <code>{"{field,op:'truthy'}"}</code>,{" "}
          <code>{"{all:[...]}"}</code>, <code>{"{any:[...]}"}</code>.
        </span>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
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
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Confianza</span>
          <select
            name="confidence"
            defaultValue={initial?.confidence ?? "B"}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Orden en el desglose</span>
          <input
            name="sortOrder"
            type="number"
            defaultValue={initial?.sortOrder ?? 0}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="mt-5 flex items-center gap-2 text-sm">
          <input name="isActive" type="checkbox" defaultChecked={initial?.isActive ?? true} />
          Activo
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Notas internas (opcional)</span>
        <textarea
          name="notes"
          defaultValue={initial?.notes ?? ""}
          rows={2}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}

      <SubmitButton>{initial?.id ? "Guardar cambios" : "Crear factor"}</SubmitButton>
    </form>
  );
}
