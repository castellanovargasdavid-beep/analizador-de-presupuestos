import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { CatalogIcon } from "@/components/ui/icons";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { listCatalogTree } from "@/lib/catalog/repository";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Profesiones",
  description: "Todas las profesiones cubiertas por Presupuesto Claro, con o sin calculadora de precio disponible todavía.",
  path: "/profesiones",
});

export const revalidate = 3600;

export default async function ProfesionesPage() {
  const categories = await listCatalogTree();
  const allProfessions = categories.flatMap((c) => c.professions.map((p) => ({ ...p, categoryName: c.name })));

  return (
    <Container className="max-w-3xl py-12">
      <PageViewTracker />
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Profesiones" }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">Profesiones</h1>
      <p className="mt-4 text-lg text-neutral-700">
        Explora por profesión en vez de por categoría. Cada una indica qué servicios tienen calculadora hoy.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {allProfessions.map((prof) => (
          <Link key={prof.id} href={`/profesiones/${prof.slug}`} className="block">
            <Card className="h-full transition-colors hover:border-brand-400">
              <div className="flex items-center gap-2">
                <CatalogIcon iconKey={prof.iconKey} className="size-5 text-brand-700" />
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{prof.categoryName}</p>
              </div>
              <h2 className="mt-1 font-bold text-neutral-950">{prof.name}</h2>
              {prof.description && <p className="mt-1 text-sm text-neutral-600">{prof.description}</p>}
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
