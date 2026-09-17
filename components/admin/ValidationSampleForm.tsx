"use client";

import { useActionState } from "react";
import { saveValidationSampleAction, type ActionResult } from "@/lib/quality/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

export function ValidationSampleForm({
  serviceTypeId,
  regions,
}: {
  serviceTypeId: string;
  regions: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(saveValidationSampleAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="serviceTypeId" value={serviceTypeId} />
      <p className="text-xs text-neutral-500">
        Un presupuesto real cerrado, nunca un dato estimado o inventado — ver docs/PRICE-VALIDATION-PROTOCOL.md en
        el repositorio. Si viene de un lead cerrado en la plataforma, indica su id para poder comparar contra el
        rango que se calculó en su día.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Origen del dato</span>
          <select
            name="source"
            defaultValue="lead_cerrado"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="lead_cerrado">Lead cerrado en la plataforma</option>
            <option value="aportado_manualmente">Presupuesto real aportado manualmente</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Zona (opcional)</span>
          <select
            name="regionId"
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="">Sin zona específica</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Id del lead (si source = lead cerrado)</span>
          <input
            name="relatedLeadId"
            placeholder="uuid del lead"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 font-mono text-xs focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">
            Id de la Estimate a comparar (opcional, deja vacío si es un lead solo_solicitud)
          </span>
          <input
            name="relatedEstimateId"
            placeholder="uuid de la estimate"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 font-mono text-xs focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Precio final real (€, con IVA)</span>
          <input
            name="finalPriceWithVat"
            type="number"
            step="0.01"
            required
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Fecha real del presupuesto/trabajo</span>
          <input
            name="quoteDate"
            type="date"
            required
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="flex items-center gap-2 text-sm">
          <input name="includesVat" type="checkbox" defaultChecked />
          Incluye IVA
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="includesMaterials" type="checkbox" defaultChecked />
          Incluye materiales
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="requiredVisit" type="checkbox" />
          Requirió visita
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="hadUnexpectedIssues" type="checkbox" />
          Hubo imprevistos
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Características del proyecto (texto libre, sin datos personales)</span>
        <textarea
          name="projectCharacteristics"
          rows={2}
          placeholder="Ej. piso 2º sin ascensor, tubería empotrada, 8m² de baño..."
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Notas internas (opcional)</span>
        <textarea
          name="notes"
          rows={2}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}

      <SubmitButton>Registrar presupuesto real</SubmitButton>
    </form>
  );
}
