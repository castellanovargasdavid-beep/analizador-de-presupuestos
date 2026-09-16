import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { automationRuns } from "@/db/schema";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminAutomatizacionesPage() {
  const runs = await db.select().from(automationRuns).orderBy(desc(automationRuns.startedAt)).limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Ejecuciones del cron de plazos</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Cada llamada a <code>/api/cron/lead-deadlines</code> (avisos de plazo próximo y reasignación por
        incumplimiento). En este entorno no hay un cron real ejecutándose todavía — en producción lo dispara Vercel
        Cron cada 15 minutos (ver <code>vercel.json</code> y <code>docs/PRODUCTION-SETUP.md</code>).
      </p>

      <div className="mt-6">
        <DataTable columns={["Inicio", "Duración", "Procesados", "Errores", "Detalle"]}>
          {runs.map((run) => {
            const durationMs = run.finishedAt ? run.finishedAt.getTime() - run.startedAt.getTime() : null;
            const details = run.details as
              | { contactWarningsSent?: number; contactReassignments?: number; quoteWarningsSent?: number; quoteReassignments?: number; errors?: string[] }
              | null;
            return (
              <tr key={run.id}>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-500">
                  {run.startedAt.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {run.finishedAt ? `${durationMs}ms` : <Badge tone="warning">Sin terminar</Badge>}
                </td>
                <td className="px-4 py-3 text-neutral-600">{run.processedCount}</td>
                <td className="px-4 py-3">
                  <Badge tone={run.errorCount > 0 ? "warning" : "good"}>{run.errorCount}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-neutral-500">
                  {details && (
                    <div className="space-y-0.5">
                      {details.contactWarningsSent !== undefined && <div>Avisos de contacto: {details.contactWarningsSent}</div>}
                      {details.contactReassignments !== undefined && <div>Reasignaciones (contacto): {details.contactReassignments}</div>}
                      {details.quoteWarningsSent !== undefined && <div>Avisos de presupuesto: {details.quoteWarningsSent}</div>}
                      {details.quoteReassignments !== undefined && <div>Reasignaciones (presupuesto): {details.quoteReassignments}</div>}
                      {details.errors && details.errors.length > 0 && (
                        <div className="text-warning-text">{details.errors.join("; ")}</div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </DataTable>
        {runs.length === 0 && (
          <p className="mt-4 text-sm text-neutral-500">
            Todavía no se ha ejecutado el cron ninguna vez en este entorno.
          </p>
        )}
      </div>
    </div>
  );
}
