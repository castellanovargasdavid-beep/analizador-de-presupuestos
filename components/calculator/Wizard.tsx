"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { StepIndicator } from "../ui/StepIndicator";
import { CheckboxRow, FieldLabel, NumberField, RadioCardGroup, TextField } from "../ui/FormControls";
import { estimatePotenciaKwFromSuperficie } from "@/lib/estimation/sizing";
import { calculateEstimateAction, compareBudgetAction } from "@/lib/estimation/actions";
import type { CalculatorFormValues, DeclaredBudgetLineValues } from "@/lib/estimation/validation";
import { ArrowRightIcon, AlertTriangleIcon } from "../ui/icons";
import { trackEvent } from "@/lib/analytics/track";

type Mode = "calculadora" | "analizador";

interface PartidaRow extends DeclaredBudgetLineValues {
  rowId: string;
}

const CATEGORIA_OPTIONS: { value: DeclaredBudgetLineValues["category"]; label: string }[] = [
  { value: "equipo", label: "Equipo" },
  { value: "mano_obra", label: "Mano de obra / instalación" },
  { value: "extras", label: "Materiales y extras" },
  { value: "otros", label: "Otros / no lo sé" },
];

function newPartida(): PartidaRow {
  return { rowId: Math.random().toString(36).slice(2), label: "", category: "equipo", amount: 0 };
}

export interface RegionOption {
  slug: string;
  name: string;
}

export interface MaterialLevelOption {
  slug: string;
  name: string;
  description: string | null;
}

interface State {
  systemType: CalculatorFormValues["systemType"];
  materialLevel: CalculatorFormValues["materialLevel"];
  potenciaKw: number;
  superficieAyuda: boolean;
  superficieM2: number;
  muchoVidrio: boolean;
  retiradaEquipo: CalculatorFormValues["retiradaEquipo"];
  metrosLineaFrigorificaExtra: number;
  instalacionElectricaDedicada: boolean;
  canaletaVistaMetros: number;
  necesitaBombaCondensados: boolean;
  accesoDificil: boolean;
  regionSlug: string | null;
  viviendaParticularMasDeDosAnos: boolean;
  quiereComparar: boolean;
  presupuestoTotal: number;
  descripcion: string;
  partidas: PartidaRow[];
}

const INITIAL: State = {
  systemType: "split-1x1",
  materialLevel: "media",
  potenciaKw: 3.5,
  superficieAyuda: false,
  superficieM2: 20,
  muchoVidrio: false,
  retiradaEquipo: "no",
  metrosLineaFrigorificaExtra: 0,
  instalacionElectricaDedicada: false,
  canaletaVistaMetros: 0,
  necesitaBombaCondensados: false,
  accesoDificil: false,
  regionSlug: null,
  viviendaParticularMasDeDosAnos: true,
  quiereComparar: false,
  presupuestoTotal: 0,
  descripcion: "",
  partidas: [],
};

export function Wizard({
  mode,
  regions,
  materialLevels,
}: {
  mode: Mode;
  regions: RegionOption[];
  materialLevels: MaterialLevelOption[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<State>(() =>
    mode === "analizador" ? { ...INITIAL, quiereComparar: true } : INITIAL,
  );

  const totalSteps = 6;
  const update = <K extends keyof State>(key: K, value: State[K]) => setState((s) => ({ ...s, [key]: value }));

  const finishedRef = useRef(false);
  const isFirstStepEffect = useRef(true);

  useEffect(() => {
    trackEvent({ eventType: "calculator_start", metadata: { mode } });
    // Solo una vez al montar el asistente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstStepEffect.current) {
      isFirstStepEffect.current = false;
      return;
    }
    trackEvent({ eventType: "calculator_step", metadata: { step, mode } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    function handleBeforeUnload() {
      if (!finishedRef.current) {
        trackEvent({ eventType: "wizard_abandoned", metadata: { step, mode } });
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [step, mode]);

  const potenciaSugerida = useMemo(
    () => estimatePotenciaKwFromSuperficie(state.superficieM2, state.muchoVidrio),
    [state.superficieM2, state.muchoVidrio],
  );

  function goNext() {
    setStep((s) => Math.min(totalSteps, s + 1));
  }
  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function finish() {
    setSubmitting(true);
    setError(null);

    const formValues: CalculatorFormValues = {
      systemType: state.systemType,
      materialLevel: state.materialLevel,
      potenciaKw: state.potenciaKw,
      retiradaEquipo: state.retiradaEquipo,
      metrosLineaFrigorificaExtra: state.metrosLineaFrigorificaExtra,
      canaletaVistaMetros: state.canaletaVistaMetros,
      necesitaBombaCondensados: state.necesitaBombaCondensados,
      instalacionElectricaDedicada: state.instalacionElectricaDedicada,
      accesoDificil: state.accesoDificil,
      regionSlug: state.regionSlug,
      clientePersonaFisicaUsoParticular: state.viviendaParticularMasDeDosAnos,
      viviendaMasDeDosAnos: state.viviendaParticularMasDeDosAnos,
    };

    if (state.quiereComparar && state.presupuestoTotal > 0) {
      const result = await compareBudgetAction(formValues, {
        total: state.presupuestoTotal,
        description: state.descripcion.trim() || undefined,
        lines: state.partidas
          .filter((p) => p.label.trim().length > 0)
          .map((p) => ({ label: p.label.trim(), category: p.category, amount: p.amount })),
      });
      if (!result.ok || !result.data) {
        setError(result.error ?? "No se ha podido comparar el presupuesto.");
        setSubmitting(false);
        return;
      }
      finishedRef.current = true;
      router.push(`/comparar/${result.data.comparisonId}`);
      return;
    }

    const result = await calculateEstimateAction(formValues);
    if (!result.ok || !result.data) {
      setError(result.error ?? "No se ha podido calcular la estimación.");
      setSubmitting(false);
      return;
    }
    finishedRef.current = true;
    router.push(`/resultado/${result.data.estimateId}`);
  }

  return (
    <Card>
      <StepIndicator step={step} total={totalSteps} label={stepLabel(step)} />

      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-neutral-950">¿Qué tipo de instalación necesitas?</h2>
          <p className="mt-1 text-sm text-neutral-600">Elige la opción que más se parezca a tu caso.</p>
          <div className="mt-6">
            <RadioCardGroup
              name="systemType"
              value={state.systemType}
              onChange={(v) => update("systemType", v)}
              options={[
                { value: "split-1x1", title: "Split, 1 unidad interior", description: "Una habitación o estancia" },
                { value: "split-2x1", title: "Multisplit, 2 unidades", description: "Dos estancias, un solo exterior" },
                { value: "split-3x1", title: "Multisplit, 3 unidades", description: "Tres estancias, un solo exterior" },
                { value: "conductos", title: "Por conductos", description: "Sistema centralizado, rejillas en techo" },
              ]}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-neutral-950">Características del trabajo</h2>

          <div>
            <FieldLabel hint="Si no lo sabes, puedes calcularlo a partir de los metros cuadrados.">
              Potencia del equipo (por unidad interior)
            </FieldLabel>
            <NumberField value={state.potenciaKw} onChange={(v) => update("potenciaKw", v)} min={1} max={12} step={0.1} suffix="kW" />
            <button
              type="button"
              onClick={() => update("superficieAyuda", !state.superficieAyuda)}
              className="mt-2 text-sm font-semibold text-brand-700 hover:underline"
            >
              {state.superficieAyuda ? "Ocultar ayuda" : "No sé la potencia, ayúdame"}
            </button>
            {state.superficieAyuda && (
              <div className="mt-3 rounded-lg bg-neutral-50 p-4">
                <FieldLabel>Superficie de la estancia</FieldLabel>
                <NumberField value={state.superficieM2} onChange={(v) => update("superficieM2", v)} min={5} max={150} suffix="m²" />
                <div className="mt-3">
                  <CheckboxRow
                    checked={state.muchoVidrio}
                    onChange={(v) => update("muchoVidrio", v)}
                    label="Mucha superficie acristalada u orientación sur"
                  />
                </div>
                <p className="mt-3 text-sm text-neutral-600">
                  Con estos datos, una referencia orientativa de sector sería de <strong>{potenciaSugerida} kW</strong>.
                  Es una heurística ampliamente usada, no un cálculo normativo: si tienes el dato real del fabricante,
                  úsalo mejor.
                </p>
                <Button
                  type="button"
                  size="md"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => update("potenciaKw", potenciaSugerida)}
                >
                  Usar {potenciaSugerida} kW
                </Button>
              </div>
            )}
          </div>

          <div>
            <FieldLabel>¿Tienes un equipo antiguo que retirar?</FieldLabel>
            <RadioCardGroup
              name="retirada"
              value={state.retiradaEquipo}
              onChange={(v) => update("retiradaEquipo", v)}
              options={[
                { value: "no", title: "No, es una instalación nueva" },
                { value: "desechar", title: "Sí, para desechar" },
                { value: "reutilizar", title: "Sí, para reutilizar en otro sitio" },
              ]}
            />
          </div>

          <div>
            <FieldLabel hint="La instalación estándar suele incluir hasta 3 metros.">
              Metros adicionales de línea frigorífica
            </FieldLabel>
            <NumberField
              value={state.metrosLineaFrigorificaExtra}
              onChange={(v) => update("metrosLineaFrigorificaExtra", v)}
              max={30}
              suffix="metros extra"
            />
          </div>

          <details className="rounded-lg border border-neutral-200 p-4">
            <summary className="cursor-pointer font-semibold text-neutral-950">
              ¿Aplica alguna de estas situaciones? (opcional)
            </summary>
            <div className="mt-4 space-y-3">
              <CheckboxRow
                checked={state.instalacionElectricaDedicada}
                onChange={(v) => update("instalacionElectricaDedicada", v)}
                label="Necesito un circuito eléctrico dedicado nuevo"
              />
              <CheckboxRow
                checked={state.necesitaBombaCondensados}
                onChange={(v) => update("necesitaBombaCondensados", v)}
                label="No hay salida de desagüe por gravedad (necesito bomba de condensados)"
              />
              <CheckboxRow
                checked={state.accesoDificil}
                onChange={(v) => update("accesoDificil", v)}
                label="La unidad exterior tiene un acceso difícil (altura, fachada sin acceso interior)"
              />
              <div>
                <FieldLabel hint="Deja en 0 si no necesitas ocultar tubos con canaleta.">
                  Metros de canaleta vista
                </FieldLabel>
                <NumberField value={state.canaletaVistaMetros} onChange={(v) => update("canaletaVistaMetros", v)} max={20} suffix="metros" />
              </div>
            </div>
          </details>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-neutral-950">Ubicación</h2>
            <p className="mt-1 text-sm text-neutral-600">
              La mano de obra puede variar algo según la zona, aunque la evidencia de la que disponemos es limitada
              (solo hay señal para Madrid y Cataluña).
            </p>
            <select
              value={state.regionSlug ?? ""}
              onChange={(e) => update("regionSlug", e.target.value || null)}
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
            <FieldLabel hint="Determina si tu instalación podría beneficiarse del IVA reducido del 10% en la mano de obra (art. 91.Uno.2.10º Ley 37/1992). Si el equipo supera el 40% del presupuesto, no aplica igualmente.">
              ¿Es tu vivienda habitual, de uso particular, y tiene más de 2 años?
            </FieldLabel>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => update("viviendaParticularMasDeDosAnos", true)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold ${state.viviendaParticularMasDeDosAnos ? "border-brand-600 bg-brand-50 text-brand-800" : "border-neutral-200 text-neutral-600"}`}
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => update("viviendaParticularMasDeDosAnos", false)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold ${!state.viviendaParticularMasDeDosAnos ? "border-brand-600 bg-brand-50 text-brand-800" : "border-neutral-200 text-neutral-600"}`}
              >
                No / no lo sé
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="text-xl font-bold text-neutral-950">Calidad del equipo</h2>
          <p className="mt-1 text-sm text-neutral-600">Esto es lo que más hace variar el precio del equipo en sí.</p>
          <div className="mt-6">
            <RadioCardGroup
              name="materialLevel"
              value={state.materialLevel}
              onChange={(v) => update("materialLevel", v)}
              options={materialLevels.map((m) => ({ value: m.slug as State["materialLevel"], title: m.name, description: m.description ?? undefined }))}
            />
          </div>
        </div>
      )}

      {step === 5 && (
        <div>
          <h2 className="text-xl font-bold text-neutral-950">
            {mode === "analizador" ? "Introduce tu presupuesto" : "¿Ya tienes un presupuesto?"}
          </h2>
          {mode === "calculadora" && (
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => update("quiereComparar", false)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold ${!state.quiereComparar ? "border-brand-600 bg-brand-50 text-brand-800" : "border-neutral-200 text-neutral-600"}`}
              >
                No, solo quiero la estimación
              </button>
              <button
                type="button"
                onClick={() => update("quiereComparar", true)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold ${state.quiereComparar ? "border-brand-600 bg-brand-50 text-brand-800" : "border-neutral-200 text-neutral-600"}`}
              >
                Sí, quiero compararlo
              </button>
            </div>
          )}

          {state.quiereComparar && (
            <div className="mt-6 space-y-6">
              <div>
                <FieldLabel>Precio total del presupuesto que te han dado</FieldLabel>
                <TextField
                  value={state.presupuestoTotal ? String(state.presupuestoTotal) : ""}
                  onChange={(v) => update("presupuestoTotal", Number(v.replace(/[^0-9.]/g, "")) || 0)}
                  placeholder="Ej. 1200"
                  suffix="€"
                />
              </div>

              <div>
                <FieldLabel hint="Pega el texto del presupuesto o descríbelo con tus palabras. Opcional, pero ayuda a interpretar el resto.">
                  Descripción del presupuesto
                </FieldLabel>
                <textarea
                  value={state.descripcion}
                  onChange={(e) => update("descripcion", e.target.value)}
                  rows={3}
                  placeholder='Ej. "Instalación split Mitsubishi 3000 fg, incluye retirada del equipo antiguo..."'
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-neutral-950 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <FieldLabel hint="Añade las partidas tal como aparecen en el presupuesto. Cuantas más indiques, mejor podremos comparar.">
                  Partidas principales (opcional, mejora la comparación)
                </FieldLabel>
                <div className="space-y-3">
                  {state.partidas.map((partida) => (
                    <div key={partida.rowId} className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        value={partida.label}
                        onChange={(e) =>
                          update(
                            "partidas",
                            state.partidas.map((p) => (p.rowId === partida.rowId ? { ...p, label: e.target.value } : p)),
                          )
                        }
                        placeholder="Ej. Unidad interior + exterior"
                        className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-950 focus:border-brand-500 focus:outline-none"
                      />
                      <select
                        value={partida.category}
                        onChange={(e) =>
                          update(
                            "partidas",
                            state.partidas.map((p) =>
                              p.rowId === partida.rowId
                                ? { ...p, category: e.target.value as DeclaredBudgetLineValues["category"] }
                                : p,
                            ),
                          )
                        }
                        className="rounded-lg border border-neutral-200 px-2 py-2 text-sm text-neutral-950 focus:border-brand-500 focus:outline-none"
                      >
                        {CATEGORIA_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={partida.amount ? String(partida.amount) : ""}
                        onChange={(e) =>
                          update(
                            "partidas",
                            state.partidas.map((p) =>
                              p.rowId === partida.rowId
                                ? { ...p, amount: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0 }
                                : p,
                            ),
                          )
                        }
                        placeholder="€"
                        className="w-24 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-950 focus:border-brand-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => update("partidas", state.partidas.filter((p) => p.rowId !== partida.rowId))}
                        className="text-sm font-semibold text-critical-text hover:underline"
                        aria-label="Eliminar partida"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => update("partidas", [...state.partidas, newPartida()])}
                  className="mt-3 text-sm font-semibold text-brand-700 hover:underline"
                >
                  + Añadir partida
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 6 && (
        <div>
          <h2 className="text-xl font-bold text-neutral-950">Todo listo</h2>
          <p className="mt-2 text-neutral-700">
            Hemos recogido las características de tu instalación
            {state.quiereComparar ? " y el presupuesto que has recibido" : ""}. Pulsa el botón para ver tu resultado.
          </p>
          {error && (
            <div className="mt-4 flex gap-2 rounded-lg bg-critical-bg p-3 text-sm text-critical-text">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-between border-t border-neutral-100 pt-6">
        <Button type="button" variant="ghost" onClick={goBack} disabled={step === 1 || submitting}>
          Atrás
        </Button>
        {step < totalSteps ? (
          <Button
            type="button"
            onClick={goNext}
            disabled={step === 5 && state.quiereComparar && state.presupuestoTotal <= 0}
          >
            Siguiente <ArrowRightIcon />
          </Button>
        ) : (
          <Button type="button" onClick={finish} disabled={submitting}>
            {submitting ? "Calculando…" : state.quiereComparar ? "Comparar mi presupuesto" : "Ver mi estimación"}
            {!submitting && <ArrowRightIcon />}
          </Button>
        )}
      </div>
    </Card>
  );
}

function stepLabel(step: number): string {
  switch (step) {
    case 1:
      return "Tipo de trabajo";
    case 2:
      return "Características";
    case 3:
      return "Ubicación";
    case 4:
      return "Calidad";
    case 5:
      return "Presupuesto recibido";
    default:
      return "Resultado";
  }
}
