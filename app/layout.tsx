import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.presupuestoclaro.es"),
  title: {
    default: "Presupuesto Claro — ¿Te están cobrando de más?",
    template: "%s · Presupuesto Claro",
  },
  description:
    "Calcula el rango de precio razonable para tu instalación de aire acondicionado y comprueba si el presupuesto que te han dado está dentro de lo habitual en España.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
