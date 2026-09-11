import type { MetadataRoute } from "next";

const BASE_URL = "https://www.presupuestoclaro.es";

/**
 * Sitemap mínimo de la Fase de UX. Se generará dinámicamente desde
 * ServiceCategory/GuidePage en la Fase 8 (SEO técnico); de momento lista a
 * mano las páginas indexables que ya existen, tal como se decidió en
 * docs/02-estrategia-seo.md (sección 9).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/aire-acondicionado",
    "/aire-acondicionado/instalacion",
    "/aire-acondicionado/instalacion/analizar-presupuesto",
    "/guias",
    "/guias/como-comparar-presupuestos-de-instalacion",
    "/metodologia",
    "/legal/privacidad",
    "/legal/cookies",
    "/legal/aviso-legal",
  ];

  return paths.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
  }));
}
