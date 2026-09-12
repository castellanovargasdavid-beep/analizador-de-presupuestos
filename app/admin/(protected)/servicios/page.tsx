import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { serviceCategories, serviceTypes } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { ServiceForm } from "@/components/admin/ServiceForm";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminServiciosPage() {
  const [rows, categories] = await Promise.all([
    db
      .select({ service: serviceTypes, categoryName: serviceCategories.name })
      .from(serviceTypes)
      .innerJoin(serviceCategories, eq(serviceTypes.categoryId, serviceCategories.id))
      .orderBy(serviceTypes.name),
    db.select({ id: serviceCategories.id, name: serviceCategories.name }).from(serviceCategories).orderBy(serviceCategories.name),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Servicios</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Cada servicio (p. ej. &ldquo;Instalación&rdquo;) pertenece a una categoría y tiene su propia regla de precio.
      </p>

      <div className="mt-6">
        <DataTable columns={["Nombre", "Categoría", "Slug", "Estado", "Editar"]}>
          {rows.map(({ service, categoryName }) => (
            <tr key={service.id}>
              <td className="px-4 py-3 font-medium text-neutral-950">{service.name}</td>
              <td className="px-4 py-3 text-neutral-600">{categoryName}</td>
              <td className="px-4 py-3 text-neutral-500">{service.slug}</td>
              <td className="px-4 py-3">
                <Badge tone={service.isActive ? "good" : "neutral"}>{service.isActive ? "Activo" : "Inactivo"}</Badge>
              </td>
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">Editar</summary>
                  <div className="mt-3 max-w-md">
                    <ServiceForm initial={service} categories={categories} />
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <Card className="mt-6 max-w-md">
        <h2 className="font-bold text-neutral-950">Añadir servicio</h2>
        <div className="mt-3">
          <ServiceForm categories={categories} />
        </div>
      </Card>
    </div>
  );
}
