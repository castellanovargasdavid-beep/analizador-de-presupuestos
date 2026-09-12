import { db } from "@/db/client";
import { serviceCategories } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminCategoriasPage() {
  const rows = await db.select().from(serviceCategories).orderBy(serviceCategories.name);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Categorías</h1>
      <p className="mt-1 text-sm text-neutral-600">
        La categoría de nivel superior (p. ej. &ldquo;Aire acondicionado&rdquo;). Cada categoría agrupa uno o más servicios.
      </p>

      <div className="mt-6">
        <DataTable columns={["Nombre", "Slug", "Estado", "Editar"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-medium text-neutral-950">{r.name}</td>
              <td className="px-4 py-3 text-neutral-500">{r.slug}</td>
              <td className="px-4 py-3">
                <Badge tone={r.isActive ? "good" : "neutral"}>{r.isActive ? "Activa" : "Inactiva"}</Badge>
              </td>
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">Editar</summary>
                  <div className="mt-3 max-w-md">
                    <CategoryForm initial={r} />
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <Card className="mt-6 max-w-md">
        <h2 className="font-bold text-neutral-950">Añadir categoría</h2>
        <div className="mt-3">
          <CategoryForm />
        </div>
      </Card>
    </div>
  );
}
