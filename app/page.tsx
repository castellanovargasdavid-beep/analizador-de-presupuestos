import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { RangeBar } from "@/components/result/RangeBar";
import { FAQSection } from "@/components/content/FAQSection";
import { ArrowRightIcon, CatalogIcon, CheckCircleIcon, ShieldIcon } from "@/components/ui/icons";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { pageMetadata } from "@/lib/metadata";
import { loadPricingContext } from "@/lib/estimation/repository";
import { evaluateEstimate } from "@/lib/estimation/engine";
import { listFaqsForPage } from "@/lib/content/repository";
import { listCatalogTree } from "@/lib/catalog/repository";

export const metadata = pageMetadata({
  title: "Presupuesto Claro — ¿Te están cobrando de más?",
  description:
    "Calcula el rango de precio razonable para un servicio del hogar y comprueba si tu presupuesto está dentro de lo habitual. Empieza por aire acondicionado.",
  path: "/",
  isHome: true,
});

export const revalidate = 3600;

const PASOS = [
  {
    titulo: "Describe el trabajo",
    texto: "Tipo de sistema, potencia, ubicación y otros factores que mueven el precio.",
  },
  {
    titulo: "Obtén un rango, no un número mágico",
    texto: "Una estimación orientativa con el desglose por partidas y la fuente de cada dato.",
  },
  {
    titulo: "Compara tu presupuesto real",
    texto: "Si ya tienes un presupuesto, introdúcelo y te decimos si está dentro de lo esperado.",
  },
];

export default async function HomePage() {
  const [context, faqs, categories] = await Promise.all([
    loadPricingContext("aire-acondicionado", "instalacion"),
    listFaqsForPage("home"),
    listCatalogTree(),
  ]);
  const baseVatEligibility = { clientePersonaFisicaUsoParticular: true, viviendaMasDeDosAnos: true };

  function evaluate(overrides: {
    systemType: string;
    metrosLineaFrigorificaExtra: number;
    retiradaEquipo: "no" | "desechar" | "reutilizar";
  }) {
    return evaluateEstimate({
      factors: context.factors,
      input: {
        selections: { systemType: overrides.systemType, materialLevel: "media", retiradaEquipo: overrides.retiradaEquipo },
        quantities: {
          metrosLineaFrigorificaExtra: overrides.metrosLineaFrigorificaExtra,
          canaletaVistaMetros: 0,
          potenciaKw: 3.5,
        },
        flags: { necesitaBombaCondensados: false, instalacionElectricaDedicada: false, accesoDificil: false },
        regionSlug: null,
      },
      uncertaintyBands: context.uncertaintyBands,
      vatRates: context.vatRates,
      vatEligibility: baseVatEligibility,
      serviceTypeVatReducedEligible: context.serviceTypeVatReducedEligible,
    });
  }

  const ejemploEstandar = evaluate({ systemType: "split-1x1", metrosLineaFrigorificaExtra: 0, retiradaEquipo: "no" });
  const ejemploMultisplit = evaluate({ systemType: "split-2x1", metrosLineaFrigorificaExtra: 2, retiradaEquipo: "desechar" });

  const EJEMPLOS = [
    {
      titulo: "Split 1x1, gama media, instalación estándar",
      rango: ejemploEstandar.total,
      detalle: "3,5 kW · 3 m de línea incluidos · sin retirada de equipo antiguo",
    },
    {
      titulo: "Multisplit 2x1, gama media, con retirada de equipo",
      rango: ejemploMultisplit.total,
      detalle: "2 unidades interiores · retirada de equipo antiguo · 2 m de línea adicional",
    },
  ];

  return (
    <>
      <PageViewTracker />
      <section className="border-b border-neutral-200 bg-gradient-to-b from-brand-50 to-white">
        <Container className="max-w-5xl py-16 text-center sm:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-800">
            <ShieldIcon className="size-4" />
            Estimaciones con metodología transparente
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
            ¿Te están cobrando de más por la instalación de tu aire acondicionado?
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-700">
            Calcula el rango de precio razonable en menos de 2 minutos y compara tu presupuesto real contra él.
            Sin registro. Sin tasación falsa. Con la fuente de cada dato a la vista.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkButton href="/aire-acondicionado/instalacion" size="lg">
              Calcular mi estimación <ArrowRightIcon />
            </LinkButton>
            <LinkButton href="/aire-acondicionado/instalacion/analizar-presupuesto" size="lg" variant="secondary">
              Ya tengo un presupuesto, analízalo
            </LinkButton>
          </div>
        </Container>
      </section>

      {/* Ejemplos */}
      <section className="py-16">
        <Container>
          <h2 className="text-center text-2xl font-bold text-neutral-950">Así se ve una estimación</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-neutral-700">
            Dos casos habituales, calculados en vivo con el mismo motor que usa la calculadora completa.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {EJEMPLOS.map((ej) => (
              <Card key={ej.titulo}>
                <p className="text-sm font-semibold text-neutral-500">Ejemplo calculado en vivo</p>
                <h3 className="mt-1 font-bold text-neutral-950">{ej.titulo}</h3>
                <p className="mt-1 text-sm text-neutral-500">{ej.detalle}</p>
                <div className="mt-6">
                  <RangeBar rangeMin={ej.rango.min} rangeMax={ej.rango.max} />
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Categorías */}
      <section className="bg-white py-16">
        <Container>
          <h2 className="text-center text-2xl font-bold text-neutral-950">Elige qué quieres comprobar</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-neutral-700">
            Empezamos por aire acondicionado. El resto de categorías ya están en el catálogo, con calculadora o sin
            ella según cuánta información fiable tenemos todavía.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {categories.map((cat) => {
              const hasDisponible = cat.professions.some((p) => p.services.some((s) => s.availabilityStatus === "disponible"));
              return (
                <Link key={cat.id} href={`/servicios/${cat.slug}`} className="block">
                  <div
                    className={`h-full rounded-xl border p-5 font-semibold transition-colors ${
                      hasDisponible
                        ? "border-neutral-200 bg-white text-neutral-950 hover:border-brand-400 hover:bg-brand-50"
                        : "border-dashed border-neutral-200 text-neutral-500 hover:border-brand-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CatalogIcon iconKey={cat.iconKey} className="size-5 text-brand-700" />
                      {cat.name}
                    </div>
                    <span className={`mt-1 block text-sm font-normal ${hasDisponible ? "text-brand-600" : ""}`}>
                      {hasDisponible ? "Calculadora disponible →" : "Próximamente →"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <LinkButton href="/servicios" variant="secondary">
              Ver el catálogo completo <ArrowRightIcon />
            </LinkButton>
          </div>
        </Container>
      </section>

      {/* Cómo funciona */}
      <section className="py-16">
        <Container>
          <h2 className="text-center text-2xl font-bold text-neutral-950">Cómo funciona</h2>
          <ol className="mt-10 grid list-none gap-8 sm:grid-cols-3">
            {PASOS.map((p, i) => (
              <li key={p.titulo}>
                <div className="flex size-9 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-bold text-neutral-950">{p.titulo}</h3>
                <p className="mt-1 text-sm text-neutral-700">{p.texto}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Confianza */}
      <section className="bg-brand-950 py-16 text-white">
        <Container>
          <h2 className="text-center text-2xl font-bold">Por qué puedes confiar en el rango</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {[
              "Cada dato indica su fuente: normativa oficial, precio de catálogo real o rango de mercado — nunca lo presentamos como un hecho si no lo es.",
              "Nunca decimos que un presupuesto es 'incorrecto'. Mostramos un rango y posibles razones de la diferencia.",
              "No vendemos tu presupuesto a nadie por usar la calculadora. No hay registro obligatorio.",
              "La metodología completa es pública: puedes revisar exactamente cómo se calcula cada cifra.",
            ].map((t) => (
              <div key={t} className="flex items-start gap-3">
                <CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-brand-300" />
                <p className="text-brand-100">{t}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <LinkButton href="/metodologia" variant="secondary" className="!bg-transparent !text-white !border-white/30 hover:!bg-white/10">
              Leer la metodología completa
            </LinkButton>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <Container className="max-w-3xl">
          <FAQSection title="Preguntas frecuentes" items={faqs} />
        </Container>
      </section>

      {/* CTA final */}
      <section className="border-t border-neutral-200 py-16">
        <Container className="text-center">
          <h2 className="text-2xl font-bold text-neutral-950">
            Antes de firmar, comprueba si el precio tiene sentido
          </h2>
          <div className="mt-6">
            <LinkButton href="/aire-acondicionado/instalacion" size="lg">
              Empezar ahora, es gratis <ArrowRightIcon />
            </LinkButton>
          </div>
        </Container>
      </section>
    </>
  );
}
