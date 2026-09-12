"use client";

import { useActionState } from "react";
import { saveDataSourceAction, type ActionResult } from "@/lib/admin/pricing/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

export interface DataSourceFormValues {
  id?: string;
  name?: string;
  url?: string | null;
  sourceType?: string;
  confidence?: string;
  geographicScope?: string;
  publishedOn?: string | null;
  retrievedOn?: string;
  notes?: string;
  isActive?: boolean;
}

export function DataSourceForm({ initial }: { initial?: DataSourceFormValues }) {
  const [state, formAction] = useActionState(saveDataSourceAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
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
        <span className="text-xs font-semibold text-neutral-600">URL (opcional)</span>
        <input
          name="url"
          type="url"
          defaultValue={initial?.url ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Tipo</span>
          <select
            name="sourceType"
            defaultValue={initial?.sourceType ?? "mercado"}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="oficial">Normativa/organismo oficial</option>
            <option value="catalogo_real">Catálogo real de mercado</option>
            <option value="mercado">Agregador de mercado</option>
            <option value="heuristica_propia">Heurística propia</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Confianza</span>
          <select
            name="confidence"
            defaultValue={initial?.confidence ?? "B"}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="A">A — fuente verificable</option>
            <option value="B">B — mercado sin metodología pública</option>
            <option value="C">C — heurística propia</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Ámbito geográfico</span>
        <input
          name="geographicScope"
          defaultValue={initial?.geographicScope}
          required
          placeholder="España (nacional) / Madrid y Cataluña / ..."
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Publicada el (opcional, AAAA-MM-DD)</span>
          <input
            name="publishedOn"
            defaultValue={initial?.publishedOn ?? ""}
            placeholder="2026-01-15"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Verificada por nosotros el (AAAA-MM-DD)</span>
          <input
            name="retrievedOn"
            defaultValue={initial?.retrievedOn}
            required
            placeholder="2026-09-12"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Notas (qué dice exactamente esta fuente)</span>
        <textarea
          name="notes"
          defaultValue={initial?.notes}
          required
          rows={3}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="isActive" type="checkbox" defaultChecked={initial?.isActive ?? true} />
        Activa (se puede citar en un factor nuevo)
      </label>

      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}

      <SubmitButton>{initial?.id ? "Guardar cambios" : "Crear fuente"}</SubmitButton>
    </form>
  );
}
