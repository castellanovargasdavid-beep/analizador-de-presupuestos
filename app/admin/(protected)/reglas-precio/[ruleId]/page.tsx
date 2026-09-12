import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { dataSources, pricingFactors, pricingRules, serviceTypes } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { DataTable } from "@/components/admin/DataTable";
import { PricingFactorForm } from "@/components/admin/PricingFactorForm";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminPricingFactorsPage({ params }: { params: Promise<{ ruleId: string }> }) {
  const { ruleId } = await params;

  const [rule] = await db
    .select({ rule: pricingRules, serviceName: serviceTypes.name })
    .from(pricingRules)
    .innerJoin(serviceTypes, eq(pricingRules.serviceTypeId, serviceTypes.id))
    .where(eq(pricingRules.id, ruleId))
    .limit(1);
  if (!rule) notFound();

  const [factors, sources] = await Promise.all([
    db.select().from(pricingFactors).where(eq(pricingFactors.ruleId, ruleId)).orderBy(pricingFactors.sortOrder),
    db.select({ id: dataSources.id, name: dataSources.name }).from(dataSources).where(eq(dataSources.isActive, true)).orderBy(dataSources.name),
  ]);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Reglas de precio", href: "/admin/reglas-precio" }, { label: `${rule.serviceName} v${rule.rule.version}` }]} />
      <h1 className="mt-2 text-2xl font-bold text-neutral-950">
        Factores — {rule.serviceName} v{rule.rule.version}
      </h1>
      <p className="mt-1 text-sm text-neutral-600">
        Cada fila es un factor que el motor combina para calcular el rango. La calculadora pública solo usa los
        factores <strong>activos</strong> de esta regla cuyas condiciones coincidan con el caso del usuario.
      </p>

      <div className="mt-6">
        <DataTable columns={["Orden", "Etiqueta", "Tipo", "Grupo", "Rango", "Confianza", "Estado", "Editar"]}>
          {factors.map((f) => (
            <tr key={f.id}>
              <td className="px-4 py-3 text-neutral-500">{f.sortOrder}</td>
              <td className="px-4 py-3 font-medium text-neutral-950">{f.label}</td>
              <td className="px-4 py-3 text-neutral-600">{f.kind}</td>
              <td className="px-4 py-3 text-neutral-600">{f.groupKey}</td>
              <td className="px-4 py-3 text-neutral-600">
                {f.valueMin} – {f.valueMax}
              </td>
              <td className="px-4 py-3">
                <Badge tone="neutral">{f.confidence}</Badge>
              </td>
              <td className="px-4 py-3">
                <Badge tone={f.isActive ? "good" : "neutral"}>{f.isActive ? "Activo" : "Inactivo"}</Badge>
              </td>
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">Editar</summary>
                  <div className="mt-3 max-w-xl">
                    <PricingFactorForm ruleId={ruleId} initial={f} sources={sources} />
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <Card className="mt-6 max-w-xl">
        <h2 className="font-bold text-neutral-950">Añadir factor</h2>
        <div className="mt-3">
          <PricingFactorForm ruleId={ruleId} sources={sources} />
        </div>
      </Card>
    </div>
  );
}
