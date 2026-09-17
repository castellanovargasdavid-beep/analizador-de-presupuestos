import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = {
  robots: { index: false, follow: false },
};

/**
 * Todo /admin/** es dinámico a propósito: son páginas autenticadas con
 * datos que cambian en tiempo real, nunca deben quedar prerenderizadas ni
 * cacheadas como estáticas. Sin esto, una página que no usa ninguna API
 * dinámica de Next (p. ej. `/admin/automatizaciones`, sin `searchParams`)
 * se prerenderiza en build time — lo que además de servir datos
 * desactualizados, hace que `next build` consulte la base de datos de
 * producción durante el propio build y falle si una tabla nueva todavía
 * no existe ahí (como pasó aquí con `automation_runs` antes de aplicar la
 * migración 0009).
 */
export const dynamic = "force-dynamic";

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
