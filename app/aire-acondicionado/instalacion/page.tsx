import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Wizard } from "@/components/calculator/Wizard";
import { RITE_UMBRAL_KW } from "@/lib/estimation/seed-data";
import { listMaterialLevels, listRegions } from "@/lib/estimation/repository";

export const metadata: Metadata = {
  title: "Precio de instalar aire acondicionado: calculadora orientativa",
  description:
    "Calcula el rango de precio razonable para instalar aire acondicionado en España según tipo de sistema, potencia, ubicación y calidad del equipo. Metodología transparente, sin registro.",
};

// Regiones y niveles de material cambian poco; se revalida cada hora en vez
// de exigir un redeploy completo para reflejar cambios en el seed.
export const revalidate = 3600;

export default async function InstalacionPage() {
  const [regions, materialLevels] = await Promise.all([listRegions(), listMaterialLevels()]);
  return (
    <Container className="max-w-3xl py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
        <Link href="/" className="hover:text-brand-700">
          Inicio
        </Link>{" "}
        /{" "}
        <Link href="/aire-acondicionado" className="hover:text-brand-700">
          Aire acondicionado
        </Link>{" "}
        / Instalación
      </nav>

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

      <section className="mt-16 space-y-6 text-neutral-700">
        <h2 className="text-xl font-bold text-neutral-950">Qué tenemos en cuenta y por qué</h2>
        <p>
          El precio de una instalación de aire acondicionado no depende solo del equipo: la potencia, el número de
          unidades interiores, los metros de línea frigorífica, si hay que retirar un equipo antiguo y la calidad del
          equipo elegido mueven el presupuesto de forma real y documentable. Por eso el formulario te lo pregunta,
          en vez de darte un único número genérico.
        </p>
        <p>
          Un dato normativo que casi nunca se menciona: si la potencia nominal supera los {RITE_UMBRAL_KW} kW, el
          RITE exige memoria técnica y registro del certificado ante tu Comunidad Autónoma. Es un trámite real que
          puede formar parte del presupuesto — nuestra calculadora te avisa si tu caso lo necesita.
        </p>
        <p>
          Todas las cifras usadas indican de dónde salen y con qué nivel de confianza. Puedes ver el detalle completo
          en la <Link href="/metodologia" className="font-semibold text-brand-700 hover:underline">metodología</Link>.
        </p>
      </section>
    </Container>
  );
}
