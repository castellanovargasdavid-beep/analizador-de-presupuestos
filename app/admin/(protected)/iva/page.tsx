import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { dataSources, serviceTypes, vatRates } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { VatRateForm } from "@/components/admin/VatRateForm";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminIvaPage() {
  const [rows, services, sources] = await Promise.all([
    db
      .select({ vat: vatRates, serviceName: serviceTypes.name })
      .from(vatRates)
      .innerJoin(serviceTypes, eq(vatRates.serviceTypeId, serviceTypes.id))
      .orderBy(serviceTypes.name, vatRates.scenario),
    db.select({ id: serviceTypes.id, name: serviceTypes.name }).from(serviceTypes).orderBy(serviceTypes.name),
    db.select({ id: dataSources.id, name: dataSources.name }).from(dataSources).where(eq(dataSources.isActive, true)).orderBy(dataSources.name),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">IVA</h1>
      <p className="mt-1 text-sm text-neutral-600">
        La tarifa (el número) es un dato editable aquí; el test legal de elegibilidad (vivienda particular, +2 años,
        ≤40% materiales) vive en código porque es una norma, no un precio de mercado — ver metodología.
      </p>

      <div className="mt-6">
        <DataTable columns={["Servicio", "Escenario", "Tipo", "Estado", "Editar"]}>
          {rows.map(({ vat, serviceName }) => (
            <tr key={vat.id}>
              <td className="px-4 py-3 font-medium text-neutral-950">{serviceName}</td>
              <td className="px-4 py-3 text-neutral-600">{vat.scenario}</td>
              <td className="px-4 py-3 text-neutral-600">{Math.round(vat.ratePct * 100)}%</td>
              <td className="px-4 py-3">
                <Badge tone={vat.isActive ? "good" : "neutral"}>{vat.isActive ? "Activa" : "Inactiva"}</Badge>
              </td>
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">Editar</summary>
                  <div className="mt-3 max-w-lg">
                    <VatRateForm initial={vat} services={services} sources={sources} />
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <Card className="mt-6 max-w-lg">
        <h2 className="font-bold text-neutral-950">Añadir tarifa</h2>
        <div className="mt-3">
          <VatRateForm services={services} sources={sources} />
        </div>
      </Card>
    </div>
  );
}
