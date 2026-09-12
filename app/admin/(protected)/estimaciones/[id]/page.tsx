import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { DataTable } from "@/components/admin/DataTable";
import { getEstimateExplanation } from "@/lib/admin/explain";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminEstimacionExplicacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getEstimateExplanation(id);
  if (!data) notFound();

  const { estimate, rule, serviceType, region, province, materialLevel, items, ranges, vatRate, vatSource, appliedBand } = data;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Explicar estimación", href: "/admin/estimaciones" }, { label: estimate.id.slice(0, 8) }]} />
      <h1 className="mt-2 text-2xl font-bold text-neutral-950">Por qué esta estimación dio este rango</h1>
      <p className="mt-1 font-mono text-xs text-neutral-500">{estimate.id}</p>

      <Card className="mt-6">
        <h2 className="font-bold text-neutral-950">Contexto</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold text-neutral-500">Servicio</dt>
            <dd className="text-neutral-900">{serviceType?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-neutral-500">Regla de precio</dt>
            <dd className="text-neutral-900">
              {rule ? `${rule.name} (v${rule.version}${rule.isActive ? "" : ", inactiva hoy"})` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-neutral-500">Fecha del cálculo</dt>
            <dd className="text-neutral-900">{estimate.createdAt.toISOString().slice(0, 19).replace("T", " ")}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-neutral-500">Región / Provincia</dt>
            <dd className="text-neutral-900">
              {region?.name ?? "—"}
              {province ? ` / ${province.name}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-neutral-500">Nivel de materiales</dt>
            <dd className="text-neutral-900">{materialLevel?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-neutral-500">Score de confianza</dt>
            <dd className="text-neutral-900">{Math.round(Number(estimate.confidenceScore) * 100)}%</dd>
          </div>
        </dl>

        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">Input recibido</h3>
        <pre className="mt-1 overflow-x-auto rounded-lg bg-neutral-50 p-3 text-xs text-neutral-700">
          {JSON.stringify(estimate.inputs, null, 2)}
        </pre>
      </Card>

      <div className="mt-6">
        <h2 className="font-bold text-neutral-950">Partidas → factor → fuente</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Cada línea del desglose, con el factor que la generó y la fuente que respalda su valor. Un factor sin
          fuente citada, o ya inactivo hoy, se marca para que quede claro que ese dato pesa menos.
        </p>
        <div className="mt-3">
          <DataTable columns={["Partida", "Grupo", "Rango", "Confianza", "Factor (clave)", "Condición", "Fuente"]}>
            {items.map(({ item, factor, source }) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-neutral-950">{item.label}</td>
                <td className="px-4 py-3 text-neutral-600">{item.groupKey}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {item.min} € – {item.max} €
                </td>
                <td className="px-4 py-3">
                  <Badge tone="neutral">{item.confidence}</Badge>
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {factor ? (
                    <>
                      <span className="font-mono text-xs">{factor.key}</span>
                      {!factor.isActive && (
                        <span className="ml-1">
                          <Badge tone="warning">desactivado hoy</Badge>
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-neutral-400">sin factor asociado</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                  {factor?.condition ? JSON.stringify(factor.condition) : "siempre se aplica"}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {source ? (
                    <>
                      <div>{source.name}</div>
                      <div className="text-xs text-neutral-500">
                        {source.confidence} · {source.retrievedOn}
                        {!source.isActive && " · desactivada"}
                      </div>
                    </>
                  ) : (
                    <span className="text-neutral-400">sin fuente citada</span>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-bold text-neutral-950">IVA aplicado</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-xs font-semibold text-neutral-500">Escenario</dt>
              <dd className="text-neutral-900">{estimate.vatScenario}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-neutral-500">Tipo aplicado a esta estimación</dt>
              <dd className="text-neutral-900">{Math.round(Number(estimate.vatRatePct) * 100)}%</dd>
            </div>
            {vatRate && (
              <div>
                <dt className="text-xs font-semibold text-neutral-500">Descripción de la tarifa (vigente hoy)</dt>
                <dd className="text-neutral-900">{vatRate.description}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-semibold text-neutral-500">Fuente</dt>
              <dd className="text-neutral-900">{vatSource?.name ?? "sin fuente citada"}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="font-bold text-neutral-950">Incertidumbre aplicada</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-xs font-semibold text-neutral-500">Ensanche aplicado a esta estimación</dt>
              <dd className="text-neutral-900">{Math.round(Number(estimate.uncertaintyPct) * 100)}%</dd>
            </div>
            {appliedBand ? (
              <>
                <div>
                  <dt className="text-xs font-semibold text-neutral-500">Banda vigente hoy para este score</dt>
                  <dd className="text-neutral-900">{appliedBand.label}</dd>
                </div>
                {appliedBand.notes && (
                  <div>
                    <dt className="text-xs font-semibold text-neutral-500">Notas</dt>
                    <dd className="text-neutral-900">{appliedBand.notes}</dd>
                  </div>
                )}
              </>
            ) : (
              <p className="text-neutral-500">
                Ninguna banda activa hoy cubre este score de confianza (puede haber cambiado desde el cálculo).
              </p>
            )}
          </dl>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="font-bold text-neutral-950">Rangos agregados</h2>
        <div className="mt-3">
          <DataTable columns={["Grupo", "Etiqueta", "Mínimo", "Máximo"]}>
            {ranges.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-neutral-600">{r.groupKey}</td>
                <td className="px-4 py-3 font-medium text-neutral-950">{r.label}</td>
                <td className="px-4 py-3 text-neutral-600">{r.min} €</td>
                <td className="px-4 py-3 text-neutral-600">{r.max} €</td>
              </tr>
            ))}
          </DataTable>
        </div>
      </div>
    </div>
  );
}
