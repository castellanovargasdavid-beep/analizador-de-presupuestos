import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { cities, provinces } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/admin/DataTable";
import { CityForm } from "@/components/admin/CityForm";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminCiudadesPage() {
  const [rows, provinceOptions] = await Promise.all([
    db
      .select({ city: cities, provinceName: provinces.name })
      .from(cities)
      .innerJoin(provinces, eq(cities.provinceId, provinces.id))
      .orderBy(cities.name),
    db.select({ id: provinces.id, name: provinces.name }).from(provinces).orderBy(provinces.name),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Ciudades</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Nivel más fino de la jerarquía geográfica. Hace falta al menos una provincia antes de poder añadir una ciudad.
      </p>

      <div className="mt-6">
        {provinceOptions.length === 0 ? (
          <Card>
            <p className="text-sm text-neutral-500">
              Añade primero una provincia en <a href="/admin/provincias" className="font-semibold text-brand-700 hover:underline">Provincias</a>.
            </p>
          </Card>
        ) : rows.length === 0 ? (
          <Card>
            <p className="text-sm text-neutral-500">Todavía no hay ninguna ciudad registrada.</p>
          </Card>
        ) : (
          <DataTable columns={["Nombre", "Provincia", "Slug", "Editar"]}>
            {rows.map(({ city, provinceName }) => (
              <tr key={city.id}>
                <td className="px-4 py-3 font-medium text-neutral-950">{city.name}</td>
                <td className="px-4 py-3 text-neutral-600">{provinceName}</td>
                <td className="px-4 py-3 text-neutral-500">{city.slug}</td>
                <td className="px-4 py-3">
                  <details>
                    <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">Editar</summary>
                    <div className="mt-3 max-w-md">
                      <CityForm initial={city} provinces={provinceOptions} />
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>

      {provinceOptions.length > 0 && (
        <Card className="mt-6 max-w-md">
          <h2 className="font-bold text-neutral-950">Añadir ciudad</h2>
          <div className="mt-3">
            <CityForm provinces={provinceOptions} />
          </div>
        </Card>
      )}
    </div>
  );
}
