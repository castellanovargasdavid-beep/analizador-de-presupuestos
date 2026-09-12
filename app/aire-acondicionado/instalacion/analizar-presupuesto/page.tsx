import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Wizard } from "@/components/calculator/Wizard";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { FAQSection } from "@/components/content/FAQSection";
import { MistakesList } from "@/components/content/InfoLists";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { SourcesNote } from "@/components/content/SourcesNote";
import { JsonLd } from "@/components/content/JsonLd";
import { listMaterialLevels, listRegions } from "@/lib/estimation/repository";
import { absoluteUrl } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";
import { listFaqsForPage } from "@/lib/content/repository";

export const metadata = pageMetadata({
  title: "¿Es caro tu presupuesto de aire acondicionado? Compáralo",
  description:
    "Introduce el presupuesto que te han dado y comprueba si está dentro del rango habitual, con posibles razones y preguntas recomendadas.",
  path: "/aire-acondicionado/instalacion/analizar-presupuesto",
});

export const revalidate = 3600;

export default async function AnalizarPresupuestoPage() {
  const [regions, materialLevels, faqItems] = await Promise.all([
    listRegions(),
    listMaterialLevels(),
    listFaqsForPage("analizar-presupuesto"),
  ]);
  return (
    <Container className="max-w-3xl py-12">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Aire acondicionado", href: "/aire-acondicionado" },
          { label: "Instalación", href: "/aire-acondicionado/instalacion" },
          { label: "Analizar presupuesto" },
        ]}
      />

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
        ¿Te están cobrando de más por instalar aire acondicionado?
      </h1>
      <p className="mt-4 text-lg text-neutral-700">
        Introduce las características de tu instalación y el presupuesto que has recibido. Te diremos si está dentro
        del rango habitual, por encima o por debajo — nunca si el instalador te está &ldquo;engañando&rdquo;: eso no
        lo puede decidir una calculadora.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link
          href="/aire-acondicionado/instalacion"
          className="rounded-full bg-brand-50 px-4 py-2 font-semibold text-brand-800 hover:bg-brand-100"
        >
          Aún no tengo presupuesto, solo quiero una estimación →
        </Link>
      </div>

      <div className="mt-10">
        <Wizard mode="analizador" regions={regions} materialLevels={materialLevels} />
      </div>

      <div className="mt-16 space-y-16">
        <MistakesList
          items={[
            "Partidas agrupadas en una sola línea ('instalación aire acondicionado') sin desglose.",
            "Descripciones vagas del equipo ('primera marca', 'gama media') sin marca ni modelo.",
            "Ausencia de certificado o boletín de la instalación.",
            "Anticipos elevados sin justificar con compras concretas de material.",
          ]}
        />

        <FAQSection items={faqItems} />

        <RelatedLinks
          items={[
            {
              href: "/aire-acondicionado/instalacion",
              label: "Calculadora de instalación",
              description: "Si aún no tienes presupuesto, empieza aquí.",
            },
            {
              href: "/guias/como-comparar-presupuestos-de-instalacion",
              label: "Cómo comparar presupuestos de instalación",
            },
            { href: "/metodologia", label: "Metodología" },
          ]}
        />

        <SourcesNote />
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Comparación de presupuesto de instalación de aire acondicionado",
          areaServed: "ES",
          provider: { "@type": "Organization", name: "Presupuesto Claro" },
          url: absoluteUrl("/aire-acondicionado/instalacion/analizar-presupuesto"),
        }}
      />
    </Container>
  );
}
