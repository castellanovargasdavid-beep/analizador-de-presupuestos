"use client";

import { useActionState, useState } from "react";
import { updateLeadAction, type ActionResult } from "@/lib/admin/leads/actions";
import { LEAD_STATUS_OPTIONS, LEAD_PAYMENT_STATUS_OPTIONS } from "@/lib/admin/leads/validation";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

const STATUS_LABEL: Record<string, string> = {
  nuevo: "Nuevo",
  validado: "Validado",
  descartado: "Descartado",
  asignado: "Asignado",
  enviado: "Enviado al profesional",
  contactado: "Contactado",
  sin_cobertura: "Sin cobertura",
  cerrado: "Cerrado",
  con_incidencia: "Con incidencia",
};

const PAYMENT_LABEL: Record<string, string> = {
  no_aplica: "No aplica",
  pendiente: "Pendiente de cobro",
  pagado: "Pagado",
};

export function LeadForm({
  id,
  status,
  assignedProfessionalId,
  discardReason,
  contactOutcome,
  agreedPrice,
  paymentStatus,
  paymentAmount,
  incidentNotes,
  professionals,
}: {
  id: string;
  status: string;
  assignedProfessionalId: string | null;
  discardReason: string | null;
  contactOutcome: string | null;
  agreedPrice: number | null;
  paymentStatus: string;
  paymentAmount: number | null;
  incidentNotes: string | null;
  professionals: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(updateLeadAction, initialState);
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [selectedPayment, setSelectedPayment] = useState(paymentStatus);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={id} />

      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Estado</span>
        <select
          name="status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          {LEAD_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>

      {selectedStatus === "descartado" && (
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Motivo del descarte</span>
          <textarea
            name="discardReason"
            defaultValue={discardReason ?? ""}
            rows={2}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      )}

      {selectedStatus === "con_incidencia" && (
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Descripción de la incidencia</span>
          <textarea
            name="incidentNotes"
            defaultValue={incidentNotes ?? ""}
            rows={2}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      )}

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

      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Resultado del contacto (libre)</span>
        <textarea
          name="contactOutcome"
          defaultValue={contactOutcome ?? ""}
          rows={2}
          placeholder="Ej. Interesado, pendiente de visita técnica"
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Precio acordado (€, opcional)</span>
        <input
          name="agreedPrice"
          type="text"
          inputMode="decimal"
          defaultValue={agreedPrice ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Cobro al profesional</span>
        <select
          name="paymentStatus"
          value={selectedPayment}
          onChange={(e) => setSelectedPayment(e.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          {LEAD_PAYMENT_STATUS_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {PAYMENT_LABEL[p]}
            </option>
          ))}
        </select>
      </label>

      {selectedPayment !== "no_aplica" && (
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Importe cobrado (€)</span>
          <input
            name="paymentAmount"
            type="text"
            inputMode="decimal"
            defaultValue={paymentAmount ?? ""}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      )}

      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}

      <SubmitButton>Guardar cambios</SubmitButton>
    </form>
  );
}
