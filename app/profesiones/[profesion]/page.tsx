import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { JsonLd } from "@/components/content/JsonLd";
import { CatalogIcon, ArrowRightIcon } from "@/components/ui/icons";
import { ServiceStatusBadge } from "@/components/catalog/ServiceStatusBadge";
import { NotifyMeForm } from "@/components/catalog/NotifyMeForm";
import { DirectRequestForm } from "@/components/catalog/DirectRequestForm";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { getProfessionBySlug, listProfessionSlugs } from "@/lib/catalog/repository";
import { listRegions } from "@/lib/estimation/repository";
import { absoluteUrl } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";

// Conjunto cerrado a las profesiones publicadas desde /admin — mismo criterio que guías/preguntas.
export const dynamicParams = false;
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await listProfessionSlugs();
  return slugs.map((profesion) => ({ profesion }));
}

export async function generateMetadata({ params }: { params: Promise<{ profesion: string }> }): Promise<Metadata> {
  const { profesion } = await params;
  const result = await getProfessionBySlug(profesion);
  if (!result) return {};
  return pageMetadata({
    title: `${result.profession.name}: precios y solicitud de presupuesto`,
    description: result.profession.description ?? `Servicios de ${result.profession.name} en Presupuesto Claro.`,
    path: `/profesiones/${result.profession.slug}`,
  });
}

export default async function ProfesionPage({ params }: { params: Promise<{ profesion: string }> }) {
  const { profesion } = await params;
  const result = await getProfessionBySlug(profesion);
  if (!result) notFound();

  const { profession, category, services } = result;
  const regions = await listRegions();

  return (
    <Container className="max-w-3xl py-12">
      <PageViewTracker />
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Profesiones", href: "/profesiones" },
          { label: profession.name },
        ]}
      />
      <div className="mt-3 flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <CatalogIcon iconKey={profession.iconKey} className="size-6" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-950">{profession.name}</h1>
          {category && <p className="text-sm text-neutral-500">{category.name}</p>}
        </div>
      </div>
      {profession.description && <p className="mt-4 text-lg text-neutral-700">{profession.description}</p>}

      <div className="mt-10 space-y-6">
        {services.map((service) => (
          <Card key={service.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-neutral-950">{service.name}</h2>
              <ServiceStatusBadge status={service.availabilityStatus} />
            </div>
            {service.description && <p className="mt-2 text-sm text-neutral-600">{service.description}</p>}

            <div className="mt-4">
              {service.availabilityStatus === "disponible" && (
                <LinkButton href={`/${category?.slug}/${service.slug}`}>
                  Calcular precio orientativo <ArrowRightIcon />
                </LinkButton>
              )}
              {service.availabilityStatus === "solo_solicitud" && (
                <DirectRequestForm serviceTypeId={service.id} serviceName={service.name} regions={regions} />
              )}
              {service.availabilityStatus === "proximamente" && (
                <div>
                  <p className="mb-2 text-sm text-neutral-500">
                    Todavía no tenemos suficientes datos para calcular un precio orientativo fiable de este
                    servicio. Déjanos tu email y te avisamos en cuanto esté disponible.
                  </p>
                  <NotifyMeForm serviceTypeId={service.id} />
                </div>
              )}
            </div>
          </Card>
        ))}
        {services.length === 0 && (
          <p className="text-sm text-neutral-500">Todavía no hay servicios publicados para esta profesión.</p>
        )}
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: profession.name,
          areaServed: "ES",
          provider: { "@type": "Organization", name: "Presupuesto Claro" },
          url: absoluteUrl(`/profesiones/${profession.slug}`),
        }}
      />
    </Container>
  );
}
