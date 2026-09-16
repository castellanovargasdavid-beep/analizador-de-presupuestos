import { JsonLd } from "./JsonLd";
import { ChevronDownIcon } from "@/components/ui/icons";

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Preguntas frecuentes REALES (surgidas de la investigación, no relleno) +
 * FAQPage schema. Usar solo cuando las preguntas respondan a algo que de
 * verdad se ha visto preguntar — schema engañoso hace más daño que no
 * tener rich results.
 */
export function FAQSection({ title = "Preguntas frecuentes", items }: { title?: string; items: FAQItem[] }) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-bold text-neutral-950">{title}</h2>
      <div className="mt-4 divide-y divide-neutral-200">
        {items.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-neutral-950 marker:content-none">
              {item.question}
              <ChevronDownIcon className="size-4 shrink-0 text-neutral-500 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-neutral-700">{item.answer}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />
    </section>
  );
}
