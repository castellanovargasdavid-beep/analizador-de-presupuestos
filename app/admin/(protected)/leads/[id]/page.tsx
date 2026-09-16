import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db/client";
import { leadQuotes, leads, notifications, professionals, regions, serviceTypes } from "@/db/schema";
import { getLeadHistory } from "@/lib/leads/lifecycle-service";
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "@/lib/leads/status-labels";
import { isTerminalStatus } from "@/lib/leads/state-machine";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatEUR } from "@/lib/format";
import { AdminReassignForm, AdminPauseForm, AdminResumeForm } from "@/components/admin/LeadInterventionForms";

export const metadata = { robots: { index: false, follow: false } };

const REASSIGNABLE_FROM = [
  "asignado",
  "notificado",
  "visto",
  "contacto_pendiente",
  "presupuesto_pendiente",
  "rechazado",
  "expirado",
];

export default async function AdminLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [row] = await db
    .select({
      lead: leads,
      serviceName: serviceTypes.name,
      regionName: regions.name,
      professionalName: professionals.name,
      professionalEmail: professionals.email,
    })
    .from(leads)
    .innerJoin(serviceTypes, eq(leads.serviceTypeId, serviceTypes.id))
    .leftJoin(regions, eq(leads.regionId, regions.id))
    .leftJoin(professionals, eq(leads.assignedProfessionalId, professionals.id))
    .where(eq(leads.id, id))
    .limit(1);
  if (!row) notFound();
  const { lead, serviceName, regionName, professionalName, professionalEmail } = row;

  const [history, quotes, leadNotifications] = await Promise.all([
    getLeadHistory(id),
    db.select().from(leadQuotes).where(eq(leadQuotes.leadId, id)).orderBy(leadQuotes.createdAt),
    db.select().from(notifications).where(eq(notifications.leadId, id)).orderBy(notifications.createdAt),
  ]);

  const now = new Date();
  const isPaused = Boolean(lead.deadlinePausedUntil && lead.deadlinePausedUntil > now);
  const canReassign = REASSIGNABLE_FROM.includes(lead.status);
  const activeDeadline = lead.contactDeadlineAt ?? lead.quoteDeadlineAt;

  return (
    <div>
      <Link href="/admin/leads" className="text-sm font-semibold text-brand-700 hover:underline">
        ← Volver a leads
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-neutral-950">{lead.contactName}</h1>
        <Badge tone={LEAD_STATUS_TONE[lead.status] ?? "neutral"}>{LEAD_STATUS_LABEL[lead.status] ?? lead.status}</Badge>
        {isPaused && <Badge tone="warning">Plazo pausado</Badge>}
        {lead.duplicateOfLeadId && <Badge tone="neutral">Posible duplicado</Badge>}
      </div>
      <p className="mt-1 text-sm text-neutral-600">
        {serviceName} — {regionName ?? "Sin zona indicada"} · creado el{" "}
        {lead.createdAt.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="font-bold text-neutral-950">Datos de contacto y solicitud</h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-neutral-500">Email</dt>
                <dd className="text-neutral-800">{lead.contactEmail}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-neutral-500">Teléfono</dt>
                <dd className="text-neutral-800">{lead.contactPhone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-neutral-500">Plazo deseado</dt>
                <dd className="text-neutral-800">{lead.desiredTimeframe ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-neutral-500">Intención declarada</dt>
                <dd className="text-neutral-800">{lead.purchaseIntent ?? "—"}</dd>
              </div>
              {lead.description && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-neutral-500">Descripción</dt>
                  <dd className="text-neutral-800">{lead.description}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <h2 className="font-bold text-neutral-950">Asignación y plazos</h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-neutral-500">Profesional actual</dt>
                <dd className="text-neutral-800">
                  {professionalName ? (
                    <Link href={`/admin/profesionales/${lead.assignedProfessionalId}`} className="text-brand-700 hover:underline">
                      {professionalName}
                    </Link>
                  ) : (
                    "Sin asignar"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-neutral-500">Veces reasignado</dt>
                <dd className="text-neutral-800">{lead.reassignmentCount}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-neutral-500">Plazo de contacto</dt>
                <dd className="text-neutral-800">
                  {lead.contactDeadlineAt
                    ? lead.contactDeadlineAt.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-neutral-500">Plazo de presupuesto</dt>
                <dd className="text-neutral-800">
                  {lead.quoteDeadlineAt
                    ? lead.quoteDeadlineAt.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
                    : "—"}
                </dd>
              </div>
              {isPaused && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-neutral-500">Pausa activa</dt>
                  <dd className="text-neutral-800">
                    Hasta {lead.deadlinePausedUntil!.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                    {lead.deadlinePauseReason ? ` — ${lead.deadlinePauseReason}` : ""}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <h2 className="font-bold text-neutral-950">Historial completo</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Cada cambio de estado o intervención manual, con quién lo hizo y por qué. No se puede editar ni borrar.
            </p>
            <ol className="mt-4 space-y-3 border-l-2 border-neutral-100 pl-4">
              {[...history].reverse().map((entry) => (
                <li key={entry.id} className="text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-neutral-900">
                      {entry.fromStatus && entry.fromStatus !== entry.toStatus
                        ? `${LEAD_STATUS_LABEL[entry.fromStatus] ?? entry.fromStatus} → ${LEAD_STATUS_LABEL[entry.toStatus] ?? entry.toStatus}`
                        : `Nota (${LEAD_STATUS_LABEL[entry.toStatus] ?? entry.toStatus})`}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {entry.createdAt.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                    <Badge tone="neutral">{entry.actorType}</Badge>
                  </div>
                  {entry.reason && <p className="mt-0.5 text-neutral-600">{entry.reason}</p>}
                </li>
              ))}
              {history.length === 0 && <li className="text-sm text-neutral-500">Sin historial todavía.</li>}
            </ol>
          </Card>

          {quotes.length > 0 && (
            <Card>
              <h2 className="font-bold text-neutral-950">Presupuestos recibidos</h2>
              <div className="mt-3 space-y-3">
                {quotes.map((q) => (
                  <div key={q.id} className="rounded-lg border border-neutral-200 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-neutral-900">{formatEUR(q.amount)}</span>
                      <Badge tone={q.status === "enviado" ? "good" : "neutral"}>{q.status}</Badge>
                      <span className="text-xs text-neutral-400">
                        {q.createdAt.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                    {q.conditions && <p className="mt-1 text-neutral-600">Condiciones: {q.conditions}</p>}
                    {q.observations && <p className="mt-1 text-neutral-600">Observaciones: {q.observations}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h2 className="font-bold text-neutral-950">Notificaciones de este lead</h2>
            <div className="mt-3 space-y-2">
              {leadNotifications.map((n) => (
                <div key={n.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                  <span className="text-neutral-800">
                    {n.templateKey} · {n.channel} → {n.recipient}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge tone={n.status === "enviado" ? "good" : n.status === "fallido" ? "warning" : "neutral"}>
                      {n.status}
                    </Badge>
                    <span className="text-xs text-neutral-400">
                      {n.createdAt.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                </div>
              ))}
              {leadNotifications.length === 0 && (
                <p className="text-sm text-neutral-500">No se ha generado ninguna notificación para este lead.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {!isTerminalStatus(lead.status) && (
            <Card>
              <h2 className="font-bold text-neutral-950">Intervención manual</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Solo para casos que la automatización no puede resolver. Todo queda registrado con motivo en el
                historial.
              </p>

              {canReassign ? (
                <div className="mt-4 border-t border-neutral-100 pt-4">
                  <h3 className="text-sm font-semibold text-neutral-800">Reasignar a otro profesional</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    Excluye al profesional actual para este lead (no se le volverá a asignar) y busca uno nuevo
                    elegible. Si no hay ninguno, queda honestamente en &ldquo;sin cobertura&rdquo;.
                  </p>
                  <div className="mt-2">
                    <AdminReassignForm leadId={lead.id} />
                  </div>
                </div>
              ) : (
                <p className="mt-4 border-t border-neutral-100 pt-4 text-xs text-neutral-500">
                  La reasignación manual no está disponible en el estado actual ({LEAD_STATUS_LABEL[lead.status]}).
                </p>
              )}

              {activeDeadline && (
                <div className="mt-4 border-t border-neutral-100 pt-4">
                  <h3 className="text-sm font-semibold text-neutral-800">Plazo activo</h3>
                  {isPaused ? (
                    <div className="mt-2">
                      <AdminResumeForm leadId={lead.id} />
                    </div>
                  ) : (
                    <>
                      <p className="mt-1 text-xs text-neutral-500">
                        Pausa el plazo cuando dependa de una visita, del usuario o de un tercero — nunca penaliza al
                        profesional mientras esté pausado.
                      </p>
                      <div className="mt-2">
                        <AdminPauseForm leadId={lead.id} />
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>
          )}

          {professionalEmail && (
            <Card>
              <h2 className="font-bold text-neutral-950">Contacto del profesional</h2>
              <p className="mt-2 text-sm text-neutral-700">{professionalEmail}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
