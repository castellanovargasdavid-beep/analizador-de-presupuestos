import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { dataSources, pricingFactors, pricingRules, regions, serviceTypes } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { DataTable } from "@/components/admin/DataTable";
import { PricingFactorForm } from "@/components/admin/PricingFactorForm";
import { PricingRuleQualityForm } from "@/components/admin/PricingRuleQualityForm";
import { ValidationSampleForm } from "@/components/admin/ValidationSampleForm";
import { ConfidenceGateCard } from "@/components/admin/ConfidenceGateCard";
import { getRuleConfidenceReport, listValidationSamples } from "@/lib/quality/repository";

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

  const [factors, sources, allRegions, confidenceReport, samples] = await Promise.all([
    db.select().from(pricingFactors).where(eq(pricingFactors.ruleId, ruleId)).orderBy(pricingFactors.sortOrder),
    db.select({ id: dataSources.id, name: dataSources.name }).from(dataSources).where(eq(dataSources.isActive, true)).orderBy(dataSources.name),
    db.select({ id: regions.id, name: regions.name }).from(regions).orderBy(regions.name),
    getRuleConfidenceReport(ruleId),
    listValidationSamples(rule.rule.serviceTypeId),
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

      {confidenceReport && (
        <div className="mt-6">
          <ConfidenceGateCard report={confidenceReport} />
        </div>
      )}

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

      <Card className="mt-6 max-w-xl">
        <h2 className="font-bold text-neutral-950">Metodología y revisión</h2>
        <div className="mt-3">
          <PricingRuleQualityForm
            initial={{
              ruleId,
              methodologyDocPath: rule.rule.methodologyDocPath,
              geographicScope: rule.rule.geographicScope,
              reviewedBy: rule.rule.reviewedBy,
              lastReviewedAt: rule.rule.lastReviewedAt,
              nextReviewDueAt: rule.rule.nextReviewDueAt,
              knownIssues: rule.rule.knownIssues,
            }}
          />
        </div>
      </Card>

      <div className="mt-6">
        <h2 className="font-bold text-neutral-950">Muestras de validación ({samples.length})</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Presupuestos reales anonimizados de este servicio, de cualquier versión de la regla — ver
          docs/PRICE-VALIDATION-PROTOCOL.md.
        </p>
        {samples.length > 0 && (
          <div className="mt-3">
            <DataTable columns={["Fecha", "Origen", "Precio real", "Estimate asociada", "Imprevistos"]}>
              {samples.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 text-neutral-600">{s.quoteDate.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {s.source === "lead_cerrado" ? "Lead cerrado" : "Aportado a mano"}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-950">{s.finalPriceWithVat} €</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {s.relatedEstimateId ? <Badge tone="good">Sí, comparable</Badge> : <Badge tone="neutral">Sin Estimate</Badge>}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{s.hadUnexpectedIssues ? "Sí" : "No"}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}
        <Card className="mt-4 max-w-xl">
          <h3 className="font-bold text-neutral-950">Registrar un presupuesto real</h3>
          <div className="mt-3">
            <ValidationSampleForm serviceTypeId={rule.rule.serviceTypeId} regions={allRegions} />
          </div>
        </Card>
      </div>
    </div>
  );
}
