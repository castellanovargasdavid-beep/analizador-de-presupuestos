import { db } from "@/db/client";
import { seoQuestions } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { serializeDetail, serializeRelatedLinks } from "@/lib/content/body-text";
import type { RelatedLinkEntry } from "@/lib/content/blocks";

export const metadata = { robots: { index: false, follow: false } };

const STATUS_TONE = { borrador: "neutral", publicado: "good", archivado: "warning" } as const;

export default async function AdminPreguntasPage() {
  const rows = await db.select().from(seoQuestions).orderBy(seoQuestions.question);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Preguntas</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Páginas de intención única en /preguntas/[slug]. Conjunto cerrado: solo las publicadas se generan; cualquier
        otro slug da 404.
      </p>

      <div className="mt-6">
        <DataTable columns={["Pregunta", "Slug", "Estado", "Versión", "Editar"]}>
          {rows.map((q) => (
            <tr key={q.id}>
              <td className="px-4 py-3 font-medium text-neutral-950">{q.question}</td>
              <td className="px-4 py-3 text-neutral-500">{q.slug}</td>
              <td className="px-4 py-3">
                <Badge tone={STATUS_TONE[q.status]}>{q.status}</Badge>
              </td>
              <td className="px-4 py-3 text-neutral-500">v{q.version}</td>
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">Editar</summary>
                  <div className="mt-3 max-w-2xl">
                    <QuestionForm
                      initial={{
                        ...q,
                        detailText: serializeDetail(q.detail as string[]),
                        relatedLinksText: serializeRelatedLinks(q.relatedLinks as RelatedLinkEntry[]),
                      }}
                    />
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <Card className="mt-6 max-w-2xl">
        <h2 className="font-bold text-neutral-950">Añadir pregunta</h2>
        <div className="mt-3">
          <QuestionForm />
        </div>
      </Card>
    </div>
  );
}
