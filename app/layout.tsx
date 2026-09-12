import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { JsonLd } from "@/components/content/JsonLd";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const DEFAULT_TITLE = "Presupuesto Claro — ¿Te están cobrando de más?";
const DEFAULT_DESCRIPTION =
  "Calcula el rango de precio razonable para tu instalación de aire acondicionado y comprueba si el presupuesto que te han dado está dentro de lo habitual en España.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s · Presupuesto Claro",
  },
  description: DEFAULT_DESCRIPTION,
  // Red de seguridad: toda página propia define su propio openGraph/twitter
  // vía lib/metadata.ts (pageMetadata), pero si alguna nueva se olvidara,
  // hereda esto en vez de quedarse sin vista previa social.
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "es_ES",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, type: "image/png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE_NAME,
            url: SITE_URL,
            inLanguage: "es-ES",
          }}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
            description:
              "Estimaciones orientativas de precio para servicios del hogar en España, con metodología y fuentes públicas.",
          }}
        />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
