"use client";

import { useActionState } from "react";
import { saveCatalogProfessionAction, type ActionResult } from "@/lib/admin/catalog/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

export interface CatalogProfessionFormValues {
  id?: string;
  categoryId?: string;
  slug?: string;
  name?: string;
  description?: string | null;
  iconKey?: string | null;
  status?: string;
  sortOrder?: number;
}

/**
 * Profesión del catálogo público (categoría → profesión → servicio) — no
 * confundir con "Profesionales" (Negocio), que son las personas reales
 * que se asignan a un lead.
 */
export function CatalogProfessionForm({
  initial,
  categories,
}: {
  initial?: CatalogProfessionFormValues;
  categories: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(saveCatalogProfessionAction, initialState);

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
        <span className="text-xs font-semibold text-neutral-600">
          Descripción (texto real para la página pública, no relleno genérico)
        </span>
        <textarea
          name="description"
          defaultValue={initial?.description ?? ""}
          rows={3}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Icono (opcional)</span>
          <input
            name="iconKey"
            defaultValue={initial?.iconKey ?? ""}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Estado</span>
          <select
            name="status"
            defaultValue={initial?.status ?? "borrador"}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="borrador">Borrador (no se publica)</option>
            <option value="publicado">Publicado</option>
            <option value="archivado">Archivado</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Orden</span>
          <input
            name="sortOrder"
            type="number"
            defaultValue={initial?.sortOrder ?? 0}
            min={0}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>

      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}

      <SubmitButton>{initial?.id ? "Guardar cambios" : "Crear profesión"}</SubmitButton>
    </form>
  );
}
