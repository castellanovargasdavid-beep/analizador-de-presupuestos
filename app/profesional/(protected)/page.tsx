import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { leads, serviceTypes } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getCurrentProfessionalId } from "@/lib/professional/actions";
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "@/lib/leads/status-labels";
import { isTerminalStatus, type LeadStatus } from "@/lib/leads/state-machine";

export const metadata = { robots: { index: false, follow: false } };

export default async function ProfessionalDashboardPage() {
  const professionalId = await getCurrentProfessionalId();
  if (!professionalId) return null;

  const rows = await db
    .select({ lead: leads, serviceName: serviceTypes.name })
    .from(leads)
    .innerJoin(serviceTypes, eq(leads.serviceTypeId, serviceTypes.id))
    .where(eq(leads.assignedProfessionalId, professionalId))
    .orderBy(desc(leads.createdAt));

  const active = rows.filter((r) => !isTerminalStatus(r.lead.status as LeadStatus));
  const closed = rows.filter((r) => isTerminalStatus(r.lead.status as LeadStatus));

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Mis solicitudes</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Solicitudes que se te han asignado. Actúa dentro de los plazos indicados para evitar que se reasignen.
      </p>

      <div className="mt-6 space-y-3">
        {active.map(({ lead, serviceName }) => (
          <Link key={lead.id} href={`/profesional/leads/${lead.id}`} className="block">
            <Card className="transition-colors hover:border-brand-400">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-neutral-950">{serviceName}</p>
                  <p className="text-sm text-neutral-500">{lead.contactName}</p>
                </div>
                <Badge tone={LEAD_STATUS_TONE[lead.status as LeadStatus]}>{LEAD_STATUS_LABEL[lead.status as LeadStatus]}</Badge>
              </div>
              {lead.contactDeadlineAt && !["contacto_confirmado", "presupuesto_pendiente", "presupuesto_enviado"].includes(lead.status) && (
                <p className="mt-2 text-xs text-warning-text">
                  Plazo de contacto: {lead.contactDeadlineAt.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                </p>
              )}
              {lead.quoteDeadlineAt && lead.status === "presupuesto_pendiente" && (
                <p className="mt-2 text-xs text-warning-text">
                  Plazo de presupuesto: {lead.quoteDeadlineAt.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                </p>
              )}
            </Card>
          </Link>
        ))}
        {active.length === 0 && <p className="text-sm text-neutral-500">No tienes solicitudes activas ahora mismo.</p>}
      </div>

      {closed.length > 0 && (
        <div className="mt-10">
          <h2 className="font-bold text-neutral-950">Historial</h2>
          <div className="mt-3 space-y-3">
            {closed.map(({ lead, serviceName }) => (
              <Link key={lead.id} href={`/profesional/leads/${lead.id}`} className="block">
                <Card className="opacity-75 transition-colors hover:border-brand-400 hover:opacity-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-neutral-950">{serviceName}</p>
                      <p className="text-sm text-neutral-500">{lead.contactName}</p>
                    </div>
                    <Badge tone={LEAD_STATUS_TONE[lead.status as LeadStatus]}>{LEAD_STATUS_LABEL[lead.status as LeadStatus]}</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
