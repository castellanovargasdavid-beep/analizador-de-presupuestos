"use client";

import { useActionState } from "react";
import { saveGuideAction, type ActionResult } from "@/lib/admin/content/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

export interface GuideFormValues {
  id?: string;
  slug?: string;
  title?: string;
  summary?: string;
  metaDescription?: string;
  intro?: string;
  bodyText?: string;
  ctaHref?: string | null;
  ctaLabel?: string | null;
  relatedLinksText?: string;
  status?: string;
}

export function GuideForm({ initial }: { initial?: GuideFormValues }) {
  const [state, formAction] = useActionState(saveGuideAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Slug (URL: /guias/...)</span>
          <input
            name="slug"
            defaultValue={initial?.slug}
            required
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Título (H1)</span>
          <input
            name="title"
            defaultValue={initial?.title}
            required
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Resumen (para el índice /guias)</span>
        <input
          name="summary"
          defaultValue={initial?.summary}
          required
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Meta descripción (SEO, ≤160 caracteres)</span>
        <input
          name="metaDescription"
          defaultValue={initial?.metaDescription}
          required
          maxLength={160}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Introducción (primer párrafo, antes del cuerpo)</span>
        <textarea
          name="intro"
          defaultValue={initial?.intro}
          required
          rows={2}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Cuerpo</span>
        <textarea
          name="bodyText"
          defaultValue={initial?.bodyText}
          required
          rows={10}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 font-mono text-xs focus:border-brand-500 focus:outline-none"
        />
        <span className="mt-1 block text-xs text-neutral-500">
          Una línea = un párrafo. <code>## Texto</code> = encabezado de sección. Líneas <code>- Texto</code>{" "}
          consecutivas = una lista.
        </span>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">CTA — ruta (opcional)</span>
          <input
            name="ctaHref"
            defaultValue={initial?.ctaHref ?? ""}
            placeholder="/aire-acondicionado/instalacion"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">CTA — texto del botón (opcional)</span>
          <input
            name="ctaLabel"
            defaultValue={initial?.ctaLabel ?? ""}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Enlaces relacionados (uno por línea: ruta | etiqueta | descripción opcional)</span>
        <textarea
          name="relatedLinksText"
          defaultValue={initial?.relatedLinksText}
          rows={3}
          placeholder="/metodologia | Metodología"
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 font-mono text-xs focus:border-brand-500 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Estado</span>
        <select
          name="status"
          defaultValue={initial?.status ?? "borrador"}
          className="mt-1 w-full max-w-xs rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="borrador">Borrador (no visible)</option>
          <option value="publicado">Publicado</option>
          <option value="archivado">Archivado (ya no visible, se conserva)</option>
        </select>
      </label>

      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}

      <SubmitButton>{initial?.id ? "Guardar cambios" : "Crear guía"}</SubmitButton>
    </form>
  );
}
