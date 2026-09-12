import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Privacidad",
  robots: { index: true, follow: true },
  alternates: { canonical: "/legal/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <Container className="max-w-2xl py-12 text-neutral-700">
      <h1 className="text-3xl font-bold text-neutral-950">Privacidad</h1>
      <div className="prose-neutral mt-6 space-y-6">
        <p>
          <strong>Borrador pendiente de revisión legal formal (RGPD/LOPDGDD).</strong> Describe honestamente qué
          datos tratamos hoy; antes del lanzamiento debe revisarlo un profesional del derecho.
        </p>

        <section>
          <h2 className="font-bold text-neutral-950">Cuando usas la calculadora o el comparador de presupuestos</h2>
          <p className="mt-2">
            No necesitas registrarte. Guardamos las respuestas que introduces y el resultado calculado en nuestra
            base de datos, identificado por un id aleatorio que forma parte de la URL de tu resultado (por ejemplo,
            <code className="mx-1 rounded bg-neutral-100 px-1.5 py-0.5 text-sm">/resultado/&lt;id&gt;</code>). No
            pedimos ni guardamos tu nombre, email o cualquier otro dato identificativo en este paso. Cualquiera con
            ese enlace puede ver el resultado, así que no lo compartas si has incluido información que prefieres
            mantener privada en la descripción del presupuesto.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-neutral-950">Cuando solicitas presupuestos a profesionales</h2>
          <p className="mt-2">
            Solo si rellenas voluntariamente el formulario &ldquo;Solicitar presupuestos&rdquo; te pedimos: nombre,
            email, teléfono (opcional) y una descripción adicional (opcional). Junto con el servicio, la ubicación y
            el presupuesto de tu estimación, estos datos se guardan para poder ponerte en contacto con profesionales
            que verifiquemos y que operen en tu zona y servicio. La base legal es tu consentimiento explícito, que
            registramos junto con la fecha y la versión concreta del texto que aceptaste.
          </p>
          <p className="mt-2">
            Mientras no exista una red de profesionales verificados con cobertura real en tu zona o servicio, tu
            solicitud se guarda pero no se comparte con nadie: no simulamos contactos ni presupuestos que no
            existen.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-neutral-950">Analítica propia, sin terceros</h2>
          <p className="mt-2">
            Medimos qué páginas se visitan y qué pasos de la calculadora se completan para saber qué contenido es
            realmente útil. Lo hacemos con un identificador de sesión aleatorio generado en tu navegador (ver{" "}
            <Link href="/legal/cookies" className="font-semibold text-brand-700 hover:underline">
              Cookies
            </Link>
            ) y no usamos Google Analytics, píxeles publicitarios ni ningún proveedor externo. Estos eventos no te
            identifican, salvo que además envíes un formulario de solicitud de presupuestos.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-neutral-950">Tus derechos</h2>
          <p className="mt-2">
            Puedes solicitar acceso, rectificación, supresión u oposición sobre cualquier dato que hayas enviado en
            un formulario de solicitud de presupuestos escribiéndonos desde{" "}
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
