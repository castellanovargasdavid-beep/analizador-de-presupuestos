import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { ConfidenceTag } from "@/components/result/ConfidenceTag";
import { listDataSources } from "@/lib/estimation/repository";
import type { Confidence } from "@/lib/estimation/types";

export const metadata: Metadata = {
  title: "Fuentes",
  description:
    "Todas las fuentes usadas para calcular los rangos de precio de Presupuesto Claro: qué son, cuándo se consultaron y con qué fiabilidad.",
  alternates: { canonical: "/fuentes" },
};

export const revalidate = 3600;

const SOURCE_TYPE_LABEL: Record<string, string> = {
  oficial: "Normativa/organismo oficial",
  catalogo_real: "Catálogo real de un actor de mercado",
  mercado: "Agregador de mercado",
  heuristica_propia: "Heurística propia",
};

export default async function FuentesPage() {
  const sources = await listDataSources();
  const byConfidence = { A: [], B: [], C: [] } as Record<Confidence, typeof sources>;
  for (const s of sources) byConfidence[s.confidence as Confidence].push(s);

  return (
    <Container className="max-w-3xl py-12">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Fuentes" }]} />
      <h1 className="mt-3 text-3xl font-bold text-neutral-950">Fuentes</h1>
      <p className="mt-4 text-lg text-neutral-700">
        Cada factor de precio de la calculadora cita una de las fuentes de esta página. Nada se presenta como un
        hecho verificado si no lo es — ver el detalle de cómo se combinan en la{" "}
        <a href="/metodologia" className="font-semibold text-brand-700 hover:underline">
          metodología
        </a>
        .
      </p>

      {(["A", "B", "C"] as const).map((level) => (
        <section key={level} className="mt-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-neutral-950">
            <ConfidenceTag confidence={level} />
            {level === "A" && "Fuentes verificables"}
            {level === "B" && "Fuentes de mercado"}
            {level === "C" && "Heurísticas propias"}
          </h2>
          <div className="mt-4 space-y-4">
            {byConfidence[level].map((source) => (
              <Card key={source.id}>
                <h3 className="font-bold text-neutral-950">
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noopener noreferrer nofollow" className="hover:underline">
                      {source.name}
                    </a>
                  ) : (
                    source.name
                  )}
                </h3>
                <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm text-neutral-600 sm:grid-cols-2">
                  <div>
                    <dt className="inline font-semibold">Tipo: </dt>
                    <dd className="inline">{SOURCE_TYPE_LABEL[source.sourceType] ?? source.sourceType}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold">Ámbito: </dt>
                    <dd className="inline">{source.geographicScope}</dd>
                  </div>
                  {source.publishedOn && (
                    <div>
                      <dt className="inline font-semibold">Publicada: </dt>
                      <dd className="inline">{source.publishedOn}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="inline font-semibold">Verificada por nosotros: </dt>
                    <dd className="inline">{source.retrievedOn}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-sm text-neutral-700">{source.notes}</p>
              </Card>
            ))}
            {byConfidence[level].length === 0 && (
              <p className="text-sm text-neutral-500">Ninguna fuente en este nivel todavía.</p>
            )}
          </div>
        </section>
      ))}

      <div className="mt-12">
        <RelatedLinks
          items={[
            { href: "/metodologia", label: "Cómo combinamos estas fuentes en el cálculo" },
            { href: "/aire-acondicionado/instalacion", label: "Ir a la calculadora" },
          ]}
        />
      </div>
    </Container>
  );
}
