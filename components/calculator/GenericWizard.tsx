"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { StepIndicator } from "../ui/StepIndicator";
import { CheckboxRow, FieldLabel, NumberField, RadioCardGroup, ToggleButtonGroup } from "../ui/FormControls";
import { calculateGenericEstimateAction } from "@/lib/estimation/generic/actions";
import type { CalculatorConfig } from "@/lib/estimation/generic/calculator-configs";
import { ArrowRightIcon, AlertTriangleIcon, InfoIcon } from "../ui/icons";
import { trackEvent } from "@/lib/analytics/track";
import type { ErrorKind } from "@/lib/errors/safe-message";
import type { RegionOption } from "./Wizard";

type FieldValues = Record<string, string | number | boolean>;

function initialValues(config: CalculatorConfig): FieldValues {
  const values: FieldValues = {};
  for (const field of config.fields) {
    if (field.kind === "select") values[field.key] = field.options[0]?.value ?? "";
    else if (field.kind === "quantity") values[field.key] = field.defaultValue;
    else values[field.key] = false;
  }
  return values;
}

export function GenericWizard({ config, regions }: { config: CalculatorConfig; regions: RegionOption[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<FieldValues>(() => initialValues(config));
  const [regionSlug, setRegionSlug] = useState<string | null>(null);
  const [viviendaParticularMasDeDosAnos, setViviendaParticularMasDeDosAnos] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind | undefined>(undefined);

  const totalSteps = 2;
  const finishedRef = useRef(false);

  useEffect(() => {
    trackEvent({ eventType: "calculator_start", metadata: { mode: "calculadora", service: config.serviceSlug } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleBeforeUnload() {
      if (!finishedRef.current) {
        trackEvent({ eventType: "wizard_abandoned", metadata: { step, service: config.serviceSlug } });
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [step, config.serviceSlug]);

  function update(key: string, value: string | number | boolean) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function finish() {
    setSubmitting(true);
    setError(null);
    setErrorKind(undefined);

    const selections: Record<string, string> = {};
    const quantities: Record<string, number> = {};
    const flags: Record<string, boolean> = {};
    for (const field of config.fields) {
      const value = values[field.key];
      if (field.kind === "select") selections[field.key] = String(value);
      else if (field.kind === "quantity") quantities[field.key] = Number(value);
      else flags[field.key] = Boolean(value);
    }

    const result = await calculateGenericEstimateAction({
      categorySlug: config.categorySlug,
      serviceSlug: config.serviceSlug,
      selections,
      quantities,
      flags,
      regionSlug,
      clientePersonaFisicaUsoParticular: viviendaParticularMasDeDosAnos,
      viviendaMasDeDosAnos: viviendaParticularMasDeDosAnos,
    });

    if (!result.ok || !result.data) {
      setError(result.error ?? "No se ha podido calcular la estimación.");
      setErrorKind(result.errorKind);
      setSubmitting(false);
      return;
    }
    finishedRef.current = true;
    router.push(`/resultado/${result.data.estimateId}`);
  }

  return (
    <Card>
      <StepIndicator step={step} total={totalSteps} label={step === 1 ? "Características" : "Ubicación"} />

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-neutral-950">Características del trabajo</h2>
            <p className="mt-1 text-sm text-neutral-600">{config.intro}</p>
          </div>

          {config.fields.map((field) => {
            if (field.kind === "select") {
              return (
                <div key={field.key}>
                  <FieldLabel hint={field.hint}>{field.label}</FieldLabel>
                  <RadioCardGroup
                    name={field.key}
                    value={String(values[field.key])}
                    onChange={(v) => update(field.key, v)}
                    options={field.options.map((o) => ({ value: o.value, title: o.title, description: o.description }))}
                  />
                </div>
              );
            }
            if (field.kind === "quantity") {
              return (
                <div key={field.key}>
                  <FieldLabel hint={field.hint}>{field.label}</FieldLabel>
                  <NumberField
                    value={Number(values[field.key])}
                    onChange={(v) => update(field.key, v)}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    suffix={field.suffix}
                  />
                </div>
              );
            }
            return (
              <CheckboxRow
                key={field.key}
                checked={Boolean(values[field.key])}
                onChange={(v) => update(field.key, v)}
                label={field.label}
                hint={field.hint}
              />
            );
          })}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-neutral-950">Ubicación</h2>
            <p className="mt-1 text-sm text-neutral-600">
              No tenemos evidencia de que la mano de obra varíe de forma fiable por zona para este servicio, pero
              puedes indicarla igualmente.
            </p>
            <select
              value={regionSlug ?? ""}
              onChange={(e) => setRegionSlug(e.target.value || null)}
              className="mt-4 w-full max-w-sm rounded-lg border border-neutral-200 px-3 py-2.5 text-neutral-950 focus:border-brand-500 focus:outline-none"
            >
              <option value="">Prefiero no indicarlo</option>
              {regions.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel hint="Determina si tu trabajo podría beneficiarse del IVA reducido del 10% en la mano de obra (art. 91.Uno.2.10º Ley 37/1992).">
              ¿Es tu vivienda habitual, de uso particular, y tiene más de 2 años?
            </FieldLabel>
            <ToggleButtonGroup
              name="viviendaParticular"
              value={viviendaParticularMasDeDosAnos ? "si" : "no"}
              onChange={(v) => setViviendaParticularMasDeDosAnos(v === "si")}
              options={[
                { value: "si", label: "Sí" },
                { value: "no", label: "No / no lo sé" },
              ]}
            />
          </div>

          {error && <ErrorNotice kind={errorKind} message={error} />}
        </div>
      )}

      <div className="mt-8 flex justify-between border-t border-neutral-100 pt-6">
        <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || submitting}>
          Atrás
        </Button>
        {step < totalSteps ? (
          <Button type="button" onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}>
            Siguiente <ArrowRightIcon />
          </Button>
        ) : (
          <Button type="button" onClick={finish} disabled={submitting}>
            {submitting ? "Calculando…" : "Ver mi estimación"}
            {!submitting && <ArrowRightIcon />}
          </Button>
        )}
      </div>
    </Card>
  );
}

const ERROR_NOTICE_COPY: Record<Exclude<ErrorKind, "validation"> | "default", { title: string; tone: "warning" | "info" }> = {
  missing_data: { title: "No tenemos datos suficientes para tu caso exacto", tone: "info" },
  unavailable: { title: "Servicio no disponible ahora mismo", tone: "warning" },
  unknown: { title: "No hemos podido completar esto", tone: "warning" },
  default: { title: "Revisa el formulario", tone: "warning" },
};

function ErrorNotice({ kind, message }: { kind: ErrorKind | undefined; message: string }) {
  const copy = kind && kind !== "validation" ? ERROR_NOTICE_COPY[kind] : ERROR_NOTICE_COPY.default;
  const isInfo = copy.tone === "info";
  const Icon = isInfo ? InfoIcon : AlertTriangleIcon;
  return (
    <div className={`mt-4 flex gap-2 rounded-lg p-3 text-sm ${isInfo ? "bg-info-bg text-info-text" : "bg-warning-bg text-warning-text"}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-semibold">{copy.title}</p>
        <p className="mt-0.5">{message}</p>
      </div>
    </div>
  );
}
