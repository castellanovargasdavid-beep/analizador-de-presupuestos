import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { pricingRules, serviceTypes } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { PricingRuleForm } from "@/components/admin/PricingRuleForm";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminReglasPrecioPage() {
  const [rows, services] = await Promise.all([
    db
      .select({ rule: pricingRules, serviceName: serviceTypes.name })
      .from(pricingRules)
      .innerJoin(serviceTypes, eq(pricingRules.serviceTypeId, serviceTypes.id))
      .orderBy(serviceTypes.name, pricingRules.version),
    db.select({ id: serviceTypes.id, name: serviceTypes.name }).from(serviceTypes).orderBy(serviceTypes.name),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Reglas de precio</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Cada servicio calcula con la versión <strong>activa</strong> más alta. Una Estimate ya calculada siempre
        referencia la regla exacta con la que se calculó — cambiar los factores de una regla activa afecta a las
        estimaciones nuevas, nunca reescribe una ya guardada.
      </p>

      <div className="mt-6">
        <DataTable columns={["Servicio", "Versión", "Nombre", "Estado", "Factores", "Editar"]}>
          {rows.map(({ rule, serviceName }) => (
            <tr key={rule.id}>
              <td className="px-4 py-3 font-medium text-neutral-950">{serviceName}</td>
              <td className="px-4 py-3 text-neutral-600">v{rule.version}</td>
              <td className="px-4 py-3 text-neutral-600">{rule.name}</td>
              <td className="px-4 py-3">
                <Badge tone={rule.isActive ? "good" : "neutral"}>{rule.isActive ? "Activa" : "Inactiva"}</Badge>
              </td>
              <td className="px-4 py-3">
                <Link href={`/admin/reglas-precio/${rule.id}`} className="text-sm font-semibold text-brand-700 hover:underline">
                  Ver factores →
                </Link>
              </td>
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">Editar</summary>
                  <div className="mt-3 max-w-md">
                    <PricingRuleForm initial={rule} services={services} />
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <Card className="mt-6 max-w-md">
        <h2 className="font-bold text-neutral-950">Añadir regla (nueva versión)</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Para revisar precios sin afectar a nadie: crea la v2 como inactiva, añade sus factores, y actívala cuando
          esté lista (desactivando la v1 si no quieres que ambas convivan).
        </p>
        <div className="mt-3">
          <PricingRuleForm services={services} />
        </div>
      </Card>
    </div>
  );
}
