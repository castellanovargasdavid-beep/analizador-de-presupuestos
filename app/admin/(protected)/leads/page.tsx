import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { leads, professionals, regions, serviceTypes } from "@/db/schema";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { LeadForm } from "@/components/admin/LeadForm";
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "@/lib/leads/status-labels";
import { isTerminalStatus, type LeadStatus } from "@/lib/leads/state-machine";

export const metadata = { robots: { index: false, follow: false } };

const PURCHASE_INTENT_LABEL: Record<string, string> = {
  explorando: "Explorando",
  comparando_presupuestos: "Comparando presupuestos",
  listo_para_contratar: "Listo para contratar",
};

/**
 * Vistas operativas, no un filtro de estado exacto: agrupan los estados que
 * un admin necesita vigilar juntos (p. ej. "esperando contacto" cubre tres
 * estados del ciclo de vida). `?status=` sigue soportado aparte para
 * compatibilidad con enlaces existentes a un estado concreto.
 */
const VIEWS: Record<string, { label: string; statuses: LeadStatus[] }> = {
  pending_contact: { label: "Esperando contacto", statuses: ["notificado", "visto", "aceptado", "contacto_pendiente"] },
  quote_pending: { label: "Presupuesto pendiente", statuses: ["presupuesto_pendiente"] },
  blocked_reassigned: {
    label: "Bloqueados o reasignados",
    statuses: ["sin_cobertura", "reasignacion_pendiente", "reasignado"],
  },
  incidents: { label: "Con incidencia", statuses: ["con_incidencia"] },
};

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string; deadline?: string }>;
}) {
  const { status: statusFilter, view, deadline: deadlineFilter } = await searchParams;

  const [allRows, professionalRows] = await Promise.all([
    db
      .select({
        lead: leads,
        serviceName: serviceTypes.name,
        regionName: regions.name,
        professionalName: professionals.name,
      })
      .from(leads)
      .innerJoin(serviceTypes, eq(leads.serviceTypeId, serviceTypes.id))
      .leftJoin(regions, eq(leads.regionId, regions.id))
      .leftJoin(professionals, eq(leads.assignedProfessionalId, professionals.id))
      .orderBy(desc(leads.createdAt)),
    db
      .select({ id: professionals.id, name: professionals.name })
      .from(professionals)
      .where(eq(professionals.isActive, true))
      .orderBy(professionals.name),
  ]);

  const now = new Date();
  const upcomingDeadlineCount = allRows.filter(({ lead }) => {
    const deadline = lead.contactDeadlineAt ?? lead.quoteDeadlineAt;
    return deadline && !isTerminalStatus(lead.status) && deadline.getTime() - now.getTime() < 4 * 60 * 60 * 1000;
  }).length;

  let rows = allRows;
  if (deadlineFilter === "upcoming") {
    rows = rows.filter(({ lead }) => {
      const deadline = lead.contactDeadlineAt ?? lead.quoteDeadlineAt;
      return deadline && !isTerminalStatus(lead.status) && deadline.getTime() - now.getTime() < 4 * 60 * 60 * 1000;
    });
  } else if (view && VIEWS[view]) {
    rows = rows.filter(({ lead }) => VIEWS[view].statuses.includes(lead.status));
  } else if (statusFilter) {
    rows = rows.filter((r) => r.lead.status === statusFilter);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Leads</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Cada solicitud de contacto. La validación, asignación a un profesional y seguimiento de plazos es
        automática — desde aquí se supervisa, se interviene manualmente cuando hace falta y queda todo auditado.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/leads"
          className={`rounded-full px-3 py-1 font-semibold ${!statusFilter && !view && deadlineFilter !== "upcoming" ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
        >
          Todos ({allRows.length})
        </Link>
        {Object.entries(VIEWS).map(([key, { label, statuses }]) => {
          const count = allRows.filter((r) => statuses.includes(r.lead.status)).length;
          return (
            <Link
              key={key}
              href={`/admin/leads?view=${key}`}
              className={`rounded-full px-3 py-1 font-semibold ${view === key ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
            >
              {label} ({count})
            </Link>
          );
        })}
        <Link
          href="/admin/leads?deadline=upcoming"
          className={`rounded-full px-3 py-1 font-semibold ${deadlineFilter === "upcoming" ? "bg-warning-bg text-warning-text" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
        >
          Plazo próximo o vencido ({upcomingDeadlineCount})
        </Link>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold text-brand-700 hover:underline">
          Filtrar por estado exacto
        </summary>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(LEAD_STATUS_LABEL) as LeadStatus[]).map((s) => {
            const count = allRows.filter((r) => r.lead.status === s).length;
            if (count === 0) return null;
            return (
              <Link
                key={s}
                href={`/admin/leads?status=${s}`}
                className={`rounded-full px-3 py-1 font-semibold ${statusFilter === s ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
              >
                {LEAD_STATUS_LABEL[s]} ({count})
              </Link>
            );
          })}
        </div>
      </details>

      <div className="mt-6">
        <DataTable
          columns={["Fecha", "Contacto", "Servicio/Zona", "Intención", "Estado", "Plazo", "Profesional", "Acciones"]}
        >
          {rows.map(({ lead, serviceName, regionName, professionalName }) => {
            const deadline = lead.contactDeadlineAt ?? lead.quoteDeadlineAt;
            const deadlineSoon = deadline && !isTerminalStatus(lead.status) && deadline.getTime() - now.getTime() < 4 * 60 * 60 * 1000;
            const deadlineOverdue = deadline && deadline.getTime() < now.getTime();
            return (
              <tr key={lead.id}>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-500">
                  {lead.createdAt.toISOString().slice(0, 10)}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-neutral-950">{lead.contactName}</div>
                  <div className="text-xs text-neutral-500">{lead.contactEmail}</div>
                  {lead.contactPhone && <div className="text-xs text-neutral-500">{lead.contactPhone}</div>}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  <div>{serviceName}</div>
                  <div className="text-xs text-neutral-500">{regionName ?? "Sin zona indicada"}</div>
                  {lead.desiredTimeframe && (
                    <div className="text-xs text-neutral-500">Plazo deseado: {lead.desiredTimeframe}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {lead.purchaseIntent ? PURCHASE_INTENT_LABEL[lead.purchaseIntent] : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={LEAD_STATUS_TONE[lead.status] ?? "neutral"}>{LEAD_STATUS_LABEL[lead.status] ?? lead.status}</Badge>
                  {lead.duplicateOfLeadId && <div className="mt-1 text-xs text-neutral-500">Posible duplicado</div>}
                  {lead.status === "descartado" && lead.discardReason && (
                    <div className="mt-1 text-xs text-neutral-500">{lead.discardReason}</div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {deadline ? (
                    <Badge tone={deadlineOverdue ? "warning" : deadlineSoon ? "warning" : "neutral"}>
                      {deadline.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                    </Badge>
                  ) : (
                    <span className="text-xs text-neutral-400">—</span>
                  )}
                  {lead.deadlinePausedUntil && lead.deadlinePausedUntil > now && (
                    <div className="mt-1 text-xs text-neutral-500">Pausado</div>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-600">{professionalName ?? "Sin asignar"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <Link href={`/admin/leads/${lead.id}`} className="text-sm font-semibold text-brand-700 hover:underline">
                      Ver detalle →
                    </Link>
                    <details>
                      <summary className="cursor-pointer text-xs font-semibold text-neutral-500 hover:underline">
                        Editar rápido
                      </summary>
                      <div className="mt-3 max-w-xs">
                        <LeadForm
                          id={lead.id}
                          status={lead.status}
                          assignedProfessionalId={lead.assignedProfessionalId}
                          discardReason={lead.discardReason}
                          contactOutcome={lead.contactOutcome}
                          agreedPrice={lead.agreedPrice}
                          paymentStatus={lead.paymentStatus}
                          paymentAmount={lead.paymentAmount}
                          incidentNotes={lead.incidentNotes}
                          professionals={professionalRows}
                        />
                      </div>
                    </details>
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
        {rows.length === 0 && <p className="mt-4 text-sm text-neutral-500">No hay leads con este filtro.</p>}
      </div>
    </div>
  );
}
