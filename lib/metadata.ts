import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "./site";

/**
 * Autor para JSON-LD de tipo Article: el contenido lo produce el propio
 * proyecto, no una persona con firma — declarar una Organization como
 * autor es honesto; inventar un nombre de autor humano no lo sería.
 */
export const ARTICLE_AUTHOR = { "@type": "Organization", name: SITE_NAME, url: SITE_URL } as const;

// Debe coincidir con `size`/`contentType` de app/opengraph-image.tsx.
const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, type: "image/png" };

interface PageMetadataOptions {
  title: string;
  description?: string;
  /** Ruta relativa (p. ej. "/metodologia"), se resuelve contra metadataBase. */
  path: string;
  robots?: Metadata["robots"];
  /** Solo la home: su título ya incluye la marca, no se le añade el sufijo para OG/Twitter. */
  isHome?: boolean;
}

/**
 * Una única función que arma title + description + canonical + Open
 * Graph + Twitter Card de forma consistente, para que ninguna página
 * nueva se quede sin metadata social por olvido. El `<title>` visible ya
 * lleva el sufijo de marca vía `title.template` en el layout raíz; aquí se
 * replica ese mismo sufijo en los campos sociales, que no heredan el
 * template automáticamente.
 */
export function pageMetadata({ title, description, path, robots, isHome = false }: PageMetadataOptions): Metadata {
  const socialTitle = isHome ? title : `${title} · ${SITE_NAME}`;

  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: path },
    ...(robots ? { robots } : {}),
    openGraph: {
      title: socialTitle,
      ...(description ? { description } : {}),
      url: path,
      siteName: SITE_NAME,
      locale: "es_ES",
      type: "website",
      // `opengraph-image.tsx` (app/) solo se aplica automáticamente a su
      // propio segmento (la home): en cuanto una página define su propio
      // `openGraph`, como aquí, deja de heredar esa imagen. Se referencia
      // explícitamente para que TODA página tenga vista previa social.
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      ...(description ? { description } : {}),
      images: [OG_IMAGE],
    },
  };
}
