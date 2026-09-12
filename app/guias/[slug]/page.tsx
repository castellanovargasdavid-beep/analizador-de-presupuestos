import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { GuideBody } from "@/components/content/GuideBody";
import { JsonLd } from "@/components/content/JsonLd";
import { getPublishedGuide, listPublishedGuideSlugs } from "@/lib/content/repository";
import { absoluteUrl } from "@/lib/site";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { ARTICLE_AUTHOR, pageMetadata } from "@/lib/metadata";

// Igual que /preguntas/[slug]: conjunto cerrado a lo publicado desde
// /admin, nunca generación bajo demanda para un slug sin revisar.
export const dynamicParams = false;
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await listPublishedGuideSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guia = await getPublishedGuide(slug);
  if (!guia) return {};
  return pageMetadata({
    title: guia.title,
    description: guia.metaDescription,
    path: `/guias/${guia.slug}`,
  });
}

export default async function GuiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guia = await getPublishedGuide(slug);
  if (!guia) notFound();

  const publishedDate = (guia.publishedAt ?? guia.createdAt).toISOString().slice(0, 10);
  const modifiedDate = guia.updatedAt.toISOString().slice(0, 10);

  return (
    <Container className="max-w-2xl py-12">
      <PageViewTracker />
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Guías", href: "/guias" }, { label: guia.title }]} />

      <h1 className="mt-3 text-3xl font-bold text-neutral-950">{guia.title}</h1>

      <div className="prose-neutral mt-6 text-neutral-700">
        <p>{guia.intro}</p>
      </div>

      <GuideBody blocks={guia.body} />

      {guia.ctaHref && guia.ctaLabel && (
        <div className="mt-10">
          <LinkButton href={guia.ctaHref}>{guia.ctaLabel}</LinkButton>
        </div>
      )}

      <div className="mt-10">
        <RelatedLinks items={guia.relatedLinks} />
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guia.title,
          url: absoluteUrl(`/guias/${guia.slug}`),
          author: ARTICLE_AUTHOR,
          datePublished: publishedDate,
          dateModified: modifiedDate,
          inLanguage: "es-ES",
        }}
      />
    </Container>
  );
}
