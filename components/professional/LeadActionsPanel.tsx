"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProfessionalActionForm } from "./ProfessionalActionForm";
import {
  acceptLeadAction,
  rejectLeadAction,
  confirmContactAction,
  startQuoteAction,
  submitQuoteAction,
  markOutcomeAction,
  pauseDeadlineAction,
  type ActionResult,
} from "@/lib/professional/lead-actions";
import type { LeadStatus } from "@/lib/leads/state-machine";

/** `useActionState` espera `(prevState, formData)`; las acciones del servidor toman `(leadId, formData)`. */
function withLeadId(
  action: (leadId: string, formData: FormData) => Promise<ActionResult>,
  leadId: string,
): (prevState: ActionResult, formData: FormData) => Promise<ActionResult> {
  return (_prevState: ActionResult, formData: FormData) => action(leadId, formData);
}

/**
 * Un `<form action={...}>` sin `useActionState` espera `(formData) => void
 * | Promise<void>` — para las acciones sin campos que mostrar (aceptar,
 * iniciar presupuesto) no necesitamos leer el resultado aquí, así que se
 * descarta.
 */
function fireLeadAction(action: (leadId: string) => Promise<ActionResult>, leadId: string) {
  return async (): Promise<void> => {
    await action(leadId);
  };
}

/** Igual que `fireLeadAction`, para acciones que sí toman `formData` pero cuyo resultado no se muestra inline. */
function fireLeadFormAction(action: (leadId: string, formData: FormData) => Promise<ActionResult>, leadId: string) {
  return async (formData: FormData): Promise<void> => {
    await action(leadId, formData);
  };
}

const inputClass = "mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none";

export function LeadActionsPanel({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const [showPause, setShowPause] = useState(false);

  const canAcceptReject = status === "asignado" || status === "notificado" || status === "visto";
  const canConfirmContact = status === "contacto_pendiente";
  const canStartQuote = status === "contacto_confirmado";
  const canSubmitQuote = status === "presupuesto_pendiente";
  const canMarkOutcomeFromContact = status === "contacto_confirmado";
  const canMarkOutcomeFromQuote = status === "presupuesto_enviado";
  const canPauseDeadline = ["contacto_pendiente", "presupuesto_pendiente"].includes(status);

  return (
    <div className="space-y-6">
      {canAcceptReject && (
        <Card>
          <h2 className="font-bold text-neutral-950">¿Aceptas esta solicitud?</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Si la aceptas, tendrás que contactar con el usuario antes del plazo indicado arriba.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <form action={fireLeadAction(acceptLeadAction, leadId)}>
              <Button type="submit">Aceptar</Button>
            </form>
            <Button type="button" variant="secondary" onClick={() => setShowPause((v) => !v)}>
              Rechazar
            </Button>
          </div>
          {showPause && (
            <div className="mt-4 border-t border-neutral-100 pt-4">
              <ProfessionalActionForm action={withLeadId(rejectLeadAction, leadId)} submitLabel="Confirmar rechazo">
                <label className="block">
                  <span className="text-sm font-medium text-neutral-800">Motivo del rechazo</span>
                  <textarea name="reason" required rows={2} className={inputClass} />
                </label>
              </ProfessionalActionForm>
            </div>
          )}
        </Card>
      )}

      {canConfirmContact && (
        <Card>
          <h2 className="font-bold text-neutral-950">Confirmar contacto con el usuario</h2>
          <ProfessionalActionForm action={withLeadId(confirmContactAction, leadId)} submitLabel="Confirmar contacto">
            <label className="block">
              <span className="text-sm font-medium text-neutral-800">¿Cómo contactaste? (opcional)</span>
              <input name="method" type="text" placeholder="Llamada, WhatsApp, email..." className={inputClass} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input name="requiresSiteVisit" type="checkbox" />
              Necesito hacer una visita antes de dar el presupuesto
            </label>
          </ProfessionalActionForm>
        </Card>
      )}

      {canStartQuote && (
        <Card>
          <h2 className="font-bold text-neutral-950">¿Vas a enviar un presupuesto?</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Si el trabajo ya está cerrado sin necesidad de un presupuesto formal, indícalo abajo directamente.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <form action={fireLeadAction(startQuoteAction, leadId)}>
              <Button type="submit">Voy a preparar un presupuesto</Button>
            </form>
          </div>
        </Card>
      )}

      {canSubmitQuote && (
        <Card>
          <h2 className="font-bold text-neutral-950">Enviar presupuesto</h2>
          <ProfessionalActionForm action={withLeadId(submitQuoteAction, leadId)} submitLabel="Enviar presupuesto">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-neutral-800">Importe (€)</span>
                <input name="amount" type="number" step="0.01" min="1" required className={inputClass} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-800">IVA (opcional, ej. 0.21)</span>
                <input name="vatPct" type="number" step="0.01" min="0" max="1" className={inputClass} />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-neutral-800">Duración estimada (días, opcional)</span>
                <input name="estimatedDurationDays" type="number" min="0" className={inputClass} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-800">Validez de la oferta (días, opcional)</span>
                <input name="validityDays" type="number" min="1" className={inputClass} />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-neutral-800">Condiciones (opcional)</span>
              <textarea name="conditions" rows={2} className={inputClass} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-neutral-800">Observaciones (opcional)</span>
              <textarea name="observations" rows={2} className={inputClass} />
            </label>
          </ProfessionalActionForm>
        </Card>
      )}

      {(canMarkOutcomeFromContact || canMarkOutcomeFromQuote) && (
        <Card>
          <h2 className="font-bold text-neutral-950">Registrar resultado</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <form action={fireLeadFormAction(markOutcomeAction, leadId)}>
              <input type="hidden" name="outcome" value="ganado" />
              <Button type="submit" variant="secondary">
                Trabajo contratado
              </Button>
            </form>
            <form action={fireLeadFormAction(markOutcomeAction, leadId)}>
              <input type="hidden" name="outcome" value="perdido" />
              <Button type="submit" variant="secondary">
                No se ha contratado
              </Button>
            </form>
            <form action={fireLeadFormAction(markOutcomeAction, leadId)}>
              <input type="hidden" name="outcome" value="cerrado" />
              <Button type="submit" variant="ghost">
                Cerrar sin más detalle
              </Button>
            </form>
          </div>
        </Card>
      )}

      {canPauseDeadline && (
        <Card>
          <h2 className="font-bold text-neutral-950">¿Necesitas más tiempo?</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Si dependes de una visita, del usuario o de un proveedor externo, puedes pausar el plazo con un motivo.
          </p>
          <ProfessionalActionForm action={withLeadId(pauseDeadlineAction, leadId)} submitLabel="Pausar plazo">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-neutral-800">Motivo</span>
                <input name="reason" type="text" required className={inputClass} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-800">Horas de pausa</span>
                <input name="hours" type="number" min="1" max="336" defaultValue={24} required className={inputClass} />
              </label>
            </div>
          </ProfessionalActionForm>
        </Card>
      )}
    </div>
  );
}
