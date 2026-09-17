import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GenericWizard } from "@/components/calculator/GenericWizard";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { getCategoryBySlug, getServiceTypeBySlug } from "@/lib/catalog/repository";
import { listRegions } from "@/lib/estimation/repository";
import { CALCULATOR_CONFIGS, getCalculatorConfig } from "@/lib/estimation/generic/calculator-configs";
import { pageMetadata } from "@/lib/metadata";

// Conjunto cerrado a los servicios con calculadora genérica registrada —
// nunca se genera esta página para una combinación categoría/servicio
// arbitraria, ni siquiera si existiera en la base de datos sin config.
export const dynamicParams = false;
export const revalidate = 3600;

export async function generateStaticParams() {
  return CALCULATOR_CONFIGS.map((c) => ({ categoria: c.categorySlug, servicio: c.serviceSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoria: string; servicio: string }>;
}): Promise<Metadata> {
  const { categoria, servicio } = await params;
  const config = getCalculatorConfig(categoria, servicio);
  if (!config) return {};
  return pageMetadata({
    title: `Precio de ${config.serviceName.toLowerCase()}: calculadora orientativa`,
    description: `Calcula un rango de precio orientativo para ${config.serviceName.toLowerCase()}, con desglose y fuentes citadas.`,
    path: `/${categoria}/${servicio}`,
  });
}

export default async function GenericCalculatorPage({
  params,
}: {
  params: Promise<{ categoria: string; servicio: string }>;
}) {
  const { categoria, servicio } = await params;
  const config = getCalculatorConfig(categoria, servicio);
  if (!config) notFound();

  const [service, category, regions] = await Promise.all([
    getServiceTypeBySlug(categoria, servicio),
    getCategoryBySlug(categoria),
    listRegions(),
  ]);
  if (!service || service.availabilityStatus !== "disponible") notFound();

  return (
    <>
      <section className="border-b border-neutral-200 bg-gradient-to-b from-brand-50/60 to-neutral-50 py-10 sm:py-14">
        <Container className="max-w-3xl">
          <PageViewTracker />
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              ...(category ? [{ label: category.name, href: `/servicios/${category.slug}` }] : []),
              { label: config.serviceName },
            ]}
          />

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
              ¿Cuánto cuesta {config.serviceName.toLowerCase()}?
            </h1>
            <Badge tone="info">Confianza B</Badge>
          </div>
          <p className="mt-4 text-lg text-neutral-700">
            Responde unas pocas preguntas y obtén un rango de precio orientativo. Este cálculo se basa en datos de
            mercado de agregadores de presupuestos (confianza B, la máxima disponible para este servicio), nunca en
            una fuente oficial normativa — por eso el margen es más amplio que en otras calculadoras de este sitio.
          </p>
        </Container>

        <Container className="mt-8 max-w-2xl">
          <GenericWizard config={config} regions={regions} />
        </Container>
      </section>

      {(service.whatIncluded || service.whatExcluded) && (
        <Container className="max-w-3xl py-12">
          <div className="grid gap-6 sm:grid-cols-2">
            {service.whatIncluded && (
              <Card>
                <h2 className="font-bold text-neutral-950">Qué incluye este cálculo</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">{service.whatIncluded}</p>
              </Card>
            )}
            {service.whatExcluded && (
              <Card>
                <h2 className="font-bold text-neutral-950">Qué NO incluye</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">{service.whatExcluded}</p>
              </Card>
            )}
          </div>
        </Container>
      )}
    </>
  );
}
