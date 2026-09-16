"use client";

import { useActionState } from "react";
import { saveProfessionalAction, type ActionResult } from "@/lib/admin/professionals/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionResult = { ok: true };

export function ProfessionalForm({
  initial,
}: {
  initial?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string | null;
    verificationStatus?: string;
    isActive?: boolean;
    notes?: string | null;
    maxConcurrentLeads?: number;
    hasPassword?: boolean;
    pausedUntil?: Date | null;
    pauseReason?: string | null;
  };
}) {
  const [state, formAction] = useActionState(saveProfessionalAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Nombre</span>
          <input
            name="name"
            defaultValue={initial?.name}
            required
            minLength={2}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Email</span>
          <input
            name="email"
            type="email"
            defaultValue={initial?.email}
            required
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Teléfono (opcional)</span>
        <input
          name="phone"
          type="tel"
          defaultValue={initial?.phone ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Verificación</span>
          <select
            name="verificationStatus"
            defaultValue={initial?.verificationStatus ?? "pendiente"}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="pendiente">Pendiente</option>
            <option value="verificado">Verificado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </label>
        <label className="mt-6 flex items-center gap-2">
          <input name="isActive" type="checkbox" defaultChecked={initial?.isActive ?? false} className="size-4" />
          <span className="text-sm font-medium text-neutral-800">
            Activo (puede recibir leads asignados)
          </span>
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Notas internas (opcional)</span>
        <textarea
          name="notes"
          defaultValue={initial?.notes ?? ""}
          rows={3}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Capacidad máxima (leads activos a la vez)</span>
          <input
            name="maxConcurrentLeads"
            type="number"
            min={1}
            max={100}
            defaultValue={initial?.maxConcurrentLeads ?? 5}
            required
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">
            {initial?.hasPassword ? "Restablecer contraseña del portal" : "Fijar contraseña del portal (sin ella no puede entrar)"}
          </span>
          <input
            name="newPassword"
            type="password"
            minLength={8}
            placeholder={initial?.hasPassword ? "Dejar en blanco para no cambiarla" : "Mínimo 8 caracteres"}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>

      <div className="rounded-lg border border-neutral-200 p-3">
        <p className="text-xs font-semibold text-neutral-600">Pausa manual</p>
        {initial?.pausedUntil && initial.pausedUntil > new Date() ? (
          <p className="mt-1 text-sm text-neutral-700">
            Pausado hasta {initial.pausedUntil.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
            {initial.pauseReason ? ` — ${initial.pauseReason}` : ""}
          </p>
        ) : (
          <p className="mt-1 text-sm text-neutral-500">No está pausado actualmente.</p>
        )}
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-neutral-600">Pausar desde ahora (horas, 0 = no tocar)</span>
            <input
              name="pauseHours"
              type="number"
              min={0}
              max={8760}
              defaultValue={0}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-neutral-600">Motivo de la pausa (si aplica)</span>
            <input
              name="pauseReason"
              type="text"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
        </div>
        <label className="mt-2 flex items-center gap-2">
          <input name="resumeNow" type="checkbox" className="size-4" />
          <span className="text-sm font-medium text-neutral-800">Levantar la pausa ahora</span>
        </label>
      </div>

      {!state.ok && state.error && <p className="text-sm text-critical-text">{state.error}</p>}

      <SubmitButton>{initial?.id ? "Guardar cambios" : "Crear profesional"}</SubmitButton>
    </form>
  );
}
