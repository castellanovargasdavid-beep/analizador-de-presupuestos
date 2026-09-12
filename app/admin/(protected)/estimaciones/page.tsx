import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/admin/DataTable";
import { listRecentEstimates } from "@/lib/admin/explain";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminEstimacionesPage() {
  const recent = await listRecentEstimates(20);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Explicar estimación</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Busca por id de estimación para ver exactamente qué regla, qué factores, qué fuentes y qué banda de
        incertidumbre produjeron su rango — la respuesta interna a &ldquo;¿por qué este cálculo ha dado este
        resultado?&rdquo;.
      </p>

      <Card className="mt-6 max-w-lg">
        <form action="/admin/estimaciones/buscar" className="flex items-end gap-2">
          <label className="block flex-1">
            <span className="text-xs font-semibold text-neutral-600">Id de estimación</span>
            <input
              name="id"
              required
              placeholder="p. ej. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 font-mono text-xs focus:border-brand-500 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-brand-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Ver
          </button>
        </form>
      </Card>

      <h2 className="mt-8 font-bold text-neutral-950">Estimaciones recientes</h2>
      <div className="mt-3">
        <DataTable columns={["Fecha", "Servicio", "Rango total", "Confianza", "Ver"]}>
          {recent.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 whitespace-nowrap text-neutral-500">{r.createdAt.toISOString().slice(0, 10)}</td>
              <td className="px-4 py-3 text-neutral-600">{r.serviceName}</td>
              <td className="px-4 py-3 text-neutral-600">
                {r.totalMin} € – {r.totalMax} €
              </td>
              <td className="px-4 py-3 text-neutral-600">{Math.round(Number(r.confidenceScore) * 100)}%</td>
              <td className="px-4 py-3">
                <Link href={`/admin/estimaciones/${r.id}`} className="text-sm font-semibold text-brand-700 hover:underline">
                  Explicar
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
        {recent.length === 0 && <p className="mt-4 text-sm text-neutral-500">Todavía no hay ninguna estimación.</p>}
      </div>
    </div>
  );
}
