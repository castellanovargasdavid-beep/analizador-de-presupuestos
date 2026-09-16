import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { leads, professionals, regions, serviceTypes } from "@/db/schema";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { LeadForm } from "@/components/admin/LeadForm";
import { formatEUR } from "@/lib/format";
import type { Tone } from "@/components/ui/Badge";

export const metadata = { robots: { index: false, follow: false } };

const STATUS_TONE: Record<string, Tone> = {
  nuevo: "info",
  validado: "info",
  descartado: "neutral",
  asignado: "warning",
  enviado: "warning",
  contactado: "good",
  sin_cobertura: "neutral",
  cerrado: "neutral",
  con_incidencia: "warning",
};

const PURCHASE_INTENT_LABEL: Record<string, string> = {
  explorando: "Explorando",
  comparando_presupuestos: "Comparando presupuestos",
  listo_para_contratar: "Listo para contratar",
};

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusFilter } = await searchParams;

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

  const rows = statusFilter ? allRows.filter((r) => r.lead.status === statusFilter) : allRows;

  const STATUS_FILTERS = [
    "nuevo",
    "validado",
    "descartado",
    "asignado",
    "enviado",
    "contactado",
    "sin_cobertura",
    "cerrado",
    "con_incidencia",
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Leads</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Cada solicitud de contacto que llega desde una página de resultado o de comparación. Sin red de
        profesionales todavía, un lead queda como &ldquo;sin cobertura&rdquo; hasta que exista alguno verificado
        en su servicio y región.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <a
          href="/admin/leads"
          className={`rounded-full px-3 py-1 font-semibold ${!statusFilter ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
        >
          Todos ({allRows.length})
        </a>
        {STATUS_FILTERS.map((s) => {
          const count = allRows.filter((r) => r.lead.status === s).length;
          return (
            <a
              key={s}
              href={`/admin/leads?status=${s}`}
              className={`rounded-full px-3 py-1 font-semibold ${statusFilter === s ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
            >
              {s.replace("_", " ")} ({count})
            </a>
          );
        })}
      </div>

      <div className="mt-6">
        <DataTable
          columns={["Fecha", "Contacto", "Servicio/Zona", "Intención", "Rango visto", "Estado", "Profesional", "Gestionar"]}
        >
          {rows.map(({ lead, serviceName, regionName, professionalName }) => (
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
                  <div className="text-xs text-neutral-500">Plazo: {lead.desiredTimeframe}</div>
                )}
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {lead.purchaseIntent ? PURCHASE_INTENT_LABEL[lead.purchaseIntent] : "—"}
              </td>
              <td className="px-4 py-3">
                <Badge tone={lead.rangeAcknowledged ? "good" : "neutral"}>
                  {lead.rangeAcknowledged ? "Sí" : "No"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge tone={STATUS_TONE[lead.status] ?? "neutral"}>{lead.status}</Badge>
                {lead.status === "descartado" && lead.discardReason && (
                  <div className="mt-1 text-xs text-neutral-500">{lead.discardReason}</div>
                )}
                {lead.paymentStatus !== "no_aplica" && (
                  <div className="mt-1 text-xs text-neutral-500">
                    Pago: {lead.paymentStatus}
                    {lead.paymentAmount ? ` (${formatEUR(lead.paymentAmount)})` : ""}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-neutral-600">{professionalName ?? "Sin asignar"}</td>
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">
                    Gestionar
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
              </td>
            </tr>
          ))}
        </DataTable>
        {rows.length === 0 && <p className="mt-4 text-sm text-neutral-500">No hay leads con este filtro.</p>}
      </div>
    </div>
  );
}
