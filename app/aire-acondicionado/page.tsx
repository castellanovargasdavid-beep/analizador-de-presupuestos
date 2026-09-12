import { ServiceHubTemplate } from "@/components/content/ServiceHubTemplate";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Aire acondicionado: calculadora de precios e instalación",
  description:
    "Comprueba el rango de precio razonable para instalar aire acondicionado en España, con metodología transparente.",
  path: "/aire-acondicionado",
});

export default function AireAcondicionadoHub() {
  return (
    <ServiceHubTemplate
      breadcrumbs={[{ label: "Inicio", href: "/" }, { label: "Aire acondicionado" }]}
      title="Aire acondicionado"
      intro="Herramientas para saber si el precio de tu aire acondicionado es razonable, antes o después de contratarlo."
      entries={[
        {
          href: "/aire-acondicionado/instalacion",
          label: "Instalación",
          description: "Calcula el rango orientativo de instalar un equipo nuevo, y compara tu presupuesto real.",
          available: true,
        },
        { label: "Mantenimiento", description: "", available: false },
      ]}
    />
  );
}
