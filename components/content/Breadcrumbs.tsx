import Link from "next/link";
import { JsonLd } from "./JsonLd";
import { absoluteUrl } from "@/lib/site";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** Migas de pan visibles + BreadcrumbList — un único componente para no repetir el schema a mano en cada página. */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-500 print:hidden">
        {items.map((item, i) => (
          <span key={item.label}>
            {item.href ? (
              <Link href={item.href} className="hover:text-brand-700">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
            {i < items.length - 1 && " / "}
          </span>
        ))}
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.label,
            item: item.href ? absoluteUrl(item.href) : undefined,
          })),
        }}
      />
    </>
  );
}
