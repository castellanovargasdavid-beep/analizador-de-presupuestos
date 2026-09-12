import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /resultado/* y /comparar/* ya llevan `robots: {index: false, follow:
        // true}` en su propia metadata (son por-usuario, no contenido
        // editorial). NO se bloquean aquí también: si robots.txt las
        // disallowea, Google no puede rastrearlas para leer esa etiqueta
        // noindex, y una URL bloqueada con enlaces entrantes puede acabar
        // indexada igualmente como "URL sin descripción" — el resultado
        // contrario al que se busca. Dejar que se rastreen es lo que permite
        // que el noindex real surta efecto. Ver docs/04 sección de indexación.
        //
        // /api/* no es contenido: bloquearlo evita gastar rastreo en rutas
        // que solo aceptan POST (nunca se enlaza a ellas, pero por higiene).
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
