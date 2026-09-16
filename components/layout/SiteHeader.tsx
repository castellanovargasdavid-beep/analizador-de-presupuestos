import Link from "next/link";
import { Container } from "../ui/Container";
import { ShieldIcon } from "../ui/icons";

const NAV_LINKS = [
  { href: "/servicios", label: "Servicios" },
  { href: "/aire-acondicionado", label: "Aire acondicionado" },
  { href: "/guias", label: "Guías" },
  { href: "/metodologia", label: "Metodología" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200 bg-white print:hidden">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-brand-900">
          <ShieldIcon className="size-6 text-brand-600" />
          <span>Presupuesto Claro</span>
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-6 text-sm font-medium text-neutral-700 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand-700">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/aire-acondicionado/instalacion"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Calcular ahora
          </Link>
          {/* Menú móvil sin JS: <details> nativo, solo visible por debajo de `sm`
              (donde la nav de arriba se oculta) para que "Guías"/"Metodología"
              sigan siendo alcanzables sin bajar hasta el footer. */}
          <details className="relative sm:hidden">
            <summary
              aria-label="Abrir menú"
              className="flex size-9 cursor-pointer list-none items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 marker:content-none"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="size-5" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M3 5.5A.75.75 0 013.75 4.75h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 5.5Zm0 4.5A.75.75 0 013.75 9.25h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 9.75Zm.75 3.75a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H3.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </summary>
            <nav
              aria-label="Principal (móvil)"
              className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-neutral-200 bg-white py-2 shadow-lg"
            >
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="block px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-brand-50">
                  {link.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </Container>
    </header>
  );
}
