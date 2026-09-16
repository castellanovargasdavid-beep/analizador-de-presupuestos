import Link from "next/link";
import { logoutAction } from "@/lib/admin/actions";

const NAV_SECTIONS: { title: string; links: { href: string; label: string }[] }[] = [
  { title: "General", links: [{ href: "/admin", label: "Panel" }] },
  {
    title: "Catálogo",
    links: [
      { href: "/admin/categorias", label: "Categorías" },
      { href: "/admin/profesiones", label: "Profesiones (catálogo)" },
      { href: "/admin/servicios", label: "Servicios" },
      { href: "/admin/materiales", label: "Materiales" },
    ],
  },
  {
    title: "Geografía",
    links: [
      { href: "/admin/regiones", label: "Regiones" },
      { href: "/admin/provincias", label: "Provincias" },
      { href: "/admin/ciudades", label: "Ciudades" },
    ],
  },
  {
    title: "Precios",
    links: [
      { href: "/admin/fuentes", label: "Fuentes" },
      { href: "/admin/reglas-precio", label: "Reglas de precio" },
      { href: "/admin/iva", label: "IVA" },
      { href: "/admin/incertidumbre", label: "Incertidumbre" },
    ],
  },
  {
    title: "Contenido SEO",
    links: [
      { href: "/admin/guias", label: "Guías" },
      { href: "/admin/preguntas", label: "Preguntas" },
      { href: "/admin/faqs", label: "FAQs" },
    ],
  },
  {
    title: "Negocio",
    links: [
      { href: "/admin/leads", label: "Leads" },
      { href: "/admin/profesionales", label: "Profesionales (red de instaladores)" },
      { href: "/admin/estimaciones", label: "Explicar estimación" },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="border-b border-neutral-200 bg-brand-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 font-bold">
            <span className="rounded bg-brand-600 px-2 py-0.5 text-xs uppercase tracking-wide">Admin</span>
            <span>Presupuesto Claro</span>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-brand-200 hover:text-white hover:underline">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8">
        <nav aria-label="Admin" className="hidden w-52 shrink-0 space-y-6 sm:block">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">{section.title}</p>
              <ul className="mt-1 space-y-0.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block rounded-md px-2 py-1.5 text-sm font-medium text-neutral-700 hover:bg-white hover:text-brand-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
