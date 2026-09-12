import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { RelatedLinks } from "@/components/content/RelatedLinks";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Sobre nosotros",
  description: "Qué es Presupuesto Claro, por qué existe y qué principios sigue: rangos honestos, nunca acusaciones, con la fuente de cada dato a la vista.",
  path: "/sobre-nosotros",
});

export default function SobreNosotrosPage() {
  return (
    <Container className="max-w-2xl py-12">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Sobre nosotros" }]} />
      <h1 className="mt-3 text-3xl font-bold text-neutral-950">Sobre nosotros</h1>

      <div className="mt-6 space-y-5 text-neutral-700">
        <p>
          Presupuesto Claro nace de una pregunta muy concreta: cuando a alguien le dan un presupuesto para instalar
          aire acondicionado, ¿cómo sabe si es razonable? La respuesta habitual — &ldquo;pide varios
          presupuestos&rdquo; — ayuda poco si no tienes ninguna referencia para juzgarlos.
        </p>
        <p>
          Es un proyecto independiente, en una fase temprana, centrado por ahora en un único servicio (instalación de
          aire acondicionado) mientras se valida que el enfoque funciona antes de ampliar a otros.
        </p>
      </div>

      <Card className="mt-8">
        <h2 className="font-bold text-neutral-950">Principios que seguimos</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-700">
          <li>Nunca presentamos un rango como un hecho verificado si no lo es — cada dato indica su fuente.</li>
          <li>Nunca acusamos a un profesional de cobrar de más: solo señalamos si algo está fuera de un rango.</li>
          <li>Preferimos un rango honesto y amplio a uno estrecho con una precisión que no tenemos.</li>
          <li>No es una tasación profesional ni sustituye el criterio de alguien que vea el trabajo en persona.</li>
        </ul>
      </Card>

      <div className="mt-8">
        <RelatedLinks
          items={[
            { href: "/metodologia", label: "Cómo calculamos los precios" },
            { href: "/fuentes", label: "Todas las fuentes citadas" },
            { href: "/contacto", label: "Contacto" },
          ]}
        />
      </div>
    </Container>
  );
}
