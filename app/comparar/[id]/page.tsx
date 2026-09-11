import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge, type Tone } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { RangeBar } from "@/components/result/RangeBar";
import { Breakdown } from "@/components/result/Breakdown";
import { decodeState } from "@/lib/pricing/encode";
import { formatEUR, formatPct } from "@/lib/format";
import type { ComparisonResult, Verdict } from "@/lib/pricing/types";
import { AlertTriangleIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "¿Está tu presupuesto dentro de lo razonable?",
  robots: { index: false, follow: true },
};

const VERDICT_COPY: Record<Verdict, { tone: Tone; titulo: string; explicacion: string }> = {
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
  const result = decodeState<ComparisonResult>(id);

  if (!result) {
    notFound();
  }

  const copy = VERDICT_COPY[result.verdict];

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
            <p className="text-sm font-semibold text-neutral-500">Estimación orientativa</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-brand-800">
              {formatEUR(result.estimation.totalRange.min)} – {formatEUR(result.estimation.totalRange.max)}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-500">Tu presupuesto</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-950">{formatEUR(result.declared.total)}</p>
          </div>
        </div>

        <div className="mt-6">
          <RangeBar
            rangeMin={result.estimation.totalRange.min}
            rangeMax={result.estimation.totalRange.max}
            marker={{ value: result.declared.total, tone: copy.tone, label: "Tu presupuesto" }}
          />
        </div>

        {result.verdict !== "dentro_de_rango" && (
          <p className="mt-6 text-neutral-700">
            Diferencia aproximada: <strong>{formatEUR(result.desviacionAbsoluta)}</strong> ({formatPct(result.desviacionPct)}
            {result.verdict === "por_encima" ? " por encima del máximo" : " por debajo del mínimo"} estimado).
          </p>
        )}
        <p className="mt-2 text-neutral-700">{copy.explicacion}</p>
      </Card>

      {result.posiblesRazones.length > 0 && (
        <Card className="mt-6">
          <h2 className="font-bold text-neutral-950">Posibles razones de la diferencia</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-neutral-700">
            {result.posiblesRazones.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mt-6">
        <h2 className="font-bold text-neutral-950">Desglose de la estimación</h2>
        <p className="mt-1 text-sm text-neutral-500">Partidas consideradas para calcular tu rango.</p>
        <div className="mt-4">
          <Breakdown lineItems={result.estimation.lineItems} />
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="font-bold text-neutral-950">Preguntas que te pueden ayudar</h2>
        <ul className="mt-3 space-y-2">
          {result.preguntasRecomendadas.map((p) => (
            <li key={p} className="flex gap-2 text-neutral-700">
              <span className="text-brand-600">→</span>
              {p}
            </li>
          ))}
        </ul>
      </Card>

      {result.estimation.advertencias.length > 0 && (
        <Card className="mt-6 border-warning-bg bg-warning-bg/40">
          <div className="flex gap-3">
            <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-warning-text" />
            <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
              {result.estimation.advertencias.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
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
        <Badge tone="neutral">Metodología {result.estimation.methodologyVersion}</Badge> — esto no es una tasación
        profesional ni una acusación hacia tu instalador.{" "}
        <Link href="/metodologia" className="font-semibold text-brand-700 hover:underline">
          Ver metodología completa
        </Link>
      </p>
    </Container>
  );
}
