import { db } from "@/db/client";
import { faqs } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { FaqForm } from "@/components/admin/FaqForm";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminFaqsPage() {
  const rows = await db.select().from(faqs).orderBy(faqs.pageKey, faqs.sortOrder);

  const byPage = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = byPage.get(r.pageKey) ?? [];
    list.push(r);
    byPage.set(r.pageKey, list);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">FAQs por página</h1>
      <p className="mt-1 text-sm text-neutral-600">
        El bloque de preguntas frecuentes embebido dentro de cada página del sitio (no una página propia — eso son
        las Preguntas).
      </p>

      <div className="mt-6 space-y-8">
        {[...byPage.entries()].map(([pageKey, items]) => (
          <div key={pageKey}>
            <h2 className="font-bold text-neutral-950">{pageKey}</h2>
            <div className="mt-3">
              <DataTable columns={["Orden", "Pregunta", "Estado", "Editar"]}>
                {items.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-3 text-neutral-500">{f.sortOrder}</td>
                    <td className="px-4 py-3 font-medium text-neutral-950">{f.question}</td>
                    <td className="px-4 py-3">
                      <Badge tone={f.isActive ? "good" : "neutral"}>{f.isActive ? "Activa" : "Inactiva"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <details>
                        <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">Editar</summary>
                        <div className="mt-3 max-w-lg">
                          <FaqForm initial={f} />
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </DataTable>
            </div>
          </div>
        ))}
      </div>

      <Card className="mt-8 max-w-lg">
        <h2 className="font-bold text-neutral-950">Añadir FAQ</h2>
        <div className="mt-3">
          <FaqForm />
        </div>
      </Card>
    </div>
  );
}
