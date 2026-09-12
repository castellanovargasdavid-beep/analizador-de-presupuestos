import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { FAQSection } from "@/components/content/FAQSection";
import { VariablesList, TipsList, MistakesList } from "@/components/content/InfoLists";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { SourcesNote } from "@/components/content/SourcesNote";
import { JsonLd } from "@/components/content/JsonLd";
import { QuickRangeLookup, type RangeMatrixEntry } from "@/components/content/QuickRangeLookup";
import { loadPricingContext, listMaterialLevels } from "@/lib/estimation/repository";
import { evaluateEstimate } from "@/lib/estimation/engine";
import { formatEUR } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { ARTICLE_AUTHOR, pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Precio medio de instalar aire acondicionado en España",
  description:
    "Rango orientativo de precio por tipo de sistema y gama, con desglose de partidas y fuentes citadas. Calculado en vivo, no cifras fijas de un artículo.",
  path: "/precios/aire-acondicionado-instalacion",
});

export const revalidate = 3600;

const SYSTEM_TYPES: { slug: string; label: string }[] = [
  { slug: "split-1x1", label: "Split, 1 unidad interior" },
  { slug: "split-2x1", label: "Multisplit, 2 unidades" },
  { slug: "split-3x1", label: "Multisplit, 3 unidades" },
  { slug: "conductos", label: "Por conductos" },
];

const FAQ_ITEMS = [
  {
    question: "¿Cuál es el precio medio de instalar aire acondicionado en España?",
    answer:
      "Depende sobre todo del tipo de sistema y de la gama del equipo: un split de una unidad en gama media suele moverse en un rango bastante más bajo que un multisplit de tres unidades en gama premium. Usa la herramienta de esta página para ver el rango de tu caso.",
  },
  {
    question: "¿Por qué varía tanto el precio entre presupuestos?",
    answer:
      "Porque casi ningún presupuesto describe exactamente lo mismo: cambia la gama del equipo, los metros de línea frigorífica, si hay que retirar un equipo antiguo, y el tipo de IVA aplicado. Dos presupuestos 'del mismo trabajo' pueden no serlo en absoluto.",
  },
  {
    question: "¿Estos precios incluyen IVA?",
    answer:
      "Sí, el rango mostrado es con IVA incluido (21% en la mayoría de los casos de instalación de A/C, o 10% si se cumplen los tres requisitos legales — ver metodología).",
  },
];

export default async function PreciosInstalacionPage() {
  const [context, materialLevels] = await Promise.all([
    loadPricingContext("aire-acondicionado", "instalacion"),
    listMaterialLevels(),
  ]);

  const baseVatEligibility = { clientePersonaFisicaUsoParticular: true, viviendaMasDeDosAnos: true };

  function evaluate(systemType: string, materialLevel: string) {
    return evaluateEstimate({
      factors: context.factors,
      input: {
        selections: { systemType, materialLevel, retiradaEquipo: "no" },
        quantities: { metrosLineaFrigorificaExtra: 0, canaletaVistaMetros: 0, potenciaKw: 3.5 },
        flags: { necesitaBombaCondensados: false, instalacionElectricaDedicada: false, accesoDificil: false },
        regionSlug: null,
      },
      uncertaintyBands: context.uncertaintyBands,
      vatRates: context.vatRates,
      vatEligibility: baseVatEligibility,
      serviceTypeVatReducedEligible: context.serviceTypeVatReducedEligible,
    });
  }

  const matrix: RangeMatrixEntry[] = [];
  const tableRows: { systemLabel: string; levelLabel: string; min: number; max: number }[] = [];

  for (const systemType of SYSTEM_TYPES) {
    if (systemType.slug === "conductos") {
      const result = evaluate(systemType.slug, "media");
      matrix.push({
        systemTypeSlug: systemType.slug,
        systemTypeLabel: systemType.label,
        materialLevelSlug: null,
        materialLevelLabel: null,
        min: result.total.min,
        max: result.total.max,
      });
      tableRows.push({ systemLabel: systemType.label, levelLabel: "—", min: result.total.min, max: result.total.max });
      continue;
    }
    for (const level of materialLevels) {
      const result = evaluate(systemType.slug, level.slug);
      matrix.push({
        systemTypeSlug: systemType.slug,
        systemTypeLabel: systemType.label,
        materialLevelSlug: level.slug,
        materialLevelLabel: level.name,
        min: result.total.min,
        max: result.total.max,
      });
      tableRows.push({ systemLabel: systemType.label, levelLabel: level.name, min: result.total.min, max: result.total.max });
    }
  }

  return (
    <Container className="max-w-3xl py-12">
      <PageViewTracker />
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Precio medio: instalación de aire acondicionado" }]} />

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
        Precio medio de instalar aire acondicionado en España
      </h1>
      <p className="mt-4 text-lg text-neutral-700">
        Rango orientativo por tipo de sistema y gama del equipo, calculado con el mismo motor que la calculadora
        completa — no son cifras fijas de un artículo, sino el resultado en vivo de los datos citados en{" "}
        <a href="/fuentes" className="font-semibold text-brand-700 hover:underline">
          fuentes
        </a>
        .
      </p>

      <div className="mt-8">
        <QuickRangeLookup matrix={matrix} />
      </div>

      <div className="mt-16 space-y-16">
        <section>
          <h2 className="text-xl font-bold text-neutral-950">Tabla completa por tipo y gama</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500">
                  <th className="py-2 pr-4 font-semibold">Sistema</th>
                  <th className="py-2 pr-4 font-semibold">Gama</th>
                  <th className="py-2 font-semibold">Rango (IVA incluido)</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={`${row.systemLabel}-${row.levelLabel}`} className="border-b border-neutral-100">
                    <td className="py-2 pr-4 text-neutral-950">{row.systemLabel}</td>
                    <td className="py-2 pr-4 text-neutral-700">{row.levelLabel}</td>
                    <td className="py-2 font-semibold tabular-nums text-neutral-950">
                      {formatEUR(row.min)} – {formatEUR(row.max)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm text-neutral-500">
            Caso base: sin metros de línea adicionales ni retirada de equipo, resto de España. Tu caso concreto puede
            variar — usa la calculadora completa para un rango ajustado a tu situación.
          </p>
        </section>

        <VariablesList
          items={[
            "Tipo de sistema y número de unidades interiores.",
            "Gama del equipo (económica, media o premium).",
            "Metros de línea frigorífica más allá de los incluidos en la instalación base.",
            "Si hay que retirar un equipo antiguo.",
            "Comunidad autónoma (ajuste real solo en Madrid y Cataluña).",
            "Tipo de IVA aplicable (10% o 21%).",
          ]}
        />

        <TipsList
          items={[
            "Usa el desglose de la calculadora completa para ver qué parte del precio es equipo y qué parte es mano de obra.",
            "Si vas a comparar varios presupuestos, hazlo con el analizador para ver la diferencia frente al rango, no solo entre ellos.",
          ]}
        />

        <MistakesList
          items={[
            "Comparar el precio de un split con el de un multisplit como si fueran el mismo producto.",
            "Ignorar que la gama del equipo puede duplicar el precio de la parte de equipo por sí sola.",
          ]}
        />

        <FAQSection items={FAQ_ITEMS} />

        <RelatedLinks
          items={[
            { href: "/aire-acondicionado/instalacion", label: "Calculadora completa", description: "Ajustada a tu caso exacto." },
            { href: "/aire-acondicionado/instalacion/analizar-presupuesto", label: "Analizar un presupuesto ya recibido" },
            { href: "/comparativas/split-vs-conductos", label: "Split vs. conductos: qué sistema conviene" },
          ]}
        />

        <SourcesNote />
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Precio medio de instalar aire acondicionado en España",
          url: absoluteUrl("/precios/aire-acondicionado-instalacion"),
          author: ARTICLE_AUTHOR,
          datePublished: "2026-09-12",
          dateModified: "2026-09-12",
          inLanguage: "es-ES",
        }}
      />
    </Container>
  );
}
