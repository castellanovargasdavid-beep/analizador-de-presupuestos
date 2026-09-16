"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { CatalogIcon, SearchIcon } from "@/components/ui/icons";
import { ServiceStatusBadge } from "./ServiceStatusBadge";
import type { CatalogCategorySummary } from "@/lib/catalog/repository";

/**
 * Buscador + navegación del catálogo completo. Recibe el árbol ya
 * cargado desde el servidor (Server Component) y filtra en el cliente —
 * el volumen (decenas de servicios, no miles) no justifica una búsqueda
 * en servidor.
 */
export function CatalogBrowser({ categories }: { categories: CatalogCategorySummary[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;

    return categories
      .map((cat) => ({
        ...cat,
        professions: cat.professions
          .map((prof) => ({
            ...prof,
            services: prof.services.filter(
              (s) => s.name.toLowerCase().includes(q) || prof.name.toLowerCase().includes(q),
            ),
          }))
          .filter((prof) => prof.name.toLowerCase().includes(q) || prof.services.length > 0),
      }))
      .filter((cat) => cat.name.toLowerCase().includes(q) || cat.professions.length > 0);
  }, [categories, query]);

  return (
    <div>
      <label className="relative block max-w-md">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar un servicio (p. ej. 'fontanero', 'pintar'...)"
          className="w-full rounded-lg border border-neutral-200 py-2.5 pl-10 pr-3 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      {filtered.length === 0 && (
        <p className="mt-6 text-sm text-neutral-500">Ningún servicio coincide con &ldquo;{query}&rdquo;.</p>
      )}

      <div className="mt-8 space-y-10">
        {filtered.map((cat) => (
          <section key={cat.id}>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <CatalogIcon iconKey={cat.iconKey} className="size-5" />
              </span>
              <div>
                <h2 className="font-bold text-neutral-950">
                  <Link href={`/servicios/${cat.slug}`} className="hover:underline">
                    {cat.name}
                  </Link>
                </h2>
                {cat.description && <p className="text-sm text-neutral-500">{cat.description}</p>}
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cat.professions.flatMap((prof) =>
                prof.services.length > 0
                  ? prof.services.map((service) => (
                      <Link key={service.id} href={`/profesiones/${prof.slug}`} className="block">
                        <Card className="h-full transition-colors hover:border-brand-400">
                          <p className="text-xs font-semibold text-neutral-500">{prof.name}</p>
                          <h3 className="mt-1 font-bold text-neutral-950">{service.name}</h3>
                          <div className="mt-3">
                            <ServiceStatusBadge status={service.availabilityStatus} />
                          </div>
                        </Card>
                      </Link>
                    ))
                  : [
                      <Link key={prof.id} href={`/profesiones/${prof.slug}`} className="block">
                        <Card className="h-full transition-colors hover:border-brand-400">
                          <h3 className="font-bold text-neutral-950">{prof.name}</h3>
                          {prof.description && <p className="mt-1 text-sm text-neutral-600">{prof.description}</p>}
                        </Card>
                      </Link>,
                    ],
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
