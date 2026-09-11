"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { StepIndicator } from "../ui/StepIndicator";
import { CheckboxRow, FieldLabel, NumberField, RadioCardGroup, TextField } from "../ui/FormControls";
import { analyzeBudget, calculateEstimation, estimatePotenciaKwFromSuperficie } from "@/lib/pricing/engine";
import { encodeState } from "@/lib/pricing/encode";
import type { CalculatorInput, DeclaredBudget, Gama, RetiradaEquipo, SystemType, ZonaPrecio } from "@/lib/pricing/types";
import { ArrowRightIcon } from "../ui/icons";

type Mode = "calculadora" | "analizador";

interface State {
  systemType: SystemType;
  potenciaKw: number;
  superficieAyuda: boolean;
  superficieM2: number;
  muchoVidrio: boolean;
  retiradaEquipo: RetiradaEquipo;
  metrosLineaFrigorificaExtra: number;
  instalacionElectricaDedicada: boolean;
  canaletaVistaMetros: number;
  necesitaBombaCondensados: boolean;
  accesoDificil: boolean;
  zona: ZonaPrecio;
  gama: Gama;
  quiereComparar: boolean;
  presupuestoTotal: number;
  presupuestoEquipo: number;
  presupuestoInstalacion: number;
  presupuestoMateriales: number;
}

const INITIAL: State = {
  systemType: "split-1x1",
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
  zona: "resto-espana",
  gama: "media",
  quiereComparar: false,
  presupuestoTotal: 0,
  presupuestoEquipo: 0,
  presupuestoInstalacion: 0,
  presupuestoMateriales: 0,
};

export function Wizard({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<State>(() =>
    mode === "analizador" ? { ...INITIAL, quiereComparar: true } : INITIAL,
  );

  const totalSteps = 6;
  const update = <K extends keyof State>(key: K, value: State[K]) => setState((s) => ({ ...s, [key]: value }));

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

  function finish() {
    const input: CalculatorInput = {
      systemType: state.systemType,
      gama: state.gama,
      potenciaKw: state.potenciaKw,
      metrosLineaFrigorificaExtra: state.metrosLineaFrigorificaExtra,
      retiradaEquipo: state.retiradaEquipo,
      instalacionElectricaDedicada: state.instalacionElectricaDedicada,
      canaletaVistaMetros: state.canaletaVistaMetros,
      necesitaBombaCondensados: state.necesitaBombaCondensados,
      accesoDificil: state.accesoDificil,
      zona: state.zona,
    };

    if (state.quiereComparar && state.presupuestoTotal > 0) {
      const declared: DeclaredBudget = {
        total: state.presupuestoTotal,
        equipo: state.presupuestoEquipo || undefined,
        instalacionManoObra: state.presupuestoInstalacion || undefined,
        materialesExtras: state.presupuestoMateriales || undefined,
      };
      // Se codifica el RESULTADO ya calculado (no el input crudo): así, si la
      // metodología cambia más adelante, un enlace ya compartido sigue
      // mostrando exactamente lo que se calculó en su momento.
      const result = analyzeBudget(input, declared);
      const id = encodeState(result);
      router.push(`/comparar/${id}`);
      return;
    }

    const result = calculateEstimation(input);
    const id = encodeState(result);
    router.push(`/resultado/${id}`);
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
        <div>
          <h2 className="text-xl font-bold text-neutral-950">Ubicación</h2>
          <p className="mt-1 text-sm text-neutral-600">
            La mano de obra puede variar algo según la zona, aunque la evidencia de la que disponemos es limitada.
          </p>
          <div className="mt-6">
            <RadioCardGroup
              name="zona"
              value={state.zona}
              onChange={(v) => update("zona", v)}
              options={[
                { value: "resto-espana", title: "Resto de España" },
                { value: "madrid-cataluna", title: "Madrid o Cataluña", description: "Ajuste orientativo, señal de mercado débil" },
              ]}
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="text-xl font-bold text-neutral-950">Calidad del equipo</h2>
          <p className="mt-1 text-sm text-neutral-600">Esto es lo que más hace variar el precio del equipo en sí.</p>
          <div className="mt-6">
            <RadioCardGroup
              name="gama"
              value={state.gama}
              onChange={(v) => update("gama", v)}
              options={[
                { value: "economica", title: "Económica", description: "Marca genérica, eficiencia básica" },
                { value: "media", title: "Media", description: "Buena relación calidad-precio, la más habitual" },
                { value: "premium", title: "Premium", description: "Alta eficiencia, marcas de gama alta, bajo ruido" },
              ]}
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
            <div className="mt-6 space-y-4">
              <div>
                <FieldLabel>Precio total del presupuesto que te han dado</FieldLabel>
                <TextField
                  value={state.presupuestoTotal ? String(state.presupuestoTotal) : ""}
                  onChange={(v) => update("presupuestoTotal", Number(v.replace(/[^0-9.]/g, "")) || 0)}
                  placeholder="Ej. 1200"
                  suffix="€"
                />
              </div>
              <p className="text-sm font-semibold text-neutral-700">Desglose (opcional, mejora la comparación)</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <FieldLabel>Equipo</FieldLabel>
                  <TextField
                    value={state.presupuestoEquipo ? String(state.presupuestoEquipo) : ""}
                    onChange={(v) => update("presupuestoEquipo", Number(v.replace(/[^0-9.]/g, "")) || 0)}
                    suffix="€"
                  />
                </div>
                <div>
                  <FieldLabel>Instalación / mano de obra</FieldLabel>
                  <TextField
                    value={state.presupuestoInstalacion ? String(state.presupuestoInstalacion) : ""}
                    onChange={(v) => update("presupuestoInstalacion", Number(v.replace(/[^0-9.]/g, "")) || 0)}
                    suffix="€"
                  />
                </div>
                <div>
                  <FieldLabel>Materiales / extras</FieldLabel>
                  <TextField
                    value={state.presupuestoMateriales ? String(state.presupuestoMateriales) : ""}
                    onChange={(v) => update("presupuestoMateriales", Number(v.replace(/[^0-9.]/g, "")) || 0)}
                    suffix="€"
                  />
                </div>
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
        </div>
      )}

      <div className="mt-8 flex justify-between border-t border-neutral-100 pt-6">
        <Button type="button" variant="ghost" onClick={goBack} disabled={step === 1}>
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
          <Button type="button" onClick={finish}>
            {state.quiereComparar ? "Comparar mi presupuesto" : "Ver mi estimación"} <ArrowRightIcon />
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
