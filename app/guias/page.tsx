import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { listPublishedGuides } from "@/lib/content/repository";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Guías para no pagar de más",
  description: "Guías prácticas para comparar presupuestos y contratar servicios del hogar con criterio.",
  path: "/guias",
});

export const revalidate = 3600;

export default async function GuiasIndexPage() {
  const guias = await listPublishedGuides();

  return (
    <Container className="max-w-3xl py-12">
      <PageViewTracker />
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Guías" }]} />
      <h1 className="mt-3 text-3xl font-bold text-neutral-950">Guías</h1>
      <p className="mt-4 text-neutral-700">Contenido de apoyo para usar mejor las calculadoras, no relleno de SEO.</p>

      <div className="mt-8 space-y-4">
        {guias.map((g) => (
          <Link key={g.slug} href={`/guias/${g.slug}`} className="block">
            <Card className="transition-colors hover:border-brand-400">
              <h2 className="font-bold text-neutral-950">{g.title}</h2>
              <p className="mt-1 text-sm text-neutral-700">{g.summary}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
