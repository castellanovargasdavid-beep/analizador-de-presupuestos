"use client";

import { useState, type FormEvent } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { CheckCircleIcon, ShieldIcon } from "../ui/icons";
import { submitLeadAction } from "@/lib/leads/actions";
import { LEAD_CONSENT_TEXT } from "@/lib/leads/validation";
import { getEntryPath, getSessionId, trackEvent } from "@/lib/analytics/track";

interface LeadRequestCardProps {
  estimateId: string;
  comparisonId?: string;
}

type Status = "collapsed" | "open" | "sending" | "sent" | "error";

/**
 * CTA de lead, colapsado por defecto: solo se convierte en formulario si el
 * usuario decide pedirlo, y solo aparece una vez en la página (nunca varias
 * copias del mismo CTA — eso sería "bombardear con CTAs").
 *
 * El mensaje tras enviar es deliberadamente honesto: no prometemos "3
 * presupuestos en 24h" ni matches instantáneos que hoy no existen, porque
 * `professionals` está vacía hasta que haya una red real verificada.
 */
export function LeadRequestCard({ estimateId, comparisonId }: LeadRequestCardProps) {
  const [status, setStatus] = useState<Status>("collapsed");
  const [error, setError] = useState<string | null>(null);

  function openForm() {
    setStatus("open");
    trackEvent({ eventType: "lead_form_opened", estimateId, comparisonId });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const form = new FormData(e.currentTarget);
    const result = await submitLeadAction(
      {
        estimateId,
        comparisonId,
        sessionId: getSessionId(),
        entryPath: getEntryPath(),
        path: window.location.pathname,
      },
      {
        contactName: form.get("contactName"),
        contactEmail: form.get("contactEmail"),
        contactPhone: form.get("contactPhone"),
        description: form.get("description"),
        consentAccepted: form.get("consentAccepted") === "on",
      },
    );

    if (result.ok) {
      setStatus("sent");
    } else {
      setStatus("error");
      setError(result.error ?? "No se ha podido registrar la solicitud.");
    }
  }

  if (status === "sent") {
    return (
      <Card className="mt-6 border-good-bg bg-good-bg/40">
        <div className="flex gap-3">
          <CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-good-text" />
          <div>
            <h2 className="font-bold text-neutral-950">Solicitud registrada</h2>
            <p className="mt-2 text-sm text-neutral-700">
              Hemos guardado tu solicitud junto a este resultado. Todavía estamos construyendo la red de
              profesionales verificados en tu zona: en cuanto tengamos cobertura real, te contactaremos por email o
              teléfono. No inventamos presupuestos ni contactos que no existen.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (status === "collapsed") {
    return (
      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-neutral-950">¿Quieres presupuestos de profesionales verificados?</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Solo si te interesa. No es obligatorio para ver tu resultado.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={openForm}>
            Solicitar presupuestos
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <h2 className="font-bold text-neutral-950">Solicitar presupuestos</h2>
      <p className="mt-2 text-sm text-neutral-600">
        Te pedimos estos datos porque son los que un profesional necesita para poder darte un presupuesto real:
        cómo contactarte, y opcionalmente qué trabajo quieres hacer con más detalle.
      </p>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-neutral-800">Nombre</span>
            <input
              name="contactName"
              type="text"
              required
              minLength={2}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-800">Email</span>
            <input
              name="contactEmail"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-neutral-800">Teléfono (opcional)</span>
          <input
            name="contactPhone"
            type="tel"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-neutral-800">Detalles adicionales (opcional)</span>
          <textarea
            name="description"
            rows={3}
            maxLength={2000}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>

        <label className="flex items-start gap-3">
          <input name="consentAccepted" type="checkbox" required className="mt-1" />
          <span className="text-sm text-neutral-600">{LEAD_CONSENT_TEXT}</span>
        </label>

        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <ShieldIcon className="size-4 shrink-0" />
          Solo profesionales que verifiquemos verán estos datos. Nunca los vendemos a terceros sin tu consentimiento.
        </div>

        {status === "error" && <p className="text-sm text-critical-text">{error}</p>}

        <Button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Enviando…" : "Enviar solicitud"}
        </Button>
      </form>
    </Card>
  );
}
