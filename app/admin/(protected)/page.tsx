import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getDashboardStats } from "@/lib/admin/dashboard";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

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
      </div>

      <Card className="mt-6">
        <h2 className="font-bold text-neutral-950">Leads por estado</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {["nuevo", "en_revision", "contactado", "sin_cobertura", "cerrado"].map((status) => {
            const row = stats.leadsByStatus.find((r) => r.status === status);
            return (
              <div key={status}>
                <p className="text-xs font-semibold uppercase text-neutral-500">{status.replace("_", " ")}</p>
                <p className="mt-1 text-2xl font-bold text-neutral-950">{row?.count ?? 0}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4">
          <Link href="/admin/leads" className="text-sm font-semibold text-brand-700 hover:underline">
            Ver todos los leads →
          </Link>
        </div>
      </Card>
    </div>
  );
}
