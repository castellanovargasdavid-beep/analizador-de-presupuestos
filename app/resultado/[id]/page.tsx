import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { RangeBar } from "@/components/result/RangeBar";
import { Breakdown } from "@/components/result/Breakdown";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { LeadRequestCard } from "@/components/leads/LeadRequestCard";
import { TrackOnMount } from "@/components/analytics/TrackOnMount";
import { getEstimateForDisplay } from "@/lib/estimation/repository";
import { formatEUR } from "@/lib/format";
import { AlertTriangleIcon, InfoIcon } from "@/components/ui/icons";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getEstimateForDisplay(id);
  const description = data
    ? `Rango orientativo: ${formatEUR(data.estimate.totalMin)} – ${formatEUR(data.estimate.totalMax)} para esta instalación de aire acondicionado, con desglose por partidas y fuentes.`
    : undefined;

  return pageMetadata({
    title: "Tu estimación orientativa",
    description,
    path: `/resultado/${id}`,
    robots: { index: false, follow: true },
  });
}

export default async function ResultadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getEstimateForDisplay(id);

  if (!data) {
    notFound();
  }

  const { estimate, items, ranges, methodologyVersion } = data;
  const ivaRange = ranges.find((r) => r.groupKey === "iva");
  const rite = estimate.inputs as { quantities?: { potenciaKw?: number } };
  const superaRite = typeof rite.quantities?.potenciaKw === "number" && rite.quantities.potenciaKw > 5;

  return (
    <Container className="max-w-3xl py-12">
      <TrackOnMount eventType="estimate_result_view" estimateId={estimate.id} />
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Instalación de aire acondicionado", href: "/aire-acondicionado/instalacion" },
          { label: "Resultado" },
        ]}
      />

      <h1 className="mt-3 text-2xl font-bold text-neutral-950 sm:text-3xl">Tu estimación orientativa</h1>

      <Card className="mt-6">
        <p className="text-sm font-semibold text-neutral-500">Estimación orientativa (IVA incluido)</p>
        <p className="mt-1 text-4xl font-bold tabular-nums text-brand-800">
          {formatEUR(estimate.totalMin)} – {formatEUR(estimate.totalMax)}
        </p>
        <div className="mt-6">
          <RangeBar rangeMin={estimate.totalMin} rangeMax={estimate.totalMax} />
        </div>
        {ivaRange && (
          <p className="mt-4 text-sm text-neutral-500">
            Incluye IVA al {Math.round(estimate.vatRatePct * 100)}% ({formatEUR(ivaRange.min)} – {formatEUR(ivaRange.max)}
            ).
          </p>
        )}
      </Card>

      {superaRite && (
        <div className="mt-6 flex gap-3 rounded-xl bg-info-bg p-4">
          <InfoIcon className="mt-0.5 size-5 shrink-0 text-info-text" />
          <p className="text-sm text-info-text">
            Tu instalación supera los 5 kW: el RITE exige memoria técnica y registro del certificado ante tu
            Comunidad Autónoma. Pregunta a tu instalador si este trámite está incluido en el presupuesto.
          </p>
        </div>
      )}

      <Card className="mt-6">
        <h2 className="font-bold text-neutral-950">Desglose por partidas</h2>
        <p className="mt-1 text-sm text-neutral-500">
          La letra indica la fiabilidad del dato: <strong>A</strong> fuente verificable, <strong>B</strong> mercado
          sin metodología pública, <strong>C</strong> heurística propia.
        </p>
        <div className="mt-4">
          <Breakdown items={items} />
        </div>
      </Card>

      <Card className="mt-6 border-warning-bg bg-warning-bg/40">
        <div className="flex gap-3">
          <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-warning-text" />
          <div>
            <h2 className="font-bold text-neutral-950">Sobre el IVA aplicado</h2>
            <p className="mt-2 text-sm text-neutral-700">
              Se ha aplicado el tipo{" "}
              <strong>{estimate.vatScenario === "general" ? "general (21%)" : "reducido (10%)"}</strong>. El tipo
              reducido del 10% solo aplica si eres persona física, la vivienda es de uso particular y tiene más de 2
              años, <strong>y además</strong> el equipo no supera el 40% del presupuesto — algo que en instalaciones
              de aire acondicionado suele incumplirse porque el equipo domina el coste. Si compras el equipo por
              separado y solo contratas la instalación, la mano de obra podría tributar al 10%: pregúntalo.
            </p>
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="font-bold text-neutral-950">Siguiente paso</h2>
        <p className="mt-2 text-neutral-700">
          Si ya tienes un presupuesto de un instalador, compáralo contra este rango para saber si tiene sentido.
        </p>
        <div className="mt-4">
          <LinkButton href="/aire-acondicionado/instalacion/analizar-presupuesto">Comparar mi presupuesto</LinkButton>
        </div>
      </Card>

      <LeadRequestCard estimateId={estimate.id} />

      <p className="mt-8 text-center text-sm text-neutral-500">
        <Badge tone="neutral">Metodología {methodologyVersion}</Badge> — esto no es una tasación profesional.{" "}
        <Link href="/metodologia" className="font-semibold text-brand-700 hover:underline">
          Ver metodología completa
        </Link>
      </p>
    </Container>
  );
}
