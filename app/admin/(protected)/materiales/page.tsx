import { db } from "@/db/client";
import { materialLevels } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/admin/DataTable";
import { MaterialLevelForm } from "@/components/admin/MaterialLevelForm";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminMaterialesPage() {
  const rows = await db.select().from(materialLevels).orderBy(materialLevels.sortOrder);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Materiales</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Niveles de gama (económica, media, premium...) usados por la calculadora y compartidos entre servicios.
      </p>

      <div className="mt-6">
        <DataTable columns={["Orden", "Nombre", "Slug", "Editar"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 text-neutral-500">{r.sortOrder}</td>
              <td className="px-4 py-3 font-medium text-neutral-950">{r.name}</td>
              <td className="px-4 py-3 text-neutral-500">{r.slug}</td>
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">Editar</summary>
                  <div className="mt-3 max-w-md">
                    <MaterialLevelForm initial={r} />
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <Card className="mt-6 max-w-md">
        <h2 className="font-bold text-neutral-950">Añadir nivel de material</h2>
        <div className="mt-3">
          <MaterialLevelForm />
        </div>
      </Card>
    </div>
  );
}
