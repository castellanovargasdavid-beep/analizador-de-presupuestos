import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { leads, notifications, professionals } from "@/db/schema";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import type { Tone } from "@/components/ui/Badge";

export const metadata = { robots: { index: false, follow: false } };

const STATUS_TONE: Record<string, Tone> = {
  pendiente: "neutral",
  simulado: "info",
  enviado: "good",
  fallido: "warning",
};

const PAGE_SIZE = 100;

export default async function AdminNotificacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const rows = await db
    .select({
      notification: notifications,
      professionalName: professionals.name,
      leadContactName: leads.contactName,
    })
    .from(notifications)
    .leftJoin(professionals, eq(notifications.professionalId, professionals.id))
    .leftJoin(leads, eq(notifications.leadId, leads.id))
    .where(status ? eq(notifications.status, status as "pendiente" | "simulado" | "enviado" | "fallido") : undefined)
    .orderBy(desc(notifications.createdAt))
    .limit(PAGE_SIZE);

  // Hoy solo existe el adaptador `mock` (ver lib/notifications/service.ts) —
  // no hay ningún proveedor real registrado todavía, sea cual sea el valor
  // de NOTIFICATION_ADAPTER.
  const usingMock = true;

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Notificaciones</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Cada notificación generada por el sistema (asignación, avisos de plazo, reasignación...), real o simulada.
      </p>
      {usingMock && (
        <p className="mt-2 rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning-text">
          No hay ningún proveedor de email/SMS/WhatsApp configurado todavía (adaptador activo: <code>mock</code>).
          Las notificaciones marcadas &ldquo;simulado&rdquo; se han registrado pero <strong>nunca se han enviado de
          verdad</strong>. Ver <code>docs/NOTIFICATION-SYSTEM.md</code> para activar un proveedor real.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/notificaciones"
          className={`rounded-full px-3 py-1 font-semibold ${!status ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
        >
          Todas
        </Link>
        {["pendiente", "simulado", "enviado", "fallido"].map((s) => (
          <Link
            key={s}
            href={`/admin/notificaciones?status=${s}`}
            className={`rounded-full px-3 py-1 font-semibold ${status === s ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <DataTable columns={["Fecha", "Plantilla", "Canal", "Destinatario", "Relacionado con", "Estado", "Intentos"]}>
          {rows.map(({ notification: n, professionalName, leadContactName }) => (
            <tr key={n.id}>
              <td className="px-4 py-3 whitespace-nowrap text-neutral-500">
                {n.createdAt.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
              </td>
              <td className="px-4 py-3 text-neutral-800">{n.templateKey}</td>
              <td className="px-4 py-3 text-neutral-600">{n.channel}</td>
              <td className="px-4 py-3 text-neutral-600">{n.recipient}</td>
              <td className="px-4 py-3 text-neutral-600">
                {n.leadId && (
                  <Link href={`/admin/leads/${n.leadId}`} className="text-brand-700 hover:underline">
                    Lead{leadContactName ? ` de ${leadContactName}` : ""}
                  </Link>
                )}
                {n.professionalId && !n.leadId && (
                  <Link href={`/admin/profesionales/${n.professionalId}`} className="text-brand-700 hover:underline">
                    {professionalName ?? "Profesional"}
                  </Link>
                )}
                {!n.leadId && !n.professionalId && "—"}
              </td>
              <td className="px-4 py-3">
                <Badge tone={STATUS_TONE[n.status] ?? "neutral"}>{n.status}</Badge>
                {n.lastError && <div className="mt-1 text-xs text-neutral-500">{n.lastError}</div>}
              </td>
              <td className="px-4 py-3 text-neutral-600">{n.attempts}</td>
            </tr>
          ))}
        </DataTable>
        {rows.length === 0 && <p className="mt-4 text-sm text-neutral-500">No hay notificaciones con este filtro.</p>}
        {rows.length === PAGE_SIZE && (
          <p className="mt-4 text-xs text-neutral-500">
            Mostrando las últimas {PAGE_SIZE}. Filtra por estado para acotar la búsqueda.
          </p>
        )}
      </div>
    </div>
  );
}
