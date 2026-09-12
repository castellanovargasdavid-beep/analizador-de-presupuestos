import type { GuideBlock, RelatedLinkEntry } from "./blocks";

/**
 * Formato de texto plano para editar `seo_guides.body` desde un
 * `<textarea>` sin pedirle a un admin no técnico que escriba JSON:
 *
 *   ## Un encabezado
 *   Un párrafo normal.
 *   - un punto de una lista
 *   - otro punto
 *
 * Cada línea no vacía es un bloque; líneas "- " consecutivas se agrupan
 * en un único bloque de lista. Las líneas en blanco solo separan, no
 * generan un bloque vacío.
 */
export function parseGuideBodyText(text: string): GuideBlock[] {
  const lines = text.split("\n").map((l) => l.trim());
  const blocks: GuideBlock[] = [];
  let currentList: string[] | null = null;

  const flushList = () => {
    if (currentList && currentList.length > 0) {
      blocks.push({ type: "list", items: currentList });
    }
    currentList = null;
  };

  for (const line of lines) {
    if (line.length === 0) continue;

    if (line.startsWith("- ")) {
      currentList = currentList ?? [];
      currentList.push(line.slice(2).trim());
      continue;
    }

    flushList();

    if (line.startsWith("## ")) {
      blocks.push({ type: "heading", text: line.slice(3).trim() });
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  }
  flushList();

  return blocks;
}

/**
 * Enlaces relacionados como texto plano, uno por línea:
 *   /ruta | Etiqueta visible | Descripción opcional
 */
export function parseRelatedLinksText(text: string): RelatedLinkEntry[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [href, label, description] = line.split("|").map((part) => part.trim());
      return { href, label, ...(description ? { description } : {}) };
    })
    .filter((link): link is RelatedLinkEntry => Boolean(link.href && link.label));
}

export function serializeRelatedLinks(links: RelatedLinkEntry[]): string {
  return links.map((l) => [l.href, l.label, l.description].filter(Boolean).join(" | ")).join("\n");
}

/** Detalle de una pregunta: un párrafo por línea no vacía. */
export function parseDetailText(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export function serializeDetail(paragraphs: string[]): string {
  return paragraphs.join("\n");
}

export function serializeGuideBody(blocks: GuideBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === "heading") return `## ${block.text}`;
      if (block.type === "list") return block.items.map((item) => `- ${item}`).join("\n");
      return block.text;
    })
    .join("\n\n");
}
