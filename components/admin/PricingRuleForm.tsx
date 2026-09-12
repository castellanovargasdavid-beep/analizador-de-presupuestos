"use client";

import { useActionState } from "react";
import { savePricingRuleAction, type ActionResult } from "@/lib/admin/pricing/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

export function PricingRuleForm({
  initial,
  services,
}: {
  initial?: { id?: string; serviceTypeId?: string; version?: number; name?: string; isActive?: boolean };
  services: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(savePricingRuleAction, initialState);

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
          <span className="text-xs font-semibold text-neutral-600">Versión</span>
          <input
            name="version"
            type="number"
            min={1}
            defaultValue={initial?.version ?? 1}
            required
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Nombre</span>
          <input
            name="name"
            defaultValue={initial?.name}
            required
            placeholder="Instalación A/C v1"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input name="isActive" type="checkbox" defaultChecked={initial?.isActive ?? true} />
        Activa (la calculadora usa la versión activa más alta de cada servicio)
      </label>

      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}

      <SubmitButton>{initial?.id ? "Guardar cambios" : "Crear regla"}</SubmitButton>
    </form>
  );
}
