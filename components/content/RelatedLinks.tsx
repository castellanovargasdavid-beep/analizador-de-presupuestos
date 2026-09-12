import Link from "next/link";

export interface RelatedLink {
  href: string;
  label: string;
  description?: string;
}

/**
 * Enlazado interno explícito y con criterio: solo enlaces que de verdad
 * tienen sentido desde esta página (nunca "todas las páginas entre sí").
 */
export function RelatedLinks({ items }: { items: RelatedLink[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="text-xl font-bold text-neutral-950">Enlaces relacionados</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="font-semibold text-brand-700 hover:underline">
              {item.label}
            </Link>
            {item.description && <span className="text-neutral-600"> — {item.description}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
