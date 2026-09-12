/**
 * Bloques de contenido estructurado para el cuerpo de una guía SEO
 * (`seo_guides.body`). Deliberadamente simple (encabezado / párrafo /
 * lista) en vez de markdown o HTML libre: es lo mínimo que necesita el
 * contenido real del sitio hoy, editable desde un formulario de admin sin
 * meter un editor de texto enriquecido — y sin abrir la puerta a HTML
 * arbitrario en algo que se va a renderizar.
 */
export type GuideBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export interface RelatedLinkEntry {
  href: string;
  label: string;
  description?: string;
}
