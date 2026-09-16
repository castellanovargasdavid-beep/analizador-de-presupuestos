import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { leadQuotes, leadStatusHistory, leads, serviceTypes } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getCurrentProfessionalId } from "@/lib/professional/actions";
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "@/lib/leads/status-labels";
import type { LeadStatus } from "@/lib/leads/state-machine";
import { formatEUR } from "@/lib/format";
import { LeadActionsPanel } from "@/components/professional/LeadActionsPanel";

export const metadata = { robots: { index: false, follow: false } };

export default async function ProfessionalLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const professionalId = await getCurrentProfessionalId();
  if (!professionalId) notFound();

  const [row] = await db
    .select({ lead: leads, serviceName: serviceTypes.name })
    .from(leads)
    .innerJoin(serviceTypes, eq(leads.serviceTypeId, serviceTypes.id))
    .where(eq(leads.id, id))
    .limit(1);

  if (!row || row.lead.assignedProfessionalId !== professionalId) notFound();
  const { lead, serviceName } = row;

  const [history, quotes] = await Promise.all([
    db.select().from(leadStatusHistory).where(eq(leadStatusHistory.leadId, id)).orderBy(desc(leadStatusHistory.createdAt)),
    db.select().from(leadQuotes).where(eq(leadQuotes.leadId, id)).orderBy(desc(leadQuotes.createdAt)),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-neutral-950">{serviceName}</h1>
        <Badge tone={LEAD_STATUS_TONE[lead.status as LeadStatus]}>{LEAD_STATUS_LABEL[lead.status as LeadStatus]}</Badge>
      </div>

      <Card className="mt-4">
        <h2 className="font-bold text-neutral-950">Datos de contacto</h2>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">Nombre</dt>
            <dd className="font-medium text-neutral-950">{lead.contactName}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Email</dt>
            <dd className="font-medium text-neutral-950">{lead.contactEmail}</dd>
          </div>
          {lead.contactPhone && (
            <div>
              <dt className="text-neutral-500">Teléfono</dt>
              <dd className="font-medium text-neutral-950">{lead.contactPhone}</dd>
            </div>
          )}
          {lead.desiredTimeframe && (
            <div>
              <dt className="text-neutral-500">Plazo deseado</dt>
              <dd className="font-medium text-neutral-950">{lead.desiredTimeframe}</dd>
            </div>
          )}
        </dl>
        {lead.description && (
          <div className="mt-3 border-t border-neutral-100 pt-3">
            <p className="text-sm text-neutral-500">Descripción del trabajo</p>
            <p className="mt-1 text-neutral-800">{lead.description}</p>
          </div>
        )}
        {lead.deadlinePausedUntil && lead.deadlinePausedUntil > new Date() && (
          <div className="mt-3 rounded-lg bg-info-bg p-3 text-sm text-info-text">
            Plazo pausado hasta {lead.deadlinePausedUntil.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}.
            Motivo: {lead.deadlinePauseReason}
          </div>
        )}
      </Card>

      <div className="mt-6">
        <LeadActionsPanel leadId={lead.id} status={lead.status as LeadStatus} />
      </div>

      {quotes.length > 0 && (
        <Card className="mt-6">
          <h2 className="font-bold text-neutral-950">Presupuestos enviados</h2>
          <div className="mt-3 space-y-3">
            {quotes.map((q) => (
              <div key={q.id} className="rounded-lg border border-neutral-200 p-3 text-sm">
                <p className="font-bold text-neutral-950">{formatEUR(q.amount)}</p>
                {q.conditions && <p className="mt-1 text-neutral-600">{q.conditions}</p>}
                <p className="mt-1 text-xs text-neutral-500">{q.createdAt.toLocaleString("es-ES")}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <h2 className="font-bold text-neutral-950">Historial</h2>
        <ol className="mt-3 space-y-2 border-l border-neutral-200 pl-4 text-sm">
          {history.map((h) => (
            <li key={h.id}>
              <p className="font-medium text-neutral-950">
                {LEAD_STATUS_LABEL[h.toStatus as LeadStatus]}
                {h.fromStatus && <span className="font-normal text-neutral-400"> (desde {LEAD_STATUS_LABEL[h.fromStatus as LeadStatus]})</span>}
              </p>
              <p className="text-xs text-neutral-500">{h.createdAt.toLocaleString("es-ES")}</p>
              {h.reason && <p className="mt-0.5 text-neutral-600">{h.reason}</p>}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
