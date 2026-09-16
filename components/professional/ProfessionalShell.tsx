import Link from "next/link";
import { professionalLogoutAction } from "@/lib/professional/actions";

export function ProfessionalShell({ children, professionalName }: { children: React.ReactNode; professionalName: string }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="border-b border-neutral-200 bg-brand-950 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 font-bold">
            <span className="rounded bg-brand-600 px-2 py-0.5 text-xs uppercase tracking-wide">Profesional</span>
            <span>{professionalName}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/profesional" className="text-brand-200 hover:text-white">
              Mis solicitudes
            </Link>
            <Link href="/profesional/disponibilidad" className="text-brand-200 hover:text-white">
              Disponibilidad
            </Link>
            <form action={professionalLogoutAction}>
              <button type="submit" className="text-brand-200 hover:text-white hover:underline">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
    </div>
  );
}
