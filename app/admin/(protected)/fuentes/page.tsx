import { db } from "@/db/client";
import { dataSources } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { DataSourceForm } from "@/components/admin/DataSourceForm";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminFuentesPage() {
  const rows = await db.select().from(dataSources).orderBy(dataSources.confidence, dataSources.name);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Fuentes</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Cada factor de precio y cada tarifa de IVA cita una fuente de aquí. Se muestran también en /fuentes.
      </p>

      <div className="mt-6">
        <DataTable columns={["Nombre", "Tipo", "Confianza", "Verificada", "Estado", "Editar"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-medium text-neutral-950">{r.name}</td>
              <td className="px-4 py-3 text-neutral-600">{r.sourceType}</td>
              <td className="px-4 py-3">
                <Badge tone="neutral">{r.confidence}</Badge>
              </td>
              <td className="px-4 py-3 text-neutral-500">{r.retrievedOn}</td>
              <td className="px-4 py-3">
                <Badge tone={r.isActive ? "good" : "neutral"}>{r.isActive ? "Activa" : "Inactiva"}</Badge>
              </td>
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">Editar</summary>
                  <div className="mt-3 max-w-lg">
                    <DataSourceForm initial={r} />
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <Card className="mt-6 max-w-lg">
        <h2 className="font-bold text-neutral-950">Añadir fuente</h2>
        <div className="mt-3">
          <DataSourceForm />
        </div>
      </Card>
    </div>
  );
}
