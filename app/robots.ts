import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Resultados y comparaciones son por-usuario (compartibles por URL, pero no
        // contenido editorial): noindex,follow ya en su metadata; aquí además se
        // evita que se rastreen a fondo. Ver docs/04 sección de indexación.
        disallow: ["/resultado/", "/comparar/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
