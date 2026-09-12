"use client";

import { useActionState } from "react";
import { saveServiceAction, type ActionResult } from "@/lib/admin/catalog/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

export interface ServiceFormValues {
  id?: string;
  categoryId?: string;
  slug?: string;
  name?: string;
  description?: string | null;
  unitLabel?: string | null;
  vatReducedEligible?: boolean;
  isActive?: boolean;
}

export function ServiceForm({
  initial,
  categories,
}: {
  initial?: ServiceFormValues;
  categories: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(saveServiceAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Categoría</span>
        <select
          name="categoryId"
          defaultValue={initial?.categoryId}
          required
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">Elige una categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
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
          Etiqueta de unidad (opcional, ej. &ldquo;metros de línea adicionales&rdquo;)
        </span>
        <input
          name="unitLabel"
          defaultValue={initial?.unitLabel ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="vatReducedEligible" type="checkbox" defaultChecked={initial?.vatReducedEligible ?? true} />
        Puede optar al IVA reducido (obra en vivienda particular)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="isActive" type="checkbox" defaultChecked={initial?.isActive ?? true} />
        Activo (visible en el sitio)
      </label>

      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}

      <SubmitButton>{initial?.id ? "Guardar cambios" : "Crear servicio"}</SubmitButton>
    </form>
  );
}
