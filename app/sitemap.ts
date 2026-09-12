import type { MetadataRoute } from "next";
import { SITE_URL as BASE_URL } from "@/lib/site";
import { GUIAS } from "@/lib/content/guias";
import { PREGUNTAS } from "@/lib/content/preguntas";

/**
 * Páginas estáticas + las generadas por los registros de contenido
 * (guías, preguntas) — así una guía o pregunta nueva entra sola en el
 * sitemap con solo añadir la entrada al registro, sin tocar este archivo.
 * Nunca incluye `/resultado/*` ni `/comparar/*` (noindex,follow) ni
 * páginas de territorio sin generar (ver docs/04, sección de indexación).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "",
    "/aire-acondicionado",
    "/aire-acondicionado/instalacion",
    "/aire-acondicionado/instalacion/analizar-presupuesto",
    "/precios/aire-acondicionado-instalacion",
    "/comparativas/split-vs-conductos",
    "/guias",
    "/preguntas",
    "/metodologia",
    "/fuentes",
    "/sobre-nosotros",
    "/contacto",
    "/legal/privacidad",
    "/legal/cookies",
    "/legal/aviso-legal",
  ];

  const guiaPaths = GUIAS.map((g) => `/guias/${g.slug}`);
  const preguntaPaths = PREGUNTAS.map((p) => `/preguntas/${p.slug}`);

  return [...staticPaths, ...guiaPaths, ...preguntaPaths].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
  }));
}
