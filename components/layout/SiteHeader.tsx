import Link from "next/link";
import { Container } from "../ui/Container";
import { ShieldIcon } from "../ui/icons";

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200 bg-white print:hidden">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-brand-900">
          <ShieldIcon className="size-6 text-brand-600" />
          <span>Presupuesto Claro</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-700 sm:flex">
          <Link href="/aire-acondicionado" className="hover:text-brand-700">
            Aire acondicionado
          </Link>
          <Link href="/guias" className="hover:text-brand-700">
            Guías
          </Link>
          <Link href="/metodologia" className="hover:text-brand-700">
            Metodología
          </Link>
        </nav>
        <Link
          href="/aire-acondicionado/instalacion"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Calcular ahora
        </Link>
      </Container>
    </header>
  );
}
