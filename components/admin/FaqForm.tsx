"use client";

import { useActionState } from "react";
import { saveFaqAction, type ActionResult } from "@/lib/admin/content/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

const KNOWN_PAGE_KEYS = [
  "home",
  "precios-aire-acondicionado-instalacion",
  "comparativas-split-vs-conductos",
  "aire-acondicionado-instalacion",
  "analizar-presupuesto",
];

export interface FaqFormValues {
  id?: string;
  pageKey?: string;
  question?: string;
  answer?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export function FaqForm({ initial }: { initial?: FaqFormValues }) {
  const [state, formAction] = useActionState(saveFaqAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Página (page key)</span>
        <input
          name="pageKey"
          defaultValue={initial?.pageKey}
          required
          list="faq-page-keys"
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
        <datalist id="faq-page-keys">
          {KNOWN_PAGE_KEYS.map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>
        <span className="mt-1 block text-xs text-neutral-500">
          Una página nueva necesita que un desarrollador añada la llamada a <code>listFaqsForPage()</code> en su
          código antes de que estas FAQs aparezcan ahí.
        </span>
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Pregunta</span>
        <input
          name="question"
          defaultValue={initial?.question}
          required
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Respuesta</span>
        <textarea
          name="answer"
          defaultValue={initial?.answer}
          required
          rows={3}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Orden</span>
          <input
            name="sortOrder"
            type="number"
            defaultValue={initial?.sortOrder ?? 0}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="mt-5 flex items-center gap-2 text-sm">
          <input name="isActive" type="checkbox" defaultChecked={initial?.isActive ?? true} />
          Activa
        </label>
      </div>

      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}

      <SubmitButton>{initial?.id ? "Guardar cambios" : "Crear FAQ"}</SubmitButton>
    </form>
  );
}
