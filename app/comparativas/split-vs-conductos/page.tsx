import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { ComparisonTable } from "@/components/content/ComparisonTable";
import { FAQSection } from "@/components/content/FAQSection";
import { TipsList } from "@/components/content/InfoLists";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { SourcesNote } from "@/components/content/SourcesNote";
import { JsonLd } from "@/components/content/JsonLd";
import { LinkButton } from "@/components/ui/Button";
import { loadPricingContext } from "@/lib/estimation/repository";
import { evaluateEstimate } from "@/lib/estimation/engine";
import { formatEUR } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

export const metadata: Metadata = {
  title: "Split vs. conductos: qué sistema de aire acondicionado conviene",
  description:
    "Diferencias reales de precio y de uso entre un sistema split y uno por conductos, con rangos calculados en vivo para decidir con criterio.",
  alternates: { canonical: "/comparativas/split-vs-conductos" },
};

export const revalidate = 3600;

const FAQ_ITEMS = [
  {
    question: "¿Los conductos son siempre más caros que un split?",
    answer:
      "Para una sola estancia, casi siempre sí: un sistema por conductos es un paquete completo que cubre varias zonas y requiere más obra (falso techo, rejillas), mientras que un split de una unidad cubre una sola habitación con mucha menos obra.",
  },
  {
    question: "¿Cuándo compensa instalar conductos en vez de varios splits?",
    answer:
      "Cuando quieres climatizar una vivienda completa con una estética unificada (sin unidades visibles en las paredes) y ya tienes o vas a hacer un falso techo. Para 1-2 estancias sueltas, un split o multisplit suele salir más ajustado.",
  },
  {
    question: "¿El mantenimiento es distinto entre uno y otro?",
    answer:
      "Los conductos suelen requerir revisión de la red de conductos además del propio equipo, mientras que un split es más sencillo de mantener por ser una unidad autocontenida por estancia.",
  },
];

export default async function SplitVsConductosPage() {
  const context = await loadPricingContext("aire-acondicionado", "instalacion");
  const vatEligibility = { clientePersonaFisicaUsoParticular: true, viviendaMasDeDosAnos: true };

  function evaluate(systemType: string) {
    return evaluateEstimate({
      factors: context.factors,
      input: {
        selections: { systemType, materialLevel: "media", retiradaEquipo: "no" },
        quantities: { metrosLineaFrigorificaExtra: 0, canaletaVistaMetros: 0, potenciaKw: 3.5 },
        flags: { necesitaBombaCondensados: false, instalacionElectricaDedicada: false, accesoDificil: false },
        regionSlug: null,
      },
      uncertaintyBands: context.uncertaintyBands,
      vatRates: context.vatRates,
      vatEligibility,
      serviceTypeVatReducedEligible: context.serviceTypeVatReducedEligible,
    });
  }

  const split = evaluate("split-1x1");
  const conductos = evaluate("conductos");

  return (
    <Container className="max-w-3xl py-12">
      <PageViewTracker />
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Aire acondicionado", href: "/aire-acondicionado" },
          { label: "Split vs. conductos" },
        ]}
      />

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
        Split vs. conductos: qué sistema de aire acondicionado conviene
      </h1>
      <p className="mt-4 text-lg text-neutral-700">
        No es solo una cuestión de precio: son dos soluciones para necesidades distintas. Aquí tienes el rango real
        de cada una (gama media, caso base) y cuándo tiene sentido elegir una u otra.
      </p>

      <div className="mt-10">
        <ComparisonTable
          columns={[
            { key: "split", label: "Split (1 unidad)" },
            { key: "conductos", label: "Por conductos" },
          ]}
          rows={[
            {
              label: "Rango orientativo (IVA incluido)",
              values: {
                split: <strong>{formatEUR(split.total.min)} – {formatEUR(split.total.max)}</strong>,
                conductos: <strong>{formatEUR(conductos.total.min)} – {formatEUR(conductos.total.max)}</strong>,
              },
            },
            {
              label: "Cobertura habitual",
              values: { split: "Una estancia por unidad interior", conductos: "Vivienda completa o varias zonas" },
            },
            {
              label: "Obra necesaria",
              values: { split: "Mínima: taladro y línea frigorífica vista u oculta", conductos: "Falso techo y red de conductos" },
            },
            {
              label: "Estética",
              values: { split: "Unidad interior visible en la pared", conductos: "Solo rejillas visibles en el techo" },
            },
            {
              label: "Fiabilidad del dato de precio",
              values: {
                split: "Desglosado por partidas (equipo A/B + instalación A)",
                conductos: "Paquete único de mercado (confianza B, sin desglose)",
              },
            },
          ]}
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton href="/aire-acondicionado/instalacion">Calcular mi split o multisplit</LinkButton>
      </div>

      <div className="mt-16 space-y-16">
        <TipsList
          items={[
            "Si solo necesitas climatizar 1-2 habitaciones, compara primero contra un split o multisplit antes de descartarlo por estética.",
            "Si ya vas a hacer un falso techo por otro motivo (iluminación, aislamiento), el sobrecoste de meter conductos ahí es menor que hacerlo aparte.",
            "Pide siempre que te especifiquen si el precio de conductos incluye la red completa o solo el equipo — es la partida que más varía.",
          ]}
        />

        <FAQSection items={FAQ_ITEMS} />

        <RelatedLinks
          items={[
            { href: "/aire-acondicionado/instalacion", label: "Calculadora completa de instalación" },
            { href: "/precios/aire-acondicionado-instalacion", label: "Precio medio por tipo y gama" },
          ]}
        />

        <SourcesNote note="El rango de conductos tiene menor fiabilidad que el de split (ver arriba): no existe desglose de mercado por partidas para ese sistema." />
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Split vs. conductos: qué sistema de aire acondicionado conviene",
          url: absoluteUrl("/comparativas/split-vs-conductos"),
          inLanguage: "es-ES",
        }}
      />
    </Container>
  );
}
