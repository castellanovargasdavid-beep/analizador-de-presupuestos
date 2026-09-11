import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = { title: "Cookies", robots: { index: true, follow: true } };

export default function CookiesPage() {
  return (
    <Container className="max-w-2xl py-12 text-neutral-700">
      <h1 className="text-3xl font-bold text-neutral-950">Cookies</h1>
      <div className="prose-neutral mt-6 space-y-4">
        <p>
          <strong>Borrador pendiente de revisión legal (LSSICE).</strong> La versión actual del sitio no utiliza
          cookies de analítica ni publicidad. Cuando se incorporen (Fase 10, analítica), se añadirá aquí el detalle
          real y el gestor de consentimiento correspondiente.
        </p>
      </div>
    </Container>
  );
}
