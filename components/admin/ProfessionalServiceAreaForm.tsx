"use client";

import { useActionState } from "react";
import { addServiceAreaAction, type ActionResult } from "@/lib/admin/professionals/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

export function ProfessionalServiceAreaForm({
  professionalId,
  serviceTypes,
  regions,
}: {
  professionalId: string;
  serviceTypes: { id: string; name: string }[];
  regions: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(addServiceAreaAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="professionalId" value={professionalId} />
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Servicio</span>
        <select
          name="serviceTypeId"
          required
          className="mt-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          {serviceTypes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Región</span>
        <select
          name="regionId"
          defaultValue=""
          className="mt-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">Toda España</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <SubmitButton>Añadir zona</SubmitButton>
      {!state.ok && state.error && <p className="w-full text-sm text-critical-text">{state.error}</p>}
    </form>
  );
}
