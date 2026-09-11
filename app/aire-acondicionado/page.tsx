import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Aire acondicionado: calculadora de precios e instalación",
  description:
    "Comprueba el rango de precio razonable para instalar o mantener aire acondicionado en España, con metodología transparente.",
};

export default function AireAcondicionadoHub() {
  return (
    <Container className="max-w-3xl py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
        <Link href="/" className="hover:text-brand-700">
          Inicio
        </Link>{" "}
        / Aire acondicionado
      </nav>
      <h1 className="mt-3 text-3xl font-bold text-neutral-950">Aire acondicionado</h1>
      <p className="mt-3 text-neutral-700">
        Herramientas para saber si el precio de tu aire acondicionado es razonable, antes o después de contratarlo.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/aire-acondicionado/instalacion" className="block">
          <Card className="h-full transition-colors hover:border-brand-400">
            <h2 className="font-bold text-neutral-950">Instalación</h2>
            <p className="mt-1 text-sm text-neutral-700">
              Calcula el rango orientativo de instalar un equipo nuevo, y compara tu presupuesto real.
            </p>
          </Card>
        </Link>
        <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-neutral-400">
          <h2 className="font-bold">Mantenimiento</h2>
          <p className="mt-1 text-sm">Próximamente.</p>
        </div>
      </div>
    </Container>
  );
}
