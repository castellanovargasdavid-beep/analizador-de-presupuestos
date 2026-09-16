import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { professions, serviceCategories, serviceTypes } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { ServiceForm } from "@/components/admin/ServiceForm";

export const metadata = { robots: { index: false, follow: false } };

const AVAILABILITY_TONE: Record<string, "good" | "info" | "neutral"> = {
  disponible: "good",
  solo_solicitud: "info",
  proximamente: "neutral",
};

export default async function AdminServiciosPage() {
  const [rows, categories, professionRows] = await Promise.all([
    db
      .select({ service: serviceTypes, categoryName: serviceCategories.name, professionName: professions.name })
      .from(serviceTypes)
      .innerJoin(serviceCategories, eq(serviceTypes.categoryId, serviceCategories.id))
      .leftJoin(professions, eq(serviceTypes.professionId, professions.id))
      .orderBy(serviceTypes.name),
    db.select({ id: serviceCategories.id, name: serviceCategories.name }).from(serviceCategories).orderBy(serviceCategories.name),
    db.select({ id: professions.id, name: professions.name }).from(professions).orderBy(professions.name),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Servicios</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Cada servicio (p. ej. &ldquo;Instalación&rdquo;) pertenece a una categoría y, opcionalmente, a una profesión
        del catálogo. Solo los servicios &ldquo;disponibles&rdquo; tienen calculadora funcional.
      </p>

      <div className="mt-6">
        <DataTable columns={["Nombre", "Categoría", "Profesión", "Disponibilidad", "Estado", "Editar"]}>
          {rows.map(({ service, categoryName, professionName }) => (
            <tr key={service.id}>
              <td className="px-4 py-3 font-medium text-neutral-950">{service.name}</td>
              <td className="px-4 py-3 text-neutral-600">{categoryName}</td>
              <td className="px-4 py-3 text-neutral-600">{professionName ?? "—"}</td>
              <td className="px-4 py-3">
                <Badge tone={AVAILABILITY_TONE[service.availabilityStatus] ?? "neutral"}>{service.availabilityStatus}</Badge>
              </td>
              <td className="px-4 py-3">
                <Badge tone={service.isActive ? "good" : "neutral"}>{service.isActive ? "Activo" : "Inactivo"}</Badge>
              </td>
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">Editar</summary>
                  <div className="mt-3 max-w-md">
                    <ServiceForm initial={service} categories={categories} professions={professionRows} />
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
          <ServiceForm categories={categories} professions={professionRows} />
        </div>
      </Card>
    </div>
  );
}
