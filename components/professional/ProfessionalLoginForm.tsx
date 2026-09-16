"use client";

import { useActionState } from "react";
import { professionalLoginAction, type LoginResult } from "@/lib/professional/actions";
import { Button } from "@/components/ui/Button";

const initialState: LoginResult = { ok: true };

export function ProfessionalLoginForm() {
  const [state, formAction, isPending] = useActionState(professionalLoginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-neutral-800">Email</span>
        <input
          name="email"
          type="email"
          required
          autoFocus
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-neutral-800">Contraseña</span>
        <input
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-full justify-center">
        {isPending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
