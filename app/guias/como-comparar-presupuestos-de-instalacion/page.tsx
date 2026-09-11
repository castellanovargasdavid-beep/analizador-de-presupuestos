import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Cómo comparar presupuestos de instalación sin equivocarte",
  description:
    "Qué exigir a cada presupuesto de instalación para poder compararlos de verdad, y las señales de alerta más habituales.",
};

export default function GuiaCompararPresupuestos() {
  return (
    <Container className="max-w-2xl py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
        <Link href="/" className="hover:text-brand-700">
          Inicio
        </Link>{" "}
        /{" "}
        <Link href="/guias" className="hover:text-brand-700">
          Guías
        </Link>{" "}
        / Comparar presupuestos
      </nav>

      <h1 className="mt-3 text-3xl font-bold text-neutral-950">
        Cómo comparar presupuestos de instalación sin equivocarte
      </h1>

      <div className="prose-neutral mt-6 space-y-5 text-neutral-700">
        <p>
          El presupuesto más barato y el más caro suelen dejar de serlo en cuanto describen exactamente el mismo
          trabajo. Antes de comparar el número final, asegúrate de que todos los presupuestos midan lo mismo.
        </p>

        <h2 className="text-xl font-bold text-neutral-950">Exige lo mismo a todos los presupuestos</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Desglose por partidas, con mano de obra y material separados.</li>
          <li>Marca y modelo exacto del equipo, no solo &ldquo;aire acondicionado gama media&rdquo;.</li>
          <li>Metros de línea frigorífica incluidos, y precio del metro adicional.</li>
          <li>Si incluye retirada del equipo antiguo y certificado/boletín de la instalación.</li>
          <li>Plazo de ejecución y condiciones de pago por escrito.</li>
        </ul>

        <h2 className="text-xl font-bold text-neutral-950">Señales de alerta</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Partidas agrupadas en una sola línea (&ldquo;instalación completa&rdquo;) sin desglose.</li>
          <li>Descripciones vagas (&ldquo;primera marca&rdquo;, &ldquo;calidad estándar&rdquo;).</li>
          <li>Anticipos grandes (más del 30-50%) sin justificar con compras concretas.</li>
          <li>Ninguna mención a certificado, boletín o garantía de la instalación (no solo del equipo).</li>
        </ul>

        <h2 className="text-xl font-bold text-neutral-950">No decidas solo por el precio</h2>
        <p>
          Dos presupuestos con el mismo total pero condiciones de pago o garantías distintas no son equivalentes. Un
          precio más bajo que omite la retirada del equipo antiguo o el certificado puede acabar costando más.
        </p>
      </div>

      <div className="mt-10">
        <LinkButton href="/aire-acondicionado/instalacion/analizar-presupuesto">
          Analiza tu presupuesto de aire acondicionado
        </LinkButton>
      </div>
    </Container>
  );
}
