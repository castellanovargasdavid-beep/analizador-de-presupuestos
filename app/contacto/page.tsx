import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Contacto",
  description: "Cómo contactar con Presupuesto Claro: dudas, corrección de datos o errores en la calculadora.",
  path: "/contacto",
});

const CONTACT_EMAIL = "hola@presupuestoclaro.es";

export default function ContactoPage() {
  return (
    <Container className="max-w-2xl py-12">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Contacto" }]} />
      <h1 className="mt-3 text-3xl font-bold text-neutral-950">Contacto</h1>
      <p className="mt-4 text-neutral-700">
        Si crees que un dato o una fuente está mal, si encuentras un error en la calculadora, o simplemente tienes una
        pregunta, escríbenos.
      </p>

      <Card className="mt-8">
        <p className="text-sm font-semibold text-neutral-500">Correo</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="mt-1 block text-lg font-semibold text-brand-700 hover:underline">
          {CONTACT_EMAIL}
        </a>
        <p className="mt-4 text-sm text-neutral-500">
          Al ser un proyecto en fase temprana, no ofrecemos soporte telefónico ni chat en directo todavía.
        </p>
      </Card>

      <div className="mt-8">
        <RelatedLinks
          items={[
            { href: "/sobre-nosotros", label: "Sobre nosotros" },
            { href: "/fuentes", label: "Fuentes de los datos" },
          ]}
        />
      </div>
    </Container>
  );
}
