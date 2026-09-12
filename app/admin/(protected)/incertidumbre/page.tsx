import { db } from "@/db/client";
import { uncertaintyBands } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { UncertaintyBandForm } from "@/components/admin/UncertaintyBandForm";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminIncertidumbrePage() {
  const rows = await db.select().from(uncertaintyBands).orderBy(uncertaintyBands.minConfidenceScore);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Bandas de incertidumbre</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Cuánto se ensancha el rango final según la confianza agregada (A/B/C) de los factores que han contribuido a
        una estimación concreta.
      </p>

      <div className="mt-6">
        <DataTable columns={["Etiqueta", "Confianza (min–max)", "Ensanche", "Estado", "Editar"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-medium text-neutral-950">{r.label}</td>
              <td className="px-4 py-3 text-neutral-600">
                {r.minConfidenceScore} – {r.maxConfidenceScore}
              </td>
              <td className="px-4 py-3 text-neutral-600">±{Math.round(r.paddingPct * 100)}%</td>
              <td className="px-4 py-3">
                <Badge tone={r.isActive ? "good" : "neutral"}>{r.isActive ? "Activa" : "Inactiva"}</Badge>
              </td>
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">Editar</summary>
                  <div className="mt-3 max-w-md">
                    <UncertaintyBandForm initial={r} />
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <Card className="mt-6 max-w-md">
        <h2 className="font-bold text-neutral-950">Añadir banda</h2>
        <div className="mt-3">
          <UncertaintyBandForm />
        </div>
      </Card>
    </div>
  );
}
