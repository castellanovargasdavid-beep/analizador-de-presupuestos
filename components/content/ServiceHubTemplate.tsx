import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs, type BreadcrumbItem } from "./Breadcrumbs";

export interface ServiceHubEntry {
  href?: string;
  label: string;
  description: string;
  /** false = "próximamente", se muestra pero sin enlace activo (nunca se indexa una página vacía). */
  available: boolean;
}

/**
 * Plantilla "Servicios": página hub de una categoría (p. ej. Aire
 * acondicionado, y en el futuro Reformas, Electricidad...). Reutilizable
 * porque cada vertical nueva añade un hub con la misma estructura: título,
 * intro y una rejilla de subservicios, cada uno enlazado solo si ya existe
 * de verdad.
 */
export function ServiceHubTemplate({
  breadcrumbs,
  title,
  intro,
  entries,
}: {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  intro: string;
  entries: ServiceHubEntry[];
}) {
  return (
    <Container className="max-w-3xl py-16">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="mt-3 text-3xl font-bold text-neutral-950">{title}</h1>
      <p className="mt-3 text-neutral-700">{intro}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {entries.map((entry) =>
          entry.available && entry.href ? (
            <Link key={entry.label} href={entry.href} className="block">
              <Card className="h-full transition-colors hover:border-brand-400">
                <h2 className="font-bold text-neutral-950">{entry.label}</h2>
                <p className="mt-1 text-sm text-neutral-700">{entry.description}</p>
              </Card>
            </Link>
          ) : (
            <div key={entry.label} className="rounded-2xl border border-dashed border-neutral-200 p-6 text-neutral-400">
              <h2 className="font-bold">{entry.label}</h2>
              <p className="mt-1 text-sm">Próximamente.</p>
            </div>
          ),
        )}
      </div>
    </Container>
  );
}
