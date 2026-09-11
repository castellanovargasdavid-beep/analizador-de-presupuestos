import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = { title: "Aviso legal", robots: { index: true, follow: true } };

export default function AvisoLegalPage() {
  return (
    <Container className="max-w-2xl py-12 text-neutral-700">
      <h1 className="text-3xl font-bold text-neutral-950">Aviso legal</h1>
      <div className="prose-neutral mt-6 space-y-4">
        <p>
          <strong>Borrador pendiente de revisión legal.</strong> Este texto es un marcador de posición para la fase
          de construcción del producto y debe ser sustituido por asesoría legal real antes de cualquier lanzamiento
          público, especialmente en lo relativo a RGPD/LOPDGDD y a la naturaleza no vinculante de las estimaciones.
        </p>
        <p>
          Presupuesto Claro ofrece estimaciones orientativas de precio para servicios del hogar en España, calculadas
          mediante un motor de reglas cuya metodología es pública. Estas estimaciones no constituyen una tasación
          profesional, un peritaje ni un presupuesto vinculante, y no deben usarse como única base para decisiones
          económicas relevantes.
        </p>
      </div>
    </Container>
  );
}
