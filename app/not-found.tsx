import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <Container className="max-w-xl py-24 text-center">
      <p className="text-sm font-semibold text-brand-600">Error 404</p>
      <h1 className="mt-2 text-2xl font-bold text-neutral-950">No hemos encontrado esta página</h1>
      <p className="mt-2 text-neutral-700">
        Puede deberse a alguno de estos motivos: el enlace está mal escrito, el resultado o la comparación ya no
        existen, o el servicio que buscas todavía no está disponible — hoy solo cubrimos instalación de aire
        acondicionado, el resto de categorías del hogar están en construcción.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <LinkButton href="/aire-acondicionado/instalacion">Ir a la calculadora</LinkButton>
        <LinkButton href="/" variant="secondary">
          Ver todo lo disponible
        </LinkButton>
      </div>
    </Container>
  );
}
