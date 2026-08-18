import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/buscar"] },
    ],
    sitemap: "https://monitordegravata.vercel.app/sitemap.xml",
  };
}
