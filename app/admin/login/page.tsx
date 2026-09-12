import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = {
  title: "Acceso admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <Container className="max-w-sm py-24">
      <Card>
        <h1 className="text-xl font-bold text-neutral-950">Panel de administración</h1>
        <p className="mt-1 text-sm text-neutral-600">Presupuesto Claro</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </Card>
    </Container>
  );
}
