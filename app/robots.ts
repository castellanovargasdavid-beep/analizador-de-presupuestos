import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/resultado/", "/comparar/"] },
    ],
    sitemap: "https://www.presupuestoclaro.es/sitemap.xml",
  };
}
