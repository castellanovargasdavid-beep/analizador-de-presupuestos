import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ConfidenceTag } from "@/components/result/ConfidenceTag";
import { UMBRAL_RITE_KW } from "@/lib/pricing/data";

export const metadata: Metadata = {
  title: "Metodología: cómo calculamos los precios",
  description:
    "Cómo se calcula cada rango de precio de la calculadora de aire acondicionado: fuentes, nivel de confianza y limitaciones. Sin autoridad inventada.",
};

export default function MetodologiaPage() {
  return (
    <Container className="max-w-3xl py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
        <Link href="/" className="hover:text-brand-700">
          Inicio
        </Link>{" "}
        / Metodología
      </nav>

      <h1 className="mt-3 text-3xl font-bold text-neutral-950">¿Cómo calculamos estos precios?</h1>
      <p className="mt-4 text-lg text-neutral-700">
        No somos tasadores ni peritos. Esto es una estimación orientativa construida con datos que existen hoy —
        y donde no hay un dato fiable, lo decimos, en vez de inventarlo.
      </p>

      <Card className="mt-8">
        <h2 className="font-bold text-neutral-950">Los tres niveles de confianza</h2>
        <p className="mt-2 text-neutral-700">
          Cada cifra de la calculadora lleva una letra que indica de dónde sale:
        </p>
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-3">
            <ConfidenceTag confidence="A" />
            <p className="text-neutral-700">
              <strong>Fuente verificable.</strong> Normativa oficial (por ejemplo, el umbral de {UMBRAL_RITE_KW} kW del
              RITE) o un precio de catálogo real de un actor de mercado (por ejemplo, las tarifas publicadas por un
              instalador/retailer).
            </p>
          </div>
          <div className="flex items-start gap-3">
            <ConfidenceTag confidence="B" />
            <p className="text-neutral-700">
              <strong>Fuente de mercado.</strong> Agregadores y estudios de precio que no publican metodología ni
              tamaño de muestra. Los usamos como rango de contraste, nunca como única fuente.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <ConfidenceTag confidence="C" />
            <p className="text-neutral-700">
              <strong>Heurística propia.</strong> Una extrapolación o regla de sector ampliamente usada, sin un
              estudio que la respalde directamente (por ejemplo, escalar el precio de un split de una unidad a uno
              de tres). Lo marcamos así explícitamente.
            </p>
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="font-bold text-neutral-950">Variables que sí usamos</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-700">
          <li>Tipo de sistema (split de 1, 2 o 3 unidades interiores, o por conductos).</li>
          <li>Potencia del equipo.</li>
          <li>Metros de línea frigorífica más allá de los incluidos en la instalación base.</li>
          <li>Necesidad de retirar un equipo antiguo (y si se reutiliza o se desecha).</li>
          <li>Instalación eléctrica dedicada, canaleta vista y bomba de condensados, cuando aplican.</li>
          <li>Gama del equipo (económica, media o premium).</li>
          <li>Zona (Madrid/Cataluña frente al resto de España), como ajuste amplio y explícitamente incierto.</li>
        </ul>
      </Card>

      <Card className="mt-6">
        <h2 className="font-bold text-neutral-950">Variables que NO usamos todavía, y por qué</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-700">
          <li>
            <strong>Marca específica del fabricante:</strong> no existe una lista de precios por marca con fuente
            fiable; usamos &ldquo;gama&rdquo; en su lugar.
          </li>
          <li>
            <strong>Estacionalidad/urgencia:</strong> no hemos encontrado datos concretos para España; preferimos no
            incluirlo antes que inventar un recargo.
          </li>
          <li>
            <strong>Precio por provincia o ciudad:</strong> la señal disponible es débil (solo unas pocas ciudades, sin
            metodología pública); de momento solo diferenciamos Madrid/Cataluña frente al resto, y de forma amplia.
          </li>
          <li>
            <strong>Dificultad de acceso como número preciso:</strong> existe la señal cualitativa de que encarece la
            instalación, pero no hay consenso numérico; lo mostramos como rango ancho, no como un cálculo fino.
          </li>
        </ul>
      </Card>

      <Card className="mt-6">
        <h2 className="font-bold text-neutral-950">Lo que esto NO es</h2>
        <p className="mt-2 text-neutral-700">
          No es una tasación profesional, no tiene validez legal ni pericial, y no sustituye el criterio de un
          profesional que vea tu instalación en persona. Es una referencia para que tengas un rango razonable antes
          de pedir o aceptar un presupuesto — nada más, nada menos.
        </p>
      </Card>
    </Container>
  );
}
