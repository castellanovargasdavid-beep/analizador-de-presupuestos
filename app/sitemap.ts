import type { MetadataRoute } from "next";
import { SITE_URL as BASE_URL } from "@/lib/site";
import { listPublishedGuideSlugs, listPublishedQuestionSlugs } from "@/lib/content/repository";

/**
 * Páginas estáticas + las generadas por el contenido publicado desde
 * /admin (guías, preguntas) — así una guía o pregunta nueva entra sola en
 * el sitemap en cuanto se publica, sin tocar código. Nunca incluye
 * `/resultado/*` ni `/comparar/*` (noindex,follow) ni páginas de
 * territorio sin generar (ver docs/04, sección de indexación).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    "/legal/terminos",
    "/legal/aviso-legal",
  ];

  const [guiaSlugs, preguntaSlugs] = await Promise.all([listPublishedGuideSlugs(), listPublishedQuestionSlugs()]);
  const guiaPaths = guiaSlugs.map((slug) => `/guias/${slug}`);
  const preguntaPaths = preguntaSlugs.map((slug) => `/preguntas/${slug}`);

  return [...staticPaths, ...guiaPaths, ...preguntaPaths].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
  }));
}
