"use client";

import { useActionState } from "react";
import { saveMaterialLevelAction, type ActionResult } from "@/lib/admin/catalog/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

export interface MaterialLevelFormValues {
  id?: string;
  slug?: string;
  name?: string;
  description?: string | null;
  sortOrder?: number;
}

export function MaterialLevelForm({ initial }: { initial?: MaterialLevelFormValues }) {
  const [state, formAction] = useActionState(saveMaterialLevelAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-3 sm:grid-cols-3">
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
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Orden</span>
          <input
            name="sortOrder"
            type="number"
            defaultValue={initial?.sortOrder ?? 0}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Descripción (opcional)</span>
        <textarea
          name="description"
          defaultValue={initial?.description ?? ""}
          rows={2}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}

      <SubmitButton>{initial?.id ? "Guardar cambios" : "Crear nivel"}</SubmitButton>
    </form>
  );
}
