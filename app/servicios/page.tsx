import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { listCatalogTree } from "@/lib/catalog/repository";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Servicios del hogar: categorías y profesiones",
  description:
    "Explora las categorías de servicios del hogar de Presupuesto Claro: qué calculadoras están disponibles hoy y qué servicios llegarán próximamente.",
  path: "/servicios",
});

export const revalidate = 3600;

export default async function ServiciosPage() {
  const categories = await listCatalogTree();

  return (
    <Container className="max-w-5xl py-12">
      <PageViewTracker />
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Servicios" }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
        Servicios del hogar
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-neutral-700">
        Elige una categoría o busca directamente el servicio que necesitas. Solo los servicios marcados como
        &ldquo;calculadora disponible&rdquo; tienen una estimación automática hoy — el resto son honestamente
        próximos pasos, no calculadoras a medio hacer.
      </p>

      <div className="mt-10">
        <CatalogBrowser categories={categories} />
      </div>
    </Container>
  );
}
