"use client";

import { useActionState } from "react";
import { saveQuestionAction, type ActionResult } from "@/lib/admin/content/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

export interface QuestionFormValues {
  id?: string;
  slug?: string;
  question?: string;
  shortAnswer?: string;
  detailText?: string;
  relatedLinksText?: string;
  status?: string;
}

export function QuestionForm({ initial }: { initial?: QuestionFormValues }) {
  const [state, formAction] = useActionState(saveQuestionAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Slug (URL: /preguntas/...)</span>
        <input
          name="slug"
          defaultValue={initial?.slug}
          required
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Pregunta (H1)</span>
        <input
          name="question"
          defaultValue={initial?.question}
          required
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Respuesta corta (primero, sin rodeos)</span>
        <textarea
          name="shortAnswer"
          defaultValue={initial?.shortAnswer}
          required
          rows={2}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Detalle (un párrafo por línea)</span>
        <textarea
          name="detailText"
          defaultValue={initial?.detailText}
          required
          rows={6}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Enlaces relacionados (uno por línea: ruta | etiqueta)</span>
        <textarea
          name="relatedLinksText"
          defaultValue={initial?.relatedLinksText}
          rows={2}
          placeholder="/aire-acondicionado/instalacion | Calcular mi instalación"
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

      <SubmitButton>{initial?.id ? "Guardar cambios" : "Crear pregunta"}</SubmitButton>
    </form>
  );
}
