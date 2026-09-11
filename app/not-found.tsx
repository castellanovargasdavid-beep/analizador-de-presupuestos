import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <Container className="max-w-xl py-24 text-center">
      <p className="text-sm font-semibold text-brand-600">Error 404</p>
      <h1 className="mt-2 text-2xl font-bold text-neutral-950">No hemos encontrado esta página</h1>
      <p className="mt-2 text-neutral-700">
        Puede que el enlace esté mal escrito o que el resultado ya no sea válido.
      </p>
      <div className="mt-6">
        <LinkButton href="/aire-acondicionado/instalacion">Ir a la calculadora</LinkButton>
      </div>
    </Container>
  );
}
