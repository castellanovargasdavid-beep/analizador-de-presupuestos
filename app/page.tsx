import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { RangeBar } from "@/components/result/RangeBar";
import { ArrowRightIcon, CheckCircleIcon, ShieldIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Presupuesto Claro — ¿Te están cobrando de más?",
  description:
    "Calcula el rango de precio razonable para servicios del hogar en España y comprueba si el presupuesto que te han dado está dentro de lo habitual. Empieza por instalación de aire acondicionado.",
  alternates: { canonical: "/" },
};

const EJEMPLOS = [
  {
    titulo: "Split 1x1, gama media, instalación estándar",
    rango: { min: 780, max: 1180 },
    detalle: "3,5 kW · 3 m de línea incluidos · sin retirada de equipo antiguo",
  },
  {
    titulo: "Multisplit 2x1, gama media, con retirada de equipo",
    rango: { min: 1750, max: 2600 },
    detalle: "2 unidades interiores · retirada de equipo antiguo · 2 m de línea adicional",
  },
];

const CATEGORIAS = [
  { nombre: "Aire acondicionado", href: "/aire-acondicionado", activo: true },
  { nombre: "Reforma de baño", activo: false },
  { nombre: "Reforma de cocina", activo: false },
  { nombre: "Ventanas", activo: false },
  { nombre: "Electricidad", activo: false },
  { nombre: "Fontanería", activo: false },
];

const FAQS = [
  {
    pregunta: "¿Esto es una tasación oficial?",
    respuesta:
      "No. Es una estimación orientativa basada en rangos de mercado y, cuando existen, en normativa oficial. No sustituye un peritaje ni una tasación profesional, y no tiene validez legal.",
  },
  {
    pregunta: "¿De dónde salen los rangos de precio?",
    respuesta:
      "De una combinación de normativa oficial (RITE), precios de catálogo reales de instaladores y agregadores de mercado. Cada cifra de la calculadora indica su nivel de confianza. Todo el detalle está en la página de metodología.",
  },
  {
    pregunta: "Si mi presupuesto está por encima del rango, ¿significa que me están engañando?",
    respuesta:
      "No necesariamente. Puede haber diferencias por la gama del equipo, dificultad de acceso, materiales o garantías incluidas que nuestro formulario no ha capturado. Por eso mostramos posibles razones y preguntas recomendadas, nunca una acusación.",
  },
  {
    pregunta: "¿Tengo que registrarme para usar la herramienta?",
    respuesta: "No. Puedes calcular y comparar tu presupuesto sin crear ninguna cuenta.",
  },
];

export default function HomePage() {
  return (
    <>
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
            Dos ejemplos ilustrativos con casos habituales de instalación de aire acondicionado.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {EJEMPLOS.map((ej) => (
              <Card key={ej.titulo}>
                <p className="text-sm font-semibold text-neutral-500">Ejemplo ilustrativo</p>
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
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {CATEGORIAS.map((cat) =>
              cat.activo && cat.href ? (
                <Link
                  key={cat.nombre}
                  href={cat.href}
                  className="rounded-xl border border-neutral-200 bg-white p-5 font-semibold text-neutral-950 transition-colors hover:border-brand-400 hover:bg-brand-50"
                >
                  {cat.nombre}
                  <span className="mt-1 block text-sm font-normal text-brand-600">Disponible ahora →</span>
                </Link>
              ) : (
                <div
                  key={cat.nombre}
                  className="rounded-xl border border-dashed border-neutral-200 p-5 font-semibold text-neutral-400"
                >
                  {cat.nombre}
                  <span className="mt-1 block text-sm font-normal">Próximamente</span>
                </div>
              ),
            )}
          </div>
        </Container>
      </section>

      {/* Cómo funciona */}
      <section className="py-16">
        <Container>
          <h2 className="text-center text-2xl font-bold text-neutral-950">Cómo funciona</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                paso: "1",
                titulo: "Describe el trabajo",
                texto: "Tipo de sistema, potencia, ubicación y otros factores que mueven el precio.",
              },
              {
                paso: "2",
                titulo: "Obtén un rango, no un número mágico",
                texto: "Una estimación orientativa con el desglose por partidas y la fuente de cada dato.",
              },
              {
                paso: "3",
                titulo: "Compara tu presupuesto real",
                texto: "Si ya tienes un presupuesto, introdúcelo y te decimos si está dentro de lo esperado.",
              },
            ].map((p) => (
              <div key={p.paso}>
                <div className="flex size-9 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                  {p.paso}
                </div>
                <h3 className="mt-4 font-bold text-neutral-950">{p.titulo}</h3>
                <p className="mt-1 text-sm text-neutral-700">{p.texto}</p>
              </div>
            ))}
          </div>
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
          <h2 className="text-center text-2xl font-bold text-neutral-950">Preguntas frecuentes</h2>
          <div className="mt-8 divide-y divide-neutral-200">
            {FAQS.map((f) => (
              <details key={f.pregunta} className="group py-4">
                <summary className="cursor-pointer list-none font-semibold text-neutral-950 marker:content-none">
                  {f.pregunta}
                </summary>
                <p className="mt-2 text-neutral-700">{f.respuesta}</p>
              </details>
            ))}
          </div>
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
