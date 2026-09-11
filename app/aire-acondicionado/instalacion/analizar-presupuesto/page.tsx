import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Wizard } from "@/components/calculator/Wizard";

export const metadata: Metadata = {
  title: "¿Es caro tu presupuesto de aire acondicionado? Compáralo",
  description:
    "Introduce el presupuesto que te han dado para instalar aire acondicionado y comprueba si está dentro del rango habitual, por encima o por debajo, con posibles razones y preguntas recomendadas.",
};

export default function AnalizarPresupuestoPage() {
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
        /{" "}
        <Link href="/aire-acondicionado/instalacion" className="hover:text-brand-700">
          Instalación
        </Link>{" "}
        / Analizar presupuesto
      </nav>

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
        <Wizard mode="analizador" />
      </div>

      <section className="mt-16 space-y-4 text-neutral-700">
        <h2 className="text-xl font-bold text-neutral-950">Señales de alerta habituales en un presupuesto</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Partidas agrupadas en una sola línea (&ldquo;instalación aire acondicionado&rdquo;) sin desglose.</li>
          <li>Descripciones vagas del equipo (&ldquo;primera marca&rdquo;, &ldquo;gama media&rdquo;) sin marca ni modelo.</li>
          <li>Ausencia de certificado o boletín de la instalación.</li>
          <li>Anticipos elevados sin justificar con compras concretas de material.</li>
        </ul>
        <p>
          Compáralo también con nuestra{" "}
          <Link href="/guias/como-comparar-presupuestos-de-instalacion" className="font-semibold text-brand-700 hover:underline">
            guía para comparar presupuestos
          </Link>
          .
        </p>
      </section>
    </Container>
  );
}
