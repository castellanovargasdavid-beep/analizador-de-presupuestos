import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { leads, professionalServiceAreas, professionals, regions, serviceTypes } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { ProfessionalForm } from "@/components/admin/ProfessionalForm";
import { ProfessionalServiceAreaForm } from "@/components/admin/ProfessionalServiceAreaForm";
import { RemoveServiceAreaButton } from "@/components/admin/RemoveServiceAreaButton";
import { formatEUR } from "@/lib/format";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminProfesionalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [professional] = await db.select().from(professionals).where(eq(professionals.id, id)).limit(1);
  if (!professional) notFound();

  const [areas, allServiceTypes, allRegions, assignedLeads] = await Promise.all([
    db
      .select({ area: professionalServiceAreas, serviceName: serviceTypes.name, regionName: regions.name })
      .from(professionalServiceAreas)
      .innerJoin(serviceTypes, eq(professionalServiceAreas.serviceTypeId, serviceTypes.id))
      .leftJoin(regions, eq(professionalServiceAreas.regionId, regions.id))
      .where(eq(professionalServiceAreas.professionalId, id)),
    db.select({ id: serviceTypes.id, name: serviceTypes.name }).from(serviceTypes).orderBy(serviceTypes.name),
    db.select({ id: regions.id, name: regions.name }).from(regions).orderBy(regions.name),
    db
      .select({ lead: leads, serviceName: serviceTypes.name })
      .from(leads)
      .innerJoin(serviceTypes, eq(leads.serviceTypeId, serviceTypes.id))
      .where(eq(leads.assignedProfessionalId, id))
      .orderBy(desc(leads.createdAt)),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">{professional.name}</h1>
      <p className="mt-1 text-sm text-neutral-600">{professional.email}</p>

      <Card className="mt-6 max-w-lg">
        <h2 className="font-bold text-neutral-950">Datos del profesional</h2>
        <div className="mt-3">
          <ProfessionalForm
            initial={{
              ...professional,
              hasPassword: Boolean(professional.passwordHash),
              maxConcurrentLeads: professional.maxConcurrentLeads,
            }}
          />
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="font-bold text-neutral-950">Zonas y servicios que cubre</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Se usa para decidir a quién ofrecer un lead nuevo. &ldquo;Toda España&rdquo; (sin región) cubre cualquier
          zona para ese servicio.
        </p>
        <div className="mt-4 space-y-2">
          {areas.map(({ area, serviceName, regionName }) => (
            <div key={area.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm">
              <span>
                {serviceName} — <span className="text-neutral-500">{regionName ?? "Toda España"}</span>
              </span>
              <RemoveServiceAreaButton areaId={area.id} professionalId={professional.id} />
            </div>
          ))}
          {areas.length === 0 && <p className="text-sm text-neutral-500">Sin zonas de cobertura todavía.</p>}
        </div>
        <div className="mt-4 border-t border-neutral-100 pt-4">
          <ProfessionalServiceAreaForm professionalId={professional.id} serviceTypes={allServiceTypes} regions={allRegions} />
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="font-bold text-neutral-950">Historial de leads asignados</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Todos los leads que se le han asignado a este profesional, con su estado y el pago registrado, si existe.
        </p>
        <div className="mt-4">
          <DataTable columns={["Fecha", "Servicio", "Estado", "Precio acordado", "Pago"]}>
            {assignedLeads.map(({ lead, serviceName }) => (
              <tr key={lead.id}>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-500">
                  {lead.createdAt.toISOString().slice(0, 10)}
                </td>
                <td className="px-4 py-3 text-neutral-600">{serviceName}</td>
                <td className="px-4 py-3">
                  <Badge tone="neutral">{lead.status}</Badge>
                </td>
                <td className="px-4 py-3 text-neutral-600">{lead.agreedPrice ? formatEUR(lead.agreedPrice) : "—"}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {lead.paymentStatus === "no_aplica" ? "—" : `${lead.paymentStatus}${lead.paymentAmount ? ` (${formatEUR(lead.paymentAmount)})` : ""}`}
                </td>
              </tr>
            ))}
          </DataTable>
          {assignedLeads.length === 0 && (
            <p className="mt-4 text-sm text-neutral-500">Todavía no se le ha asignado ningún lead.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
