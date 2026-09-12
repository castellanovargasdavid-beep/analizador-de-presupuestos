import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { provinces, regions } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/admin/DataTable";
import { ProvinceForm } from "@/components/admin/ProvinceForm";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminProvinciasPage() {
  const [rows, regionOptions] = await Promise.all([
    db
      .select({ province: provinces, regionName: regions.name })
      .from(provinces)
      .innerJoin(regions, eq(provinces.regionId, regions.id))
      .orderBy(provinces.name),
    db.select({ id: regions.id, name: regions.name }).from(regions).orderBy(regions.name),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Provincias</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Hoy no hay ningún factor de precio a nivel de provincia — la jerarquía existe para cuando haga falta.
      </p>

      <div className="mt-6">
        {rows.length === 0 ? (
          <Card>
            <p className="text-sm text-neutral-500">Todavía no hay ninguna provincia registrada.</p>
          </Card>
        ) : (
          <DataTable columns={["Nombre", "Región", "Slug", "Editar"]}>
            {rows.map(({ province, regionName }) => (
              <tr key={province.id}>
                <td className="px-4 py-3 font-medium text-neutral-950">{province.name}</td>
                <td className="px-4 py-3 text-neutral-600">{regionName}</td>
                <td className="px-4 py-3 text-neutral-500">{province.slug}</td>
                <td className="px-4 py-3">
                  <details>
                    <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">Editar</summary>
                    <div className="mt-3 max-w-md">
                      <ProvinceForm initial={province} regions={regionOptions} />
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>

      <Card className="mt-6 max-w-md">
        <h2 className="font-bold text-neutral-950">Añadir provincia</h2>
        <div className="mt-3">
          <ProvinceForm regions={regionOptions} />
        </div>
      </Card>
    </div>
  );
}
