"use client";

import { useActionState } from "react";
import { notifyMeAction, type ActionResult } from "@/lib/catalog/actions";
import { Button } from "@/components/ui/Button";
import { CheckCircleIcon } from "@/components/ui/icons";

const initialState: ActionResult = { ok: true };

/**
 * Formulario mínimo de interés para un servicio en estado "próximamente":
 * solo email. No es un lead, no se comparte con ningún profesional — solo
 * sirve para medir si de verdad hay demanda antes de construir la
 * calculadora (ver docs/ADDING-NEW-SERVICE.md).
 */
export function NotifyMeForm({ serviceTypeId }: { serviceTypeId: string }) {
  const [state, formAction] = useActionState(notifyMeAction, initialState);

  if (state.ok && state !== initialState) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-good-text">
        <CheckCircleIcon className="size-4" />
        Te avisaremos cuando esté disponible.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-start gap-2">
      <input type="hidden" name="serviceTypeId" value={serviceTypeId} />
      <div aria-hidden="true" className="sr-only">
        <label>
          Sitio web (déjalo en blanco)
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input
        name="email"
        type="email"
        required
        placeholder="tu@email.com"
        className="w-56 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      />
      <Button type="submit" variant="secondary" size="md">
        Avísame
      </Button>
      {!state.ok && state.error && <p className="w-full text-sm text-critical-text">{state.error}</p>}
    </form>
  );
}
