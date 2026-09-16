import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge, type Tone } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { RangeBar } from "@/components/result/RangeBar";
import { Breakdown } from "@/components/result/Breakdown";
import { ShareActions } from "@/components/result/ShareActions";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { LeadRequestCard } from "@/components/leads/LeadRequestCard";
import { ImpossibleResultNotice } from "@/components/result/ImpossibleResultNotice";
import { TrackOnMount } from "@/components/analytics/TrackOnMount";
import { getComparisonForDisplay } from "@/lib/estimation/repository";
import { detectAlertSignals, materialesSharePctFromRanges, posiblesRazonesFor, preguntasRecomendadasFor } from "@/lib/estimation/compare";
import { buildComparisonSummaryText } from "@/lib/estimation/summary";
import { isPlausibleRange } from "@/lib/estimation/sanity";
import { formatEUR, formatPct } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";
import { AlertTriangleIcon } from "@/components/ui/icons";
import { pageMetadata } from "@/lib/metadata";

/**
 * Enlaza cada pregunta recomendada (texto fijo generado por
 * `preguntasRecomendadasFor`, ver lib/estimation/compare.ts) con su
 * respuesta completa en /preguntas cuando existe una — no todas las
 * preguntas recomendadas tienen hoy una página propia, así que las que no
 * están en este mapa se siguen mostrando como texto plano.
 */
const PREGUNTA_HREF: Record<string, string> = {
  "¿El precio incluye la retirada y reciclaje del equipo antiguo?":
    "/preguntas/cuanto-cuesta-retirar-aire-acondicionado-antiguo",
  "Esta instalación supera 5 kW: ¿el presupuesto incluye la memoria técnica y el registro ante la Comunidad Autónoma?":
    "/preguntas/necesito-certificado-rite-aire-acondicionado",
  "El equipo representa más del 40% del presupuesto: si compras el equipo por separado y solo contratas la instalación, el IVA de la mano de obra podría reducirse al 10%. Pregúntalo.":
    "/preguntas/iva-10-o-21-instalacion-aire-acondicionado",
};

const VERDICT_DESCRIPTION: Record<string, string> = {
  dentro_de_rango: "Este presupuesto está dentro del rango orientativo calculado para esta instalación de aire acondicionado.",
  por_encima: "Este presupuesto está por encima del rango orientativo calculado, con posibles razones y preguntas recomendadas.",
  por_debajo: "Este presupuesto está por debajo del rango orientativo calculado: conviene revisar qué incluye exactamente.",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getComparisonForDisplay(id);
  const description = data ? VERDICT_DESCRIPTION[data.budgets[0].budget.verdict] : undefined;

  return pageMetadata({
    title: "¿Está tu presupuesto dentro de lo razonable?",
    description,
    path: `/comparar/${id}`,
    robots: { index: false, follow: true },
  });
}

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
      "Esto no significa necesariamente que el presupuesto sea incorrecto. Puede existir una diferencia razonable " +
      "por materiales, dificultad, garantías, desplazamiento u otros factores que esta calculadora no ve.",
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
  const data = await getComparisonForDisplay(id);

  if (!data) {
    notFound();
  }

  // El MVP siempre tiene un único presupuesto por comparación; el modelo de
  // datos ya admite varios (`data.budgets`) para cuando se construya
  // "compara 3 presupuestos" — este `[0]` es el único punto que cambiaría.
  const { budget, lines, items: budgetItems } = data.budgets[0];
  const { estimate, items, ranges, methodologyVersion } = data.estimate;

  if (!isPlausibleRange(estimate.totalMin, estimate.totalMax)) {
    return (
      <Container className="max-w-3xl py-12">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/" },
            { label: "Instalación de aire acondicionado", href: "/aire-acondicionado/instalacion" },
            { label: "Comparación" },
          ]}
        />
        <h1 className="mt-3 text-2xl font-bold text-neutral-950 sm:text-3xl">¿Es razonable tu presupuesto?</h1>
        <ImpossibleResultNotice />
      </Container>
    );
  }

  const copy = VERDICT_COPY[budget.verdict];

  const potenciaKw = (estimate.inputs as { quantities?: { potenciaKw?: number } }).quantities?.potenciaKw;
  const riteSuperaUmbral = typeof potenciaKw === "number" && potenciaKw > 5;
  const materialesSharePctAlto = materialesSharePctFromRanges(ranges) > 0.4;
  const posiblesRazones = posiblesRazonesFor(budget.verdict);
  const preguntasRecomendadas = preguntasRecomendadasFor({ riteSuperaUmbral, materialesSharePctAlto });
  const partidasAusentes = budgetItems.filter((i) => i.status === "no_declarado").map((i) => i.label);
  const senalesDeAlerta = detectAlertSignals({
    total: budget.total,
    lines: lines.map((l) => ({ label: l.label, category: l.category, amount: l.amount })),
  });

  const summaryText = buildComparisonSummaryText({
    totalRange: { min: estimate.totalMin, max: estimate.totalMax },
    declaredTotal: budget.total,
    verdict: budget.verdict,
    deviationAbsolute: budget.deviationAbsolute,
    deviationPct: budget.deviationPct,
    lineVerdicts: budgetItems.map((i) => ({
      groupKey: i.groupKey,
      label: i.label,
      declared: i.status === "no_declarado" ? null : i.declaredAmount,
      expectedMin: i.expectedMin,
      expectedMax: i.expectedMax,
      status: i.status,
    })),
    partidasAusentes,
    senalesDeAlerta,
    posiblesRazones,
    preguntasRecomendadas,
    url: absoluteUrl(`/comparar/${id}`),
  });

  return (
    <Container className="max-w-3xl py-12">
      <TrackOnMount eventType="comparison_result_view" estimateId={estimate.id} comparisonId={id} />
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Instalación de aire acondicionado", href: "/aire-acondicionado/instalacion" },
          { label: "Comparación" },
        ]}
      />

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-950 sm:text-3xl">¿Es razonable tu presupuesto?</h1>
      </div>
      <div className="mt-4">
        <ShareActions summaryText={summaryText} fileName="resumen-presupuesto-aire-acondicionado.txt" />
      </div>

      <Card className="mt-6">
        <Badge tone={copy.tone}>{copy.titulo}</Badge>

        {budget.description && (
          <p className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">&ldquo;{budget.description}&rdquo;</p>
        )}

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

      {senalesDeAlerta.length > 0 && (
        <Card className="mt-6 border-warning-bg bg-warning-bg/40">
          <div className="flex gap-3">
            <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-warning-text" />
            <div>
              <h2 className="font-bold text-neutral-950">Señales a revisar</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                {senalesDeAlerta.map((s) => (
                  <li key={s.key}>{s.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

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

      {lines.length > 0 && (
        <Card className="mt-6">
          <h2 className="font-bold text-neutral-950">Partidas que has indicado</h2>
          <div className="mt-4 divide-y divide-neutral-100">
            {lines.map((line) => (
              <div key={line.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                <span className="text-neutral-950">{line.label}</span>
                <span className="font-semibold text-neutral-950">{formatEUR(line.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

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
        {partidasAusentes.length > 0 && (
          <p className="mt-4 text-sm text-neutral-500">
            No has indicado ninguna partida de: {partidasAusentes.join(", ")}. Puede que el presupuesto la incluya
            igualmente, solo que no la has desglosado aquí.
          </p>
        )}
      </Card>

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
          {preguntasRecomendadas.map((p) => {
            const href = PREGUNTA_HREF[p];
            return (
              <li key={p} className="flex gap-2 text-neutral-700">
                <span className="text-brand-600">→</span>
                {href ? (
                  <Link href={href} className="underline decoration-dotted underline-offset-2 hover:text-brand-700">
                    {p}
                  </Link>
                ) : (
                  p
                )}
              </li>
            );
          })}
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

      <Card className="mt-6 print:hidden">
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

      <LeadRequestCard
        estimateId={estimate.id}
        comparisonId={id}
        rangeLabel={`${formatEUR(estimate.totalMin)} – ${formatEUR(estimate.totalMax)}`}
      />

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
