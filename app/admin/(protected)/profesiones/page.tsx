import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { professions, serviceCategories } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { CatalogProfessionForm } from "@/components/admin/CatalogProfessionForm";

export const metadata = { robots: { index: false, follow: false } };

const STATUS_TONE: Record<string, "good" | "neutral"> = { publicado: "good", borrador: "neutral", archivado: "neutral" };

/**
 * Profesiones del catálogo público (categoría → profesión → servicio).
 * No confundir con "Profesionales" (menú Negocio): esas son personas
 * reales que se asignan a un lead, esto es taxonomía de contenido/SEO.
 */
export default async function AdminProfesionesCatalogoPage() {
  const [rows, categories] = await Promise.all([
    db
      .select({ profession: professions, categoryName: serviceCategories.name })
      .from(professions)
      .innerJoin(serviceCategories, eq(professions.categoryId, serviceCategories.id))
      .orderBy(professions.name),
    db.select({ id: serviceCategories.id, name: serviceCategories.name }).from(serviceCategories).orderBy(serviceCategories.name),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Profesiones (catálogo)</h1>
      <p className="mt-1 text-sm text-neutral-600">
        La capa de catalogación entre categoría y servicio (p. ej. &ldquo;Fontanero&rdquo; bajo
        &ldquo;Instalaciones&rdquo;). Solo las profesiones &ldquo;publicadas&rdquo; tienen página pública en
        /profesiones.
      </p>

      <div className="mt-6">
        <DataTable columns={["Nombre", "Categoría", "Slug", "Estado", "Editar"]}>
          {rows.map(({ profession, categoryName }) => (
            <tr key={profession.id}>
              <td className="px-4 py-3 font-medium text-neutral-950">{profession.name}</td>
              <td className="px-4 py-3 text-neutral-600">{categoryName}</td>
              <td className="px-4 py-3 text-neutral-500">{profession.slug}</td>
              <td className="px-4 py-3">
                <Badge tone={STATUS_TONE[profession.status] ?? "neutral"}>{profession.status}</Badge>
              </td>
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">Editar</summary>
                  <div className="mt-3 max-w-md">
                    <CatalogProfessionForm initial={profession} categories={categories} />
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </DataTable>
        {rows.length === 0 && <p className="mt-4 text-sm text-neutral-500">Todavía no hay ninguna profesión.</p>}
      </div>

      <Card className="mt-6 max-w-md">
        <h2 className="font-bold text-neutral-950">Añadir profesión</h2>
        <div className="mt-3">
          <CatalogProfessionForm categories={categories} />
        </div>
      </Card>
    </div>
  );
}
