import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { RangeBar } from "@/components/result/RangeBar";
import { Breakdown } from "@/components/result/Breakdown";
import { decodeState } from "@/lib/pricing/encode";
import { formatEUR } from "@/lib/format";
import type { EstimationResult } from "@/lib/pricing/types";
import { AlertTriangleIcon, InfoIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Tu estimación orientativa",
  robots: { index: false, follow: true },
};

export default async function ResultadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = decodeState<EstimationResult>(id);

  if (!result) {
    notFound();
  }

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
        / Resultado
      </nav>

      <h1 className="mt-3 text-2xl font-bold text-neutral-950 sm:text-3xl">Tu estimación orientativa</h1>

      <Card className="mt-6">
        <p className="text-sm font-semibold text-neutral-500">Estimación orientativa</p>
        <p className="mt-1 text-4xl font-bold tabular-nums text-brand-800">
          {formatEUR(result.totalRange.min)} – {formatEUR(result.totalRange.max)}
        </p>
        <div className="mt-6">
          <RangeBar rangeMin={result.totalRange.min} rangeMax={result.totalRange.max} />
        </div>
      </Card>

      {result.rite.requiereRegistroCCAA && (
        <div className="mt-6 flex gap-3 rounded-xl bg-info-bg p-4">
          <InfoIcon className="mt-0.5 size-5 shrink-0 text-info-text" />
          <p className="text-sm text-info-text">{result.rite.mensaje}</p>
        </div>
      )}

      <Card className="mt-6">
        <h2 className="font-bold text-neutral-950">Desglose por partidas</h2>
        <p className="mt-1 text-sm text-neutral-500">
          La letra indica la fiabilidad del dato: <strong>A</strong> fuente verificable, <strong>B</strong> mercado
          sin metodología pública, <strong>C</strong> heurística propia.
        </p>
        <div className="mt-4">
          <Breakdown lineItems={result.lineItems} />
        </div>
      </Card>

      {result.advertencias.length > 0 && (
        <Card className="mt-6 border-warning-bg bg-warning-bg/40">
          <div className="flex gap-3">
            <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-warning-text" />
            <div>
              <h2 className="font-bold text-neutral-950">Advertencias sobre esta estimación</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                {result.advertencias.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <h2 className="font-bold text-neutral-950">Siguiente paso</h2>
        <p className="mt-2 text-neutral-700">
          Si ya tienes un presupuesto de un instalador, compáralo contra este rango para saber si tiene sentido.
        </p>
        <div className="mt-4">
          <LinkButton href="/aire-acondicionado/instalacion/analizar-presupuesto">Comparar mi presupuesto</LinkButton>
        </div>
      </Card>

      <p className="mt-8 text-center text-sm text-neutral-500">
        <Badge tone="neutral">Metodología {result.methodologyVersion}</Badge> — esto no es una tasación profesional.{" "}
        <Link href="/metodologia" className="font-semibold text-brand-700 hover:underline">
          Ver metodología completa
        </Link>
      </p>
    </Container>
  );
}
