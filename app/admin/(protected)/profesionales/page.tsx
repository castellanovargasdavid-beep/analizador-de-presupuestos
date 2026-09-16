import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { leads, professionals } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { ProfessionalForm } from "@/components/admin/ProfessionalForm";
import type { Tone } from "@/components/ui/Badge";

export const metadata = { robots: { index: false, follow: false } };

const VERIFICATION_TONE: Record<string, Tone> = {
  pendiente: "warning",
  verificado: "good",
  rechazado: "neutral",
};

export default async function AdminProfesionalesPage() {
  const rows = await db
    .select({
      professional: professionals,
      assignedLeads: sql<number>`count(${leads.id})`.mapWith(Number),
    })
    .from(professionals)
    .leftJoin(leads, sql`${leads.assignedProfessionalId} = ${professionals.id}`)
    .groupBy(professionals.id)
    .orderBy(professionals.name);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Profesionales</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Gestión de la red de profesionales verificados: verificación, zonas de cobertura, capacidad y acceso al
        portal (donde aceptan/rechazan leads y envían presupuestos) se configuran desde aquí. La asignación de
        leads nuevos es automática; desde la ficha de cada lead puedes reasignar manualmente si hace falta.
      </p>

      <div className="mt-6">
        <DataTable columns={["Nombre", "Contacto", "Verificación", "Activo", "Portal", "Pausado", "Leads asignados", "Detalle"]}>
          {rows.map(({ professional: p, assignedLeads }) => {
            const isPaused = Boolean(p.pausedUntil && p.pausedUntil > new Date());
            return (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-neutral-950">{p.name}</td>
                <td className="px-4 py-3 text-neutral-600">
                  <div>{p.email}</div>
                  {p.phone && <div className="text-xs text-neutral-500">{p.phone}</div>}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={VERIFICATION_TONE[p.verificationStatus] ?? "neutral"}>{p.verificationStatus}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={p.isActive ? "good" : "neutral"}>{p.isActive ? "Activo" : "Inactivo"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={p.passwordHash ? "good" : "neutral"}>{p.passwordHash ? "Con acceso" : "Sin acceso"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={isPaused ? "warning" : "neutral"}>{isPaused ? "Pausado" : "—"}</Badge>
                </td>
                <td className="px-4 py-3 text-neutral-600">{assignedLeads}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/profesionales/${p.id}`} className="text-sm font-semibold text-brand-700 hover:underline">
                    Ver / editar →
                  </Link>
                </td>
              </tr>
            );
          })}
        </DataTable>
        {rows.length === 0 && (
          <p className="mt-4 text-sm text-neutral-500">
            Todavía no hay ningún profesional registrado. La red empieza vacía a propósito: no se inventan
            profesionales.
          </p>
        )}
      </div>

      <Card className="mt-6 max-w-lg">
        <h2 className="font-bold text-neutral-950">Añadir profesional</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Se crea como &ldquo;pendiente&rdquo; e inactivo por defecto: verifícalo y actívalo cuando lo confirmes.
        </p>
        <div className="mt-3">
          <ProfessionalForm />
        </div>
      </Card>
    </div>
  );
}
