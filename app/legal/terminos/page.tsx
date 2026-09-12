import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Términos de uso",
  description:
    "Condiciones de uso de Presupuesto Claro: qué es el servicio, qué no es, y qué puedes esperar al usar la calculadora o solicitar presupuestos.",
  path: "/legal/terminos",
  robots: { index: true, follow: true },
});

export default function TerminosPage() {
  return (
    <Container className="max-w-2xl py-12 text-neutral-700">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Términos de uso" }]} />
      <h1 className="mt-3 text-3xl font-bold text-neutral-950">Términos de uso</h1>

      <div className="prose-neutral mt-6 space-y-6">
        <p>
          <strong>Borrador pendiente de revisión legal formal.</strong> Describe honestamente cómo funciona el
          servicio hoy; antes de cualquier lanzamiento público debe revisarlo un profesional del derecho.
        </p>

        <section>
          <h2 className="font-bold text-neutral-950">Qué es este servicio</h2>
          <p className="mt-2">
            Presupuesto Claro es una herramienta gratuita que calcula un rango de precio orientativo para servicios
            del hogar (hoy, instalación de aire acondicionado) y permite comparar un presupuesto real recibido contra
            ese rango. No requiere registro ni creación de cuenta para usarse. El detalle de cómo se calcula cada
            rango está en{" "}
            <Link href="/metodologia" className="font-semibold text-brand-700 hover:underline">
              metodología
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-bold text-neutral-950">Qué no es</h2>
          <p className="mt-2">
            No es una tasación profesional, un peritaje, ni un presupuesto vinculante de ningún proveedor. No
            garantiza que un instalador vaya a cobrar dentro del rango mostrado, ni certifica que un presupuesto
            fuera de rango sea incorrecto o fraudulento. Ver el detalle de esta limitación en el{" "}
            <Link href="/legal/aviso-legal" className="font-semibold text-brand-700 hover:underline">
              aviso legal
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-bold text-neutral-950">Uso aceptable</h2>
          <p className="mt-2">
            Puedes usar la calculadora y el comparador de presupuestos libremente para tu uso personal. No está
            permitido intentar sobrecargar el servicio de forma automatizada (scraping masivo, envío repetido de
            formularios, o cualquier uso que persiga interferir con su funcionamiento normal para otros usuarios).
          </p>
        </section>

        <section>
          <h2 className="font-bold text-neutral-950">Solicitud de presupuestos a profesionales</h2>
          <p className="mt-2">
            Si rellenas el formulario de solicitud de presupuestos, aceptas expresamente el texto de consentimiento
            mostrado en ese momento — ver{" "}
            <Link href="/legal/privacidad" className="font-semibold text-brand-700 hover:underline">
              privacidad
            </Link>{" "}
            para qué datos se guardan y con qué finalidad. Esa solicitud no crea ninguna obligación de contratación
            entre tú y ningún profesional.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-neutral-950">Disponibilidad y cambios</h2>
          <p className="mt-2">
            Es un proyecto en fase temprana: los rangos de precio, las categorías disponibles y el propio servicio
            pueden cambiar, ampliarse o interrumpirse temporalmente sin aviso previo. Intentamos que cualquier
            interrupción sea breve, pero no podemos garantizar una disponibilidad continua.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-neutral-950">Propiedad del contenido</h2>
          <p className="mt-2">
            Los textos, la metodología y el diseño de este sitio pertenecen a Presupuesto Claro. Puedes enlazar
            libremente a cualquier página; no está permitido reproducir el contenido de forma sustancial en otro
            sitio sin permiso.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-neutral-950">Contacto</h2>
          <p className="mt-2">
            Cualquier duda sobre estos términos, escríbenos desde{" "}
            <Link href="/contacto" className="font-semibold text-brand-700 hover:underline">
              la página de contacto
            </Link>
            .
          </p>
        </section>
      </div>
    </Container>
  );
}
