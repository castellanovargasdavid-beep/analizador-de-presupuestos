import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getDashboardStats } from "@/lib/admin/dashboard";
import { isTerminalStatus, type LeadStatus } from "@/lib/leads/state-machine";
import { LEAD_STATUS_LABEL } from "@/lib/leads/status-labels";

const PENDING_CONTACT: LeadStatus[] = ["notificado", "visto", "aceptado", "contacto_pendiente"];
const NEEDS_ATTENTION: LeadStatus[] = ["sin_cobertura", "con_incidencia", "reasignacion_pendiente"];

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const totalLeads = stats.leadsByStatus.reduce((sum, r) => sum + r.count, 0);
  const activeLeads = stats.leadsByStatus
    .filter((r) => !isTerminalStatus(r.status as LeadStatus))
    .reduce((sum, r) => sum + r.count, 0);
  const pendingContactCount = stats.leadsByStatus
    .filter((r) => PENDING_CONTACT.includes(r.status as LeadStatus))
    .reduce((sum, r) => sum + r.count, 0);
  const needsAttentionCount = stats.leadsByStatus
    .filter((r) => NEEDS_ATTENTION.includes(r.status as LeadStatus))
    .reduce((sum, r) => sum + r.count, 0);
  const topStatuses = [...stats.leadsByStatus].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Panel de administración</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Gestiona categorías, servicios, precios, contenido SEO y leads sin tocar código.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm font-semibold text-neutral-500">Estimaciones calculadas</p>
          <p className="mt-1 text-3xl font-bold text-neutral-950">{stats.totalEstimates}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-neutral-500">Versión de regla de precio activa</p>
          <p className="mt-1 text-3xl font-bold text-neutral-950">
            {stats.activePricingRuleVersion ? `v${stats.activePricingRuleVersion}` : "—"}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-neutral-500">Guías / Preguntas publicadas</p>
          <p className="mt-1 text-3xl font-bold text-neutral-950">
            {stats.publishedGuides} / {stats.publishedQuestions}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-neutral-500">FAQs activas</p>
          <p className="mt-1 text-3xl font-bold text-neutral-950">{stats.activeFaqs}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-neutral-500">Profesionales activos</p>
          <p className="mt-1 text-3xl font-bold text-neutral-950">
            {stats.activeProfessionals} / {stats.totalProfessionals}
          </p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="font-bold text-neutral-950">Leads</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase text-neutral-500">Total</p>
            <p className="mt-1 text-2xl font-bold text-neutral-950">{totalLeads}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-neutral-500">Activos</p>
            <p className="mt-1 text-2xl font-bold text-neutral-950">{activeLeads}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-neutral-500">Esperando contacto</p>
            <p className="mt-1 text-2xl font-bold text-neutral-950">{pendingContactCount}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-warning-text">Necesitan atención</p>
            <p className="mt-1 text-2xl font-bold text-warning-text">{needsAttentionCount}</p>
          </div>
        </div>

        <div className="mt-6 border-t border-neutral-100 pt-4">
          <p className="text-xs font-semibold uppercase text-neutral-500">Estados más frecuentes</p>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {topStatuses.map(({ status, count: c }) => (
              <div key={status}>
                <p className="text-xs font-semibold text-neutral-500">
                  {LEAD_STATUS_LABEL[status as LeadStatus] ?? status}
                </p>
                <p className="mt-1 text-xl font-bold text-neutral-950">{c}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <Link href="/admin/leads" className="text-sm font-semibold text-brand-700 hover:underline">
            Ver todos los leads →
          </Link>
          <Link href="/admin/leads?deadline=upcoming" className="text-sm font-semibold text-brand-700 hover:underline">
            Ver plazos próximos/vencidos →
          </Link>
          <Link href="/admin/profesionales" className="text-sm font-semibold text-brand-700 hover:underline">
            Gestionar profesionales →
          </Link>
        </div>
      </Card>
    </div>
  );
}
