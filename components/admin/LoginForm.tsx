"use client";

import { useActionState } from "react";
import { loginAction, type LoginResult } from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";

const initialState: LoginResult = { ok: true };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-neutral-800">Contraseña</span>
        <input
          name="password"
          type="password"
          required
          autoFocus
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
