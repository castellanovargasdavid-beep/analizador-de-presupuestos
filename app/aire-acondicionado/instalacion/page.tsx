import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Wizard } from "@/components/calculator/Wizard";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { FAQSection } from "@/components/content/FAQSection";
import { VariablesList, TipsList, MistakesList } from "@/components/content/InfoLists";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { SourcesNote } from "@/components/content/SourcesNote";
import { JsonLd } from "@/components/content/JsonLd";
import { RangeBar } from "@/components/result/RangeBar";
import { loadPricingContext, listMaterialLevels, listRegions } from "@/lib/estimation/repository";
import { evaluateEstimate } from "@/lib/estimation/engine";
import { formatEUR } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";
import { listFaqsForPage } from "@/lib/content/repository";

export const metadata = pageMetadata({
  title: "Precio de instalar aire acondicionado: calculadora orientativa",
  description:
    "Calcula el rango de precio razonable para instalar aire acondicionado según sistema, potencia y ubicación. Metodología transparente, sin registro.",
  path: "/aire-acondicionado/instalacion",
});

// Regiones y niveles de material cambian poco; se revalida cada hora en vez
// de exigir un redeploy completo para reflejar cambios en el seed.
export const revalidate = 3600;

async function computeExample(overrides: Parameters<typeof evaluateEstimate>[0]["input"]) {
  const context = await loadPricingContext("aire-acondicionado", "instalacion");
  return evaluateEstimate({
    factors: context.factors,
    input: overrides,
    uncertaintyBands: context.uncertaintyBands,
    vatRates: context.vatRates,
    vatEligibility: { clientePersonaFisicaUsoParticular: true, viviendaMasDeDosAnos: true },
    serviceTypeVatReducedEligible: context.serviceTypeVatReducedEligible,
  });
}

export default async function InstalacionPage() {
  const [regions, materialLevels, faqItems, ejemploSimple, ejemploMultisplit] = await Promise.all([
    listRegions(),
    listMaterialLevels(),
    listFaqsForPage("aire-acondicionado-instalacion"),
    computeExample({
      selections: { systemType: "split-1x1", materialLevel: "media", retiradaEquipo: "no" },
      quantities: { metrosLineaFrigorificaExtra: 0, canaletaVistaMetros: 0, potenciaKw: 3.5 },
      flags: { necesitaBombaCondensados: false, instalacionElectricaDedicada: false, accesoDificil: false },
      regionSlug: null,
    }),
    computeExample({
      selections: { systemType: "split-2x1", materialLevel: "media", retiradaEquipo: "desechar" },
      quantities: { metrosLineaFrigorificaExtra: 2, canaletaVistaMetros: 0, potenciaKw: 3.5 },
      flags: { necesitaBombaCondensados: false, instalacionElectricaDedicada: false, accesoDificil: false },
      regionSlug: null,
    }),
  ]);

  return (
    <Container className="max-w-3xl py-12">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Aire acondicionado", href: "/aire-acondicionado" },
          { label: "Instalación" },
        ]}
      />

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
        ¿Cuánto cuesta instalar aire acondicionado?
      </h1>
      <p className="mt-4 text-lg text-neutral-700">
        Responde unas pocas preguntas sobre tu instalación y obtén un rango de precio orientativo con el desglose por
        partidas, para saber qué es razonable esperar antes de pedir presupuestos.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link
          href="/aire-acondicionado/instalacion/analizar-presupuesto"
          className="rounded-full bg-brand-50 px-4 py-2 font-semibold text-brand-800 hover:bg-brand-100"
        >
          ¿Ya tienes un presupuesto? Analízalo directamente →
        </Link>
      </div>

      <div className="mt-10">
        <Wizard mode="calculadora" regions={regions} materialLevels={materialLevels} />
      </div>

      <div className="mt-16 space-y-16">
        <section>
          <h2 className="text-xl font-bold text-neutral-950">Ejemplos reales de cálculo</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Calculados en directo con el mismo motor que usa la calculadora de arriba, no cifras fijas de un artículo.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card>
              <p className="text-sm font-semibold text-neutral-500">Split 1x1, gama media, sin retirada de equipo</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-brand-800">
                {formatEUR(ejemploSimple.total.min)} – {formatEUR(ejemploSimple.total.max)}
              </p>
              <div className="mt-4">
                <RangeBar rangeMin={ejemploSimple.total.min} rangeMax={ejemploSimple.total.max} />
              </div>
            </Card>
            <Card>
              <p className="text-sm font-semibold text-neutral-500">
                Multisplit 2x1, gama media, con retirada y 2 m de línea extra
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-brand-800">
                {formatEUR(ejemploMultisplit.total.min)} – {formatEUR(ejemploMultisplit.total.max)}
              </p>
              <div className="mt-4">
                <RangeBar rangeMin={ejemploMultisplit.total.min} rangeMax={ejemploMultisplit.total.max} />
              </div>
            </Card>
          </div>
        </section>

        <VariablesList
          items={[
            "Tipo de sistema: split de 1, 2 o 3 unidades interiores, o por conductos.",
            "Potencia del equipo y si supera el umbral de 5 kW del RITE.",
            "Metros de línea frigorífica más allá de los incluidos en la instalación base.",
            "Si hay que retirar un equipo antiguo, y si se desecha o se reutiliza en otra ubicación.",
            "Gama del equipo: económica, media o premium.",
            "Comunidad autónoma (solo hay señal de ajuste real en Madrid y Cataluña).",
            "IVA aplicable: 10% reducido o 21% general, según tres requisitos legales a la vez.",
          ]}
        />

        <TipsList
          items={[
            "Pide siempre que el presupuesto desglose equipo y mano de obra por separado, no una única línea.",
            "Pregunta explícitamente cuántos metros de línea frigorífica están incluidos antes de firmar.",
            "Si el equipo supera el 40% del presupuesto, pregunta si comprarlo por separado reduce el IVA de la instalación al 10%.",
            "Exige el certificado o boletín de la instalación, no solo la factura del equipo.",
          ]}
        />

        <MistakesList
          items={[
            "Aceptar un presupuesto con una única línea ('instalación aire acondicionado') sin desglose.",
            "Comparar solo el precio total sin comprobar que todos los presupuestos incluyen el mismo alcance.",
            "No preguntar por la retirada del equipo antiguo hasta que ya está todo decidido.",
            "Asumir que un presupuesto más barato es mejor sin comprobar la gama del equipo.",
          ]}
        />

        <FAQSection items={faqItems} />

        <RelatedLinks
          items={[
            {
              href: "/aire-acondicionado/instalacion/analizar-presupuesto",
              label: "Analizar un presupuesto ya recibido",
              description: "Compara tu presupuesto real contra este rango.",
            },
            {
              href: "/precios/aire-acondicionado-instalacion",
              label: "Precio medio de instalar aire acondicionado en España",
              description: "Desglose de partidas y rangos de mercado citados.",
            },
            {
              href: "/comparativas/split-vs-conductos",
              label: "Split vs. conductos: qué sistema conviene",
              description: "Comparativa de precio y cuándo elegir cada uno.",
            },
            {
              href: "/guias/como-comparar-presupuestos-de-instalacion",
              label: "Cómo comparar presupuestos de instalación",
            },
            {
              href: "/preguntas/necesito-certificado-rite-aire-acondicionado",
              label: "¿Necesito el certificado RITE?",
              description: "Obligatorio a partir de cierta potencia.",
            },
          ]}
        />

        <SourcesNote />
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Instalación de aire acondicionado",
          areaServed: "ES",
          provider: { "@type": "Organization", name: "Presupuesto Claro" },
          url: absoluteUrl("/aire-acondicionado/instalacion"),
        }}
      />
    </Container>
  );
}
