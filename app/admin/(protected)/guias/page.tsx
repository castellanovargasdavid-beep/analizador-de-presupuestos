import { db } from "@/db/client";
import { seoGuides } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { GuideForm } from "@/components/admin/GuideForm";
import { serializeGuideBody, serializeRelatedLinks } from "@/lib/content/body-text";
import type { GuideBlock, RelatedLinkEntry } from "@/lib/content/blocks";

export const metadata = { robots: { index: false, follow: false } };

const STATUS_TONE = { borrador: "neutral", publicado: "good", archivado: "warning" } as const;

export default async function AdminGuiasPage() {
  const rows = await db.select().from(seoGuides).orderBy(seoGuides.title);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Guías</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Páginas largas en /guias/[slug]. Solo las guías <strong>publicadas</strong> aparecen en el sitio y en el
        sitemap.
      </p>

      <div className="mt-6">
        <DataTable columns={["Título", "Slug", "Estado", "Versión", "Editar"]}>
          {rows.map((g) => (
            <tr key={g.id}>
              <td className="px-4 py-3 font-medium text-neutral-950">{g.title}</td>
              <td className="px-4 py-3 text-neutral-500">{g.slug}</td>
              <td className="px-4 py-3">
                <Badge tone={STATUS_TONE[g.status]}>{g.status}</Badge>
              </td>
              <td className="px-4 py-3 text-neutral-500">v{g.version}</td>
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">Editar</summary>
                  <div className="mt-3 max-w-2xl">
                    <GuideForm
                      initial={{
                        ...g,
                        bodyText: serializeGuideBody(g.body as GuideBlock[]),
                        relatedLinksText: serializeRelatedLinks(g.relatedLinks as RelatedLinkEntry[]),
                      }}
                    />
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <Card className="mt-6 max-w-2xl">
        <h2 className="font-bold text-neutral-950">Añadir guía</h2>
        <div className="mt-3">
          <GuideForm />
        </div>
      </Card>
    </div>
  );
}
