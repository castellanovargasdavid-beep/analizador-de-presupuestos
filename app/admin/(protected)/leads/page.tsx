import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { leads, professionals, regions, serviceTypes } from "@/db/schema";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { LeadForm } from "@/components/admin/LeadForm";
import type { Tone } from "@/components/ui/Badge";

export const metadata = { robots: { index: false, follow: false } };

const STATUS_TONE: Record<string, Tone> = {
  nuevo: "info",
  en_revision: "warning",
  contactado: "good",
  sin_cobertura: "neutral",
  cerrado: "neutral",
};

export default async function AdminLeadsPage() {
  const [rows, professionalRows] = await Promise.all([
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Leads</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Cada solicitud de contacto que llega desde una página de resultado o de comparación. Sin red de
        profesionales todavía, un lead queda como &ldquo;sin cobertura&rdquo; hasta que exista alguno verificado
        en su servicio y región.
      </p>

      <div className="mt-6">
        <DataTable columns={["Fecha", "Contacto", "Servicio", "Región", "Estado", "Profesional", "Gestionar"]}>
          {rows.map(({ lead, serviceName, regionName, professionalName }) => (
            <tr key={lead.id}>
              <td className="px-4 py-3 whitespace-nowrap text-neutral-500">
                {lead.createdAt.toISOString().slice(0, 10)}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-neutral-950">{lead.contactName}</div>
                <div className="text-xs text-neutral-500">{lead.contactEmail}</div>
              </td>
              <td className="px-4 py-3 text-neutral-600">{serviceName}</td>
              <td className="px-4 py-3 text-neutral-600">{regionName ?? "—"}</td>
              <td className="px-4 py-3">
                <Badge tone={STATUS_TONE[lead.status] ?? "neutral"}>{lead.status}</Badge>
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
                      professionals={professionalRows}
                    />
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </DataTable>
        {rows.length === 0 && <p className="mt-4 text-sm text-neutral-500">Todavía no hay ningún lead.</p>}
      </div>
    </div>
  );
}
