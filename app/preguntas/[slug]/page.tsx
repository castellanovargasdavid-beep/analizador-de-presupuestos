import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { SourcesNote } from "@/components/content/SourcesNote";
import { JsonLd } from "@/components/content/JsonLd";
import { getPregunta, PREGUNTAS } from "@/lib/content/preguntas";
import { absoluteUrl } from "@/lib/site";

// Conjunto cerrado: solo se sirven las preguntas registradas en
// lib/content/preguntas.ts. `dynamicParams = false` hace que cualquier
// otro slug devuelva 404 en vez de generar una página bajo demanda — así
// no puede aparecer una combinación no revisada.
export const dynamicParams = false;

export function generateStaticParams() {
  return PREGUNTAS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pregunta = getPregunta(slug);
  if (!pregunta) return {};
  return {
    title: pregunta.pregunta,
    description: pregunta.respuestaCorta,
    alternates: { canonical: `/preguntas/${pregunta.slug}` },
  };
}

export default async function PreguntaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pregunta = getPregunta(slug);
  if (!pregunta) notFound();

  return (
    <Container className="max-w-2xl py-12">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Preguntas", href: "/preguntas" }, { label: pregunta.pregunta }]} />

      <h1 className="mt-3 text-3xl font-bold text-neutral-950">{pregunta.pregunta}</h1>
      <p className="mt-4 rounded-lg bg-brand-50 p-4 text-lg font-medium text-brand-900">{pregunta.respuestaCorta}</p>

      <div className="mt-6 space-y-4 text-neutral-700">
        {pregunta.detalle.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <div className="mt-10">
        <RelatedLinks items={pregunta.relacionadas} />
      </div>

      <div className="mt-8">
        <SourcesNote />
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: pregunta.pregunta,
              acceptedAnswer: { "@type": "Answer", text: `${pregunta.respuestaCorta} ${pregunta.detalle.join(" ")}` },
            },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: pregunta.pregunta,
          url: absoluteUrl(`/preguntas/${pregunta.slug}`),
          inLanguage: "es-ES",
        }}
      />
    </Container>
  );
}
