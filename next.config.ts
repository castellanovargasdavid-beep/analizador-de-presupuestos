import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No filtra qué framework se usa en la respuesta (higiene menor, no afecta a SEO).
  poweredByHeader: false,
};

export default nextConfig;
