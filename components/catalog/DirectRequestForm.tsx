"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircleIcon, ShieldIcon } from "@/components/ui/icons";
import { submitDirectLeadAction } from "@/lib/catalog/actions";
import { DIRECT_LEAD_CONSENT_TEXT } from "@/lib/catalog/validation";

type Status = "collapsed" | "open" | "sending" | "sent" | "error";

/**
 * Solicitud de presupuesto para un servicio sin calculadora todavía
 * (`solo_solicitud`): mismo patrón honesto que LeadRequestCard (colapsado
 * por defecto, mensaje de éxito sin prometer nada que no existe), pero sin
 * ningún rango de precio de por medio — no lo hay.
 */
export function DirectRequestForm({
  serviceTypeId,
  serviceName,
  regions,
}: {
  serviceTypeId: string;
  serviceName: string;
  regions: { slug: string; name: string }[];
}) {
  const [status, setStatus] = useState<Status>("collapsed");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const form = new FormData(e.currentTarget);
    const result = await submitDirectLeadAction(serviceTypeId, {
      regionSlug: form.get("regionSlug"),
      contactName: form.get("contactName"),
      contactEmail: form.get("contactEmail"),
      contactPhone: form.get("contactPhone"),
      description: form.get("description"),
      propertyType: form.get("propertyType"),
      urgency: form.get("urgency"),
      desiredTimeframe: form.get("desiredTimeframe"),
      currentState: form.get("currentState"),
      approxDimensions: form.get("approxDimensions"),
      userStatedBudget: form.get("userStatedBudget"),
      consentAccepted: form.get("consentAccepted") === "on",
      website: form.get("website"),
    });

    if (result.ok) {
      setStatus("sent");
    } else {
      setStatus("error");
      setError(result.error ?? "No se ha podido registrar la solicitud.");
    }
  }

  if (status === "sent") {
    return (
      <Card className="mt-4 border-good-bg bg-good-bg/40">
        <div className="flex gap-3">
          <CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-good-text" />
          <div>
            <h3 className="font-bold text-neutral-950">Solicitud registrada</h3>
            <p className="mt-2 text-sm text-neutral-700">
              Hemos guardado tu solicitud de &ldquo;{serviceName}&rdquo;. Todavía no tenemos calculadora para este
              servicio ni una red de profesionales verificados en tu zona: en cuanto la tengamos, te contactaremos.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (status === "collapsed") {
    return (
      <Button type="button" variant="secondary" onClick={() => setStatus("open")}>
        Pedir presupuesto sin calculadora
      </Button>
    );
  }

  return (
    <Card className="mt-4">
      <h3 className="font-bold text-neutral-950">Pedir presupuesto de &ldquo;{serviceName}&rdquo;</h3>
      <p className="mt-2 text-sm text-neutral-600">
        Todavía no tenemos suficientes datos para calcular un rango de precio fiable de este servicio, pero puedes
        pedir presupuesto directamente. Te pedimos solo lo necesario para que un profesional pueda contactarte.
      </p>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div aria-hidden="true" className="sr-only">
          <label>
            Sitio web (déjalo en blanco)
            <input name="website" type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-neutral-800">Teléfono (opcional)</span>
            <input
              name="contactPhone"
              type="tel"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-800">Zona (opcional)</span>
            <select
              name="regionSlug"
              defaultValue=""
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-950 focus:border-brand-500 focus:outline-none"
            >
              <option value="">Prefiero no indicarlo</option>
              {regions.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-neutral-800">Cuéntanos qué necesitas</span>
          <textarea
            name="description"
            required
            minLength={10}
            rows={4}
            placeholder="Describe el trabajo con el mayor detalle posible."
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>

        <details className="rounded-lg border border-neutral-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-neutral-700">
            Más detalles (opcional, pero ayuda al profesional a valorar el trabajo)
          </summary>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-neutral-800">Tipo de inmueble</span>
                <select
                  name="propertyType"
                  defaultValue=""
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-950 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">Prefiero no indicarlo</option>
                  <option value="piso">Piso</option>
                  <option value="casa">Casa</option>
                  <option value="local">Local</option>
                  <option value="otro">Otro</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-800">Urgencia</span>
                <select
                  name="urgency"
                  defaultValue=""
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-950 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">Prefiero no indicarlo</option>
                  <option value="normal">Normal</option>
                  <option value="urgente">Urgente</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-neutral-800">¿Para cuándo lo necesitas?</span>
                <input
                  name="desiredTimeframe"
                  type="text"
                  placeholder="Ej. Esta semana, sin prisa..."
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-800">Dimensiones aproximadas</span>
                <input
                  name="approxDimensions"
                  type="text"
                  placeholder="Ej. 15 m², 3 puertas, 8 metros lineales..."
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-neutral-800">Estado actual</span>
              <textarea
                name="currentState"
                rows={2}
                placeholder="Ej. No se puede usar, tiene una avería concreta, es una instalación nueva..."
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-neutral-800">¿Cuánto tienes pensado gastar? (€, opcional)</span>
              <input
                name="userStatedBudget"
                type="text"
                inputMode="decimal"
                placeholder="Ej. 300"
                className="mt-1 w-full max-w-[10rem] rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>

            <p className="text-xs text-neutral-500">
              Todavía no podemos recibir fotos de forma segura desde este formulario. Si crees que una foto ayudaría,
              descríbelo en el campo de arriba — el profesional puede pedírtela directamente al contactarte.
            </p>
          </div>
        </details>

        <label className="flex items-start gap-3">
          <input name="consentAccepted" type="checkbox" required className="mt-1" />
          <span className="text-sm text-neutral-600">{DIRECT_LEAD_CONSENT_TEXT}</span>
        </label>

        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <ShieldIcon className="size-4 shrink-0" />
          Solo profesionales que verifiquemos verán estos datos.
        </div>

        {status === "error" && <p className="text-sm text-critical-text">{error}</p>}

        <Button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Enviando…" : "Enviar solicitud"}
        </Button>
      </form>
    </Card>
  );
}
