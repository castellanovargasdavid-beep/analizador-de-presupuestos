import Link from "next/link";
import { Container } from "../ui/Container";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-neutral-200 bg-white print:hidden">
      <Container className="grid gap-8 py-12 text-sm text-neutral-700 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-bold text-brand-900">Presupuesto Claro</p>
          <p className="mt-2 text-neutral-500">
            Estimaciones orientativas para el mercado español. No sustituye una tasación profesional.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-neutral-950">Herramienta</span>
          <Link href="/aire-acondicionado/instalacion" className="hover:text-brand-700">
            Calculadora de instalación A/C
          </Link>
          <Link href="/aire-acondicionado/instalacion/analizar-presupuesto" className="hover:text-brand-700">
            Analizador de presupuestos
          </Link>
          <Link href="/precios/aire-acondicionado-instalacion" className="hover:text-brand-700">
            Precio medio en España
          </Link>
          <Link href="/guias" className="hover:text-brand-700">
            Guías
          </Link>
          <Link href="/preguntas" className="hover:text-brand-700">
            Preguntas
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-neutral-950">Confianza</span>
          <Link href="/metodologia" className="hover:text-brand-700">
            Metodología
          </Link>
          <Link href="/fuentes" className="hover:text-brand-700">
            Fuentes
          </Link>
          <Link href="/sobre-nosotros" className="hover:text-brand-700">
            Sobre nosotros
          </Link>
          <Link href="/contacto" className="hover:text-brand-700">
            Contacto
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-neutral-950">Legal</span>
          <Link href="/legal/privacidad" className="hover:text-brand-700">
            Privacidad
          </Link>
          <Link href="/legal/cookies" className="hover:text-brand-700">
            Cookies
          </Link>
          <Link href="/legal/terminos" className="hover:text-brand-700">
            Términos de uso
          </Link>
          <Link href="/legal/aviso-legal" className="hover:text-brand-700">
            Aviso legal
          </Link>
        </div>
      </Container>
    </footer>
  );
}
