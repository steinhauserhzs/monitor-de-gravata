import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/buscar"] },
    ],
    sitemap: "https://monitor-de-gravata.vercel.app/sitemap.xml",
  };
}
