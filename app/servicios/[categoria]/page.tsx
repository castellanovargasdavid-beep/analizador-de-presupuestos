import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { JsonLd } from "@/components/content/JsonLd";
import { CatalogIcon } from "@/components/ui/icons";
import { ServiceStatusBadge } from "@/components/catalog/ServiceStatusBadge";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { getCategoryBySlug, listCategorySlugs } from "@/lib/catalog/repository";
import { absoluteUrl } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";

// Conjunto cerrado a las categorías activas en /admin — mismo criterio que guías/preguntas.
export const dynamicParams = false;
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await listCategorySlugs();
  return slugs.map((categoria) => ({ categoria }));
}

export async function generateMetadata({ params }: { params: Promise<{ categoria: string }> }): Promise<Metadata> {
  const { categoria } = await params;
  const category = await getCategoryBySlug(categoria);
  if (!category) return {};
  return pageMetadata({
    title: `${category.name}: profesiones y servicios`,
    description: category.description ?? `Profesiones y servicios disponibles en ${category.name}.`,
    path: `/servicios/${category.slug}`,
  });
}

export default async function CategoriaPage({ params }: { params: Promise<{ categoria: string }> }) {
  const { categoria } = await params;
  const category = await getCategoryBySlug(categoria);
  if (!category) notFound();

  return (
    <Container className="max-w-3xl py-12">
      <PageViewTracker />
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Servicios", href: "/servicios" }, { label: category.name }]} />
      <div className="mt-3 flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <CatalogIcon iconKey={category.iconKey} className="size-6" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-950">{category.name}</h1>
      </div>
      {category.description && <p className="mt-4 text-lg text-neutral-700">{category.description}</p>}

      <div className="mt-10 space-y-6">
        {category.professions.map((prof) => (
          <Card key={prof.id}>
            <h2 className="font-bold text-neutral-950">
              <Link href={`/profesiones/${prof.slug}`} className="hover:underline">
                {prof.name}
              </Link>
            </h2>
            {prof.description && <p className="mt-1 text-sm text-neutral-600">{prof.description}</p>}
            {prof.services.length > 0 && (
              <ul className="mt-4 space-y-2">
                {prof.services.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-2 text-sm">
                    <span className="font-medium text-neutral-800">{s.name}</span>
                    <ServiceStatusBadge status={s.availabilityStatus} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
        {category.professions.length === 0 && (
          <p className="text-sm text-neutral-500">Todavía no hay profesiones publicadas en esta categoría.</p>
        )}
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: category.name,
          url: absoluteUrl(`/servicios/${category.slug}`),
        }}
      />
    </Container>
  );
}
