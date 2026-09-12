import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Aviso legal",
  description:
    "Naturaleza no vinculante de las estimaciones de Presupuesto Claro: no son una tasación profesional ni un presupuesto con validez legal.",
  path: "/legal/aviso-legal",
  robots: { index: true, follow: true },
});

export default function AvisoLegalPage() {
  return (
    <Container className="max-w-2xl py-12 text-neutral-700">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Aviso legal" }]} />
      <h1 className="mt-3 text-3xl font-bold text-neutral-950">Aviso legal</h1>
      <div className="prose-neutral mt-6 space-y-6">
        <p>
          <strong>Borrador pendiente de revisión legal formal.</strong> Este texto es un marcador de posición para la
          fase de construcción del producto y debe ser sustituido por asesoría legal real antes de cualquier
          lanzamiento público, especialmente en lo relativo a RGPD/LOPDGDD y a la naturaleza no vinculante de las
          estimaciones.
        </p>

        <section>
          <h2 className="font-bold text-neutral-950">Naturaleza del servicio</h2>
          <p className="mt-2">
            Presupuesto Claro ofrece estimaciones orientativas de precio para servicios del hogar en España,
            calculadas mediante un motor de reglas cuya metodología es pública. Estas estimaciones no constituyen una
            tasación profesional, un peritaje ni un presupuesto vinculante de ningún proveedor, y no deben usarse
            como única base para decisiones económicas relevantes. Ver el detalle completo en{" "}
            <Link href="/metodologia" className="font-semibold text-brand-700 hover:underline">
              metodología
            </Link>{" "}
            y sus limitaciones.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-neutral-950">Límite de responsabilidad</h2>
          <p className="mt-2">
            No respondemos por decisiones económicas tomadas únicamente a partir del rango mostrado, ni por
            diferencias entre ese rango y el precio real de un trabajo concreto: cada instalación tiene
            particularidades que un formulario no puede capturar por completo. Un presupuesto por encima o por debajo
            del rango no implica, por sí mismo, ninguna irregularidad por parte de quien lo emite.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-neutral-950">Documentos relacionados</h2>
          <p className="mt-2">
            Las condiciones completas de uso del servicio están en{" "}
            <Link href="/legal/terminos" className="font-semibold text-brand-700 hover:underline">
              términos de uso
            </Link>
            , y el tratamiento de datos personales en{" "}
            <Link href="/legal/privacidad" className="font-semibold text-brand-700 hover:underline">
              privacidad
            </Link>
            . Para cualquier consulta,{" "}
            <Link href="/contacto" className="font-semibold text-brand-700 hover:underline">
              contacta con nosotros
            </Link>
            .
          </p>
        </section>
      </div>
    </Container>
  );
}
