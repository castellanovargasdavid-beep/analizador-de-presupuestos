"use client";

import { useActionState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import type { ActionResult } from "@/lib/professional/lead-actions";

const initialState: ActionResult = { ok: true };

/**
 * Envoltorio genérico para las acciones del portal de profesional que
 * necesitan mostrar un error de validación bajo el formulario (rechazar,
 * confirmar contacto, enviar presupuesto, pausar plazo). Las acciones sin
 * campos (aceptar, marcar resultado) usan directamente `action={fn.bind(null, leadId)}`
 * en un `<form>` simple, sin este envoltorio.
 */
export function ProfessionalActionForm({
  action,
  children,
  submitLabel,
  className = "space-y-3",
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
  submitLabel: string;
  className?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className={className}>
      {children}
      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}
      <Button type="submit" disabled={isPending} size="md">
        {isPending ? "Enviando…" : submitLabel}
      </Button>
    </form>
  );
}
