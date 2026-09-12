/**
 * Inserta un bloque JSON-LD. Solo se usa con datos que construimos
 * nosotros mismos (nunca con texto libre de usuario sin escapar), pero
 * igualmente se neutraliza cualquier "</script>" para no poder romper el
 * documento por accidente.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
