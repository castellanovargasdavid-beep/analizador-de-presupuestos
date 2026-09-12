import { db } from "@/db/client";
import { regions } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/admin/DataTable";
import { RegionForm } from "@/components/admin/RegionForm";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminRegionesPage() {
  const rows = await db.select().from(regions).orderBy(regions.name);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Regiones</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Comunidades autónomas. Un factor de precio puede condicionarse a una región concreta (ver Reglas de precio).
      </p>

      <div className="mt-6">
        <DataTable columns={["Nombre", "Slug", "Editar"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-medium text-neutral-950">{r.name}</td>
              <td className="px-4 py-3 text-neutral-500">{r.slug}</td>
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">Editar</summary>
                  <div className="mt-3 max-w-md">
                    <RegionForm initial={r} />
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <Card className="mt-6 max-w-md">
        <h2 className="font-bold text-neutral-950">Añadir región</h2>
        <div className="mt-3">
          <RegionForm />
        </div>
      </Card>
    </div>
  );
}
