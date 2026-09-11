import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = { title: "Privacidad", robots: { index: true, follow: true } };

export default function PrivacidadPage() {
  return (
    <Container className="max-w-2xl py-12 text-neutral-700">
      <h1 className="text-3xl font-bold text-neutral-950">Privacidad</h1>
      <div className="prose-neutral mt-6 space-y-4">
        <p>
          <strong>Borrador pendiente de revisión legal (RGPD/LOPDGDD).</strong> Debe completarse antes del
          lanzamiento con el detalle real de tratamiento de datos una vez se implemente la capa de persistencia
          (Fase 3 del roadmap).
        </p>
        <p>
          En la versión actual, la calculadora y el analizador de presupuestos no requieren registro ni recogen
          datos personales para funcionar: el resultado se codifica en la propia URL que genera tu navegador, no se
          guarda en ningún servidor.
        </p>
      </div>
    </Container>
  );
}
