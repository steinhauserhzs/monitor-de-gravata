import type { MetadataRoute } from "next";
import { loadCasos } from "@/lib/data";

const BASE = "https://monitor-de-gravata.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const fixas = ["", "/politicos", "/candidatos", "/contratos", "/empresas", "/precos", "/radar", "/casos", "/apis", "/contribuir", "/sobre"];
  const casos = loadCasos().map((c) => ({ url: `${BASE}/casos/${c.slug}`, lastModified: c.atualizado_em ?? c.criado_em }));
  return [
    ...fixas.map((p) => ({ url: `${BASE}${p}`, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.8 })),
    ...casos,
  ];
}
