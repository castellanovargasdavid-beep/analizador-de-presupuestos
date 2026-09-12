import type { GuideBlock } from "@/lib/content/blocks";

/**
 * Renderiza el cuerpo de una guía (`seo_guides.body`, editable desde
 * /admin) — un array de bloques simples, nunca HTML libre.
 */
export function GuideBody({ blocks }: { blocks: GuideBlock[] }) {
  return (
    <div className="prose-neutral mt-6 space-y-5 text-neutral-700">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <h2 key={i} className="text-xl font-bold text-neutral-950">
              {block.text}
            </h2>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={i} className="list-disc space-y-2 pl-5">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{block.text}</p>;
      })}
    </div>
  );
}
