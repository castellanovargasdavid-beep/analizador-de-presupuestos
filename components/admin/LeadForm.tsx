"use client";

import { useActionState } from "react";
import { updateLeadAction, type ActionResult } from "@/lib/admin/leads/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

const STATUS_OPTIONS = [
  { value: "nuevo", label: "Nuevo" },
  { value: "en_revision", label: "En revisión" },
  { value: "contactado", label: "Contactado" },
  { value: "sin_cobertura", label: "Sin cobertura" },
  { value: "cerrado", label: "Cerrado" },
];

export function LeadForm({
  id,
  status,
  assignedProfessionalId,
  professionals,
}: {
  id: string;
  status: string;
  assignedProfessionalId: string | null;
  professionals: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(updateLeadAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Estado</span>
        <select
          name="status"
          defaultValue={status}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Profesional asignado</span>
        <select
          name="assignedProfessionalId"
          defaultValue={assignedProfessionalId ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">Sin asignar</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {professionals.length === 0 && (
          <span className="mt-1 block text-xs text-neutral-500">
            Todavía no hay ningún profesional verificado en la red.
          </span>
        )}
      </label>

      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}

      <SubmitButton>Guardar cambios</SubmitButton>
    </form>
  );
}
