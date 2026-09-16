"use client";

import { useActionState } from "react";
import {
  adminReassignLeadAction,
  adminPauseDeadlineAction,
  adminResumeDeadlineAction,
  type ActionResult,
} from "@/lib/admin/leads/lifecycle-actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none";

export function AdminReassignForm({ leadId }: { leadId: string }) {
  const [state, formAction] = useActionState(adminReassignLeadAction, initialState);
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Motivo de la reasignación manual</span>
        <textarea name="reason" required minLength={10} rows={2} className={inputClass} />
      </label>
      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}
      <SubmitButton>Reasignar a otro profesional</SubmitButton>
    </form>
  );
}

export function AdminPauseForm({ leadId }: { leadId: string }) {
  const [state, formAction] = useActionState(adminPauseDeadlineAction, initialState);
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Motivo</span>
          <input name="reason" type="text" required className={inputClass} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Horas de pausa</span>
          <input name="hours" type="number" min={1} max={720} defaultValue={24} required className={inputClass} />
        </label>
      </div>
      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}
      <SubmitButton>Pausar plazo</SubmitButton>
    </form>
  );
}

export function AdminResumeForm({ leadId }: { leadId: string }) {
  const [state, formAction] = useActionState(adminResumeDeadlineAction, initialState);
  return (
    <form action={formAction}>
      <input type="hidden" name="leadId" value={leadId} />
      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}
      <SubmitButton>Levantar pausa ahora</SubmitButton>
    </form>
  );
}
