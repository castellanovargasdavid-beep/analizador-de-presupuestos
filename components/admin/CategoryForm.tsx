"use client";

import { useActionState } from "react";
import { saveCategoryAction, type ActionResult } from "@/lib/admin/catalog/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

export interface CategoryFormValues {
  id?: string;
  slug?: string;
  name?: string;
  description?: string | null;
  iconKey?: string | null;
  isActive?: boolean;
}

export function CategoryForm({ initial }: { initial?: CategoryFormValues }) {
  const [state, formAction] = useActionState(saveCategoryAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
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
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Descripción (opcional)</span>
        <textarea
          name="description"
          defaultValue={initial?.description ?? ""}
          rows={2}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">
          Icono (opcional: ac, trowel, paint, wrench, bolt, tree, key)
        </span>
        <input
          name="iconKey"
          defaultValue={initial?.iconKey ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="isActive" type="checkbox" defaultChecked={initial?.isActive ?? true} />
        Activa (visible en el sitio)
      </label>

      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}

      <SubmitButton>{initial?.id ? "Guardar cambios" : "Crear categoría"}</SubmitButton>
    </form>
  );
}
