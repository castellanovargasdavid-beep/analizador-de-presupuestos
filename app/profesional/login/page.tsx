import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ProfessionalLoginForm } from "@/components/professional/ProfessionalLoginForm";

export const metadata = {
  title: "Acceso profesionales",
  robots: { index: false, follow: false },
};

export default function ProfessionalLoginPage() {
  return (
    <Container className="max-w-sm py-24">
      <Card>
        <h1 className="text-xl font-bold text-neutral-950">Portal de profesionales</h1>
        <p className="mt-1 text-sm text-neutral-600">Presupuesto Claro</p>
        <p className="mt-4 text-sm text-neutral-500">
          Si todavía no tienes acceso, contacta con Presupuesto Claro para que te lo activemos.
        </p>
        <div className="mt-6">
          <ProfessionalLoginForm />
        </div>
      </Card>
    </Container>
  );
}
