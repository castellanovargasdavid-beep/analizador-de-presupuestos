import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { SourcesNote } from "@/components/content/SourcesNote";
import { JsonLd } from "@/components/content/JsonLd";
import { getPublishedQuestion, listPublishedQuestionSlugs } from "@/lib/content/repository";
import { absoluteUrl } from "@/lib/site";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { ARTICLE_AUTHOR, pageMetadata } from "@/lib/metadata";

// Conjunto cerrado: solo se sirven las preguntas publicadas desde /admin.
// `dynamicParams = false` hace que cualquier otro slug devuelva 404 en vez
// de generar una página bajo demanda — así no puede aparecer una
// combinación no revisada.
export const dynamicParams = false;
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await listPublishedQuestionSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pregunta = await getPublishedQuestion(slug);
  if (!pregunta) return {};
  return pageMetadata({
    title: pregunta.question,
    description: pregunta.shortAnswer,
    path: `/preguntas/${pregunta.slug}`,
  });
}

export default async function PreguntaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pregunta = await getPublishedQuestion(slug);
  if (!pregunta) notFound();

  const publishedDate = (pregunta.publishedAt ?? pregunta.createdAt).toISOString().slice(0, 10);
  const modifiedDate = pregunta.updatedAt.toISOString().slice(0, 10);

  return (
    <Container className="max-w-2xl py-12">
      <PageViewTracker />
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Preguntas", href: "/preguntas" }, { label: pregunta.question }]} />

      <h1 className="mt-3 text-3xl font-bold text-neutral-950">{pregunta.question}</h1>
      <p className="mt-4 rounded-lg bg-brand-50 p-4 text-lg font-medium text-brand-900">{pregunta.shortAnswer}</p>

      <div className="mt-6 space-y-4 text-neutral-700">
        {pregunta.detail.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <div className="mt-10">
        <RelatedLinks items={pregunta.relatedLinks} />
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
              name: pregunta.question,
              acceptedAnswer: { "@type": "Answer", text: `${pregunta.shortAnswer} ${pregunta.detail.join(" ")}` },
            },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: pregunta.question,
          url: absoluteUrl(`/preguntas/${pregunta.slug}`),
          author: ARTICLE_AUTHOR,
          datePublished: publishedDate,
          dateModified: modifiedDate,
          inLanguage: "es-ES",
        }}
      />
    </Container>
  );
}
