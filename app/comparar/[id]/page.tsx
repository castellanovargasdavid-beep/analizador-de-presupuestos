import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge, type Tone } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { RangeBar } from "@/components/result/RangeBar";
import { Breakdown } from "@/components/result/Breakdown";
import { getUserBudgetForDisplay } from "@/lib/estimation/repository";
import { materialesSharePctFromRanges, posiblesRazonesFor, preguntasRecomendadasFor } from "@/lib/estimation/compare";
import { formatEUR, formatPct } from "@/lib/format";
import { AlertTriangleIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "¿Está tu presupuesto dentro de lo razonable?",
  robots: { index: false, follow: true },
};

const VERDICT_COPY: Record<string, { tone: Tone; titulo: string; explicacion: string }> = {
  dentro_de_rango: {
    tone: "good",
    titulo: "Dentro del rango estimado",
    explicacion: "Tu presupuesto está dentro de lo que consideramos razonable para estas características.",
  },
  por_encima: {
    tone: "warning",
    titulo: "Por encima del rango estimado",
    explicacion:
      "Esto no significa necesariamente que el presupuesto sea incorrecto. Puede existir una diferencia por " +
      "materiales, dificultad, garantías, desplazamiento u otros factores que esta calculadora no ve.",
  },
  por_debajo: {
    tone: "info",
    titulo: "Por debajo del rango estimado",
    explicacion:
      "No es necesariamente una ganga: conviene revisar que el presupuesto incluya todo el alcance esperado " +
      "(retirada de equipo, materiales, puesta en marcha, garantía).",
  },
};

export default async function CompararPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getUserBudgetForDisplay(id);

  if (!data) {
    notFound();
  }

  const { budget, budgetItems, estimate: estimateData } = data;
  const { estimate, items, ranges, methodologyVersion } = estimateData;
  const copy = VERDICT_COPY[budget.verdict];

  const potenciaKw = (estimate.inputs as { quantities?: { potenciaKw?: number } }).quantities?.potenciaKw;
  const riteSuperaUmbral = typeof potenciaKw === "number" && potenciaKw > 5;
  const materialesSharePctAlto = materialesSharePctFromRanges(ranges) > 0.4;
  const posiblesRazones = posiblesRazonesFor(budget.verdict);
  const preguntasRecomendadas = preguntasRecomendadasFor({ riteSuperaUmbral, materialesSharePctAlto });

  return (
    <Container className="max-w-3xl py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
        <Link href="/" className="hover:text-brand-700">
          Inicio
        </Link>{" "}
        /{" "}
        <Link href="/aire-acondicionado/instalacion" className="hover:text-brand-700">
          Instalación de aire acondicionado
        </Link>{" "}
        / Comparación
      </nav>

      <h1 className="mt-3 text-2xl font-bold text-neutral-950 sm:text-3xl">¿Es razonable tu presupuesto?</h1>

      <Card className="mt-6">
        <Badge tone={copy.tone}>{copy.titulo}</Badge>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-neutral-500">Estimación orientativa (IVA incluido)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-brand-800">
              {formatEUR(estimate.totalMin)} – {formatEUR(estimate.totalMax)}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-500">Tu presupuesto</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-950">{formatEUR(budget.total)}</p>
          </div>
        </div>

        <div className="mt-6">
          <RangeBar
            rangeMin={estimate.totalMin}
            rangeMax={estimate.totalMax}
            marker={{ value: budget.total, tone: copy.tone, label: "Tu presupuesto" }}
          />
        </div>

        {budget.verdict !== "dentro_de_rango" && (
          <p className="mt-6 text-neutral-700">
            Diferencia aproximada: <strong>{formatEUR(budget.deviationAbsolute)}</strong> ({formatPct(budget.deviationPct)}
            {budget.verdict === "por_encima" ? " por encima del máximo" : " por debajo del mínimo"} estimado).
          </p>
        )}
        <p className="mt-2 text-neutral-700">{copy.explicacion}</p>
      </Card>

      {posiblesRazones.length > 0 && (
        <Card className="mt-6">
          <h2 className="font-bold text-neutral-950">Posibles razones de la diferencia</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-neutral-700">
            {posiblesRazones.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Card>
      )}

      {budgetItems.length > 0 && (
        <Card className="mt-6">
          <h2 className="font-bold text-neutral-950">Partidas declaradas vs. esperadas</h2>
          <div className="mt-4 divide-y divide-neutral-100">
            {budgetItems.map((li) => (
              <div key={li.groupKey} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-medium text-neutral-950">{li.label}</p>
                  <p className="text-xs text-neutral-500">
                    Esperado: {formatEUR(li.expectedMin)} – {formatEUR(li.expectedMax)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-neutral-950">
                    {li.status === "no_declarado" ? "No indicado" : formatEUR(li.declaredAmount)}
                  </p>
                  {li.status === "por_encima" && <Badge tone="warning">Revisar esta partida</Badge>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <h2 className="font-bold text-neutral-950">Desglose de la estimación</h2>
        <p className="mt-1 text-sm text-neutral-500">Partidas consideradas para calcular tu rango.</p>
        <div className="mt-4">
          <Breakdown items={items} />
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="font-bold text-neutral-950">Preguntas que te pueden ayudar</h2>
        <ul className="mt-3 space-y-2">
          {preguntasRecomendadas.map((p) => (
            <li key={p} className="flex gap-2 text-neutral-700">
              <span className="text-brand-600">→</span>
              {p}
            </li>
          ))}
        </ul>
      </Card>

      {riteSuperaUmbral && (
        <Card className="mt-6 border-warning-bg bg-warning-bg/40">
          <div className="flex gap-3">
            <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-warning-text" />
            <p className="text-sm text-neutral-700">
              Tu instalación supera los 5 kW: el RITE exige memoria técnica y registro del certificado ante tu
              Comunidad Autónoma.
            </p>
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <h2 className="font-bold text-neutral-950">Siguiente paso</h2>
        <p className="mt-2 text-neutral-700">
          Nunca es buena idea decidir solo por el precio. Usa las preguntas de arriba con tu instalador antes de
          firmar.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <LinkButton href="/guias/como-comparar-presupuestos-de-instalacion" variant="secondary">
            Cómo comparar presupuestos
          </LinkButton>
          <LinkButton href="/aire-acondicionado/instalacion">Volver a la calculadora</LinkButton>
        </div>
      </Card>

      <p className="mt-8 text-center text-sm text-neutral-500">
        <Badge tone="neutral">Metodología {methodologyVersion}</Badge> — esto no es una tasación profesional ni una
        acusación hacia tu instalador.{" "}
        <Link href="/metodologia" className="font-semibold text-brand-700 hover:underline">
          Ver metodología completa
        </Link>
      </p>
    </Container>
  );
}
