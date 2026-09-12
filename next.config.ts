import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No filtra qué framework se usa en la respuesta (higiene menor, no afecta a SEO).
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // No hay iframes en ningún sitio del proyecto ni razón para que se
          // enmarque en otro: bloquea clickjacking.
          { key: "X-Frame-Options", value: "DENY" },
          // El navegador nunca "adivina" un tipo MIME distinto al declarado.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // No se filtra la URL completa (con posibles ids de estimate) como
          // referrer al navegar a un enlace externo (p. ej. una fuente citada).
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Ninguna página de este sitio necesita cámara/micro/geolocalización.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
