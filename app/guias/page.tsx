import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Guías para no pagar de más",
  description: "Guías prácticas para comparar presupuestos y contratar servicios del hogar con criterio.",
};

const GUIAS = [
  {
    slug: "como-comparar-presupuestos-de-instalacion",
    titulo: "Cómo comparar presupuestos de instalación sin equivocarte",
    resumen: "Qué exigir a cada presupuesto para poder compararlos de verdad, y qué señales de alerta buscar.",
  },
];

export default function GuiasIndexPage() {
  return (
    <Container className="max-w-3xl py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
        <Link href="/" className="hover:text-brand-700">
          Inicio
        </Link>{" "}
        / Guías
      </nav>
      <h1 className="mt-3 text-3xl font-bold text-neutral-950">Guías</h1>
      <p className="mt-4 text-neutral-700">Contenido de apoyo para usar mejor las calculadoras, no relleno de SEO.</p>

      <div className="mt-8 space-y-4">
        {GUIAS.map((g) => (
          <Link key={g.slug} href={`/guias/${g.slug}`} className="block">
            <Card className="transition-colors hover:border-brand-400">
              <h2 className="font-bold text-neutral-950">{g.titulo}</h2>
              <p className="mt-1 text-sm text-neutral-700">{g.resumen}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
