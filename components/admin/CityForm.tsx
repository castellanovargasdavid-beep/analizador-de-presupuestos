"use client";

import { useActionState } from "react";
import { saveCityAction, type ActionResult } from "@/lib/admin/geo/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

export function CityForm({
  initial,
  provinces,
}: {
  initial?: { id?: string; provinceId?: string; slug?: string; name?: string };
  provinces: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(saveCityAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Provincia</span>
        <select
          name="provinceId"
          defaultValue={initial?.provinceId}
          required
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">Elige una provincia</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Slug</span>
          <input
            name="slug"
            defaultValue={initial?.slug}
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
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>
      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}
      <SubmitButton>{initial?.id ? "Guardar cambios" : "Crear ciudad"}</SubmitButton>
    </form>
  );
}
