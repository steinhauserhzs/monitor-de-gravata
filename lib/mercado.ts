/**
 * Preço de varejo (mercado) para comparar com o que o governo pagou.
 *
 * Nenhuma fonte de varejo confiável é aberta: o Mercado Livre passou a exigir token (HTTP 403
 * em 18/08/2026) e o Painel de Preços bloqueia robôs. Então o provedor é **plugável** e opcional:
 *   - `SERPAPI_KEY`      → Google Shopping via SerpAPI (plano gratuito ~100 buscas/mês)
 *   - `ML_ACCESS_TOKEN`  → Mercado Livre (token de app gratuito)
 * Sem chave, o app usa apenas o comparativo entre compras públicas (que é a base mais defensável
 * juridicamente) e informa isso na tela — nunca inventa um "preço de mercado".
 *
 * Aviso metodológico exibido junto: preço de varejo ≠ preço de compra pública. O contrato pode
 * incluir garantia estendida, instalação, entrega em vários municípios, tributos e escala. Serve
 * como referência para perguntar, não como prova de sobrepreço.
 */
export type OfertaMercado = { titulo: string; preco: number; loja?: string; url?: string };
export type PrecoMercado = {
  disponivel: boolean;
  fonte: "serpapi" | "mercadolivre" | "nenhuma";
  ofertas: OfertaMercado[];
  media3: number | null;
  nota: string;
};

const mediaDosTres = (v: number[]) => {
  const tres = v.filter((x) => Number.isFinite(x) && x > 0).sort((a, b) => a - b).slice(0, 3);
  return tres.length ? tres.reduce((a, b) => a + b, 0) / tres.length : null;
};

async function viaSerpApi(termo: string): Promise<PrecoMercado | null> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;
  try {
    const u = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(termo)}&gl=br&hl=pt-br&num=10&api_key=${key}`;
    const r = await fetch(u, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const j = (await r.json()) as { shopping_results?: { title: string; extracted_price?: number; source?: string; link?: string }[] };
    const ofertas = (j.shopping_results ?? [])
      .filter((o) => typeof o.extracted_price === "number")
      .slice(0, 6)
      .map((o) => ({ titulo: o.title, preco: o.extracted_price!, loja: o.source, url: o.link }));
    if (!ofertas.length) return null;
    return { disponivel: true, fonte: "serpapi", ofertas, media3: mediaDosTres(ofertas.map((o) => o.preco)), nota: "Google Shopping via SerpAPI — média dos 3 menores preços de varejo encontrados." };
  } catch {
    return null;
  }
}

async function viaMercadoLivre(termo: string): Promise<PrecoMercado | null> {
  const token = process.env.ML_ACCESS_TOKEN;
  if (!token) return null;
  try {
    const r = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { results?: { title: string; price: number; permalink: string; seller?: { nickname?: string } }[] };
    const ofertas = (j.results ?? []).filter((o) => o.price > 0).slice(0, 6).map((o) => ({ titulo: o.title, preco: o.price, loja: o.seller?.nickname ?? "Mercado Livre", url: o.permalink }));
    if (!ofertas.length) return null;
    return { disponivel: true, fonte: "mercadolivre", ofertas, media3: mediaDosTres(ofertas.map((o) => o.preco)), nota: "Mercado Livre — média dos 3 menores anúncios encontrados." };
  } catch {
    return null;
  }
}

export const temProvedorMercado = () => Boolean(process.env.SERPAPI_KEY || process.env.ML_ACCESS_TOKEN);

export async function precoDeMercado(termo: string): Promise<PrecoMercado> {
  const r = (await viaSerpApi(termo)) ?? (await viaMercadoLivre(termo));
  if (r) return r;
  return {
    disponivel: false,
    fonte: "nenhuma",
    ofertas: [],
    media3: null,
    nota: temProvedorMercado()
      ? "O provedor de preço de varejo não retornou ofertas para este termo."
      : "Comparação com varejo desligada: nenhuma fonte aberta e confiável de preço de varejo existe hoje (Mercado Livre exige token; Painel de Preços bloqueia robôs). Configure SERPAPI_KEY ou ML_ACCESS_TOKEN para ligar.",
  };
}

/** Termo de busca de varejo a partir da descrição oficial do item (que é cheia de especificação). */
export function termoVarejo(descricao: string, max = 8) {
  return (descricao || "")
    .replace(/\s*,\s*/g, " ")
    .replace(/\b(TELA|MEMÓRIA RAM|MEMORIA RAM|NÚCLEOS POR PROCESSADOR|ARMAZENAMENTO|BATERIA|ALIMENTAÇÃO|SISTEMA OPERACIONAL|GARANTIA ON SITE|INTERATIVIDADE DA TELA|APLICAÇÃO|CARACTERÍSTICAS ADICIONAIS|TIPO|COR|MATERIAL)\s*:\s*/gi, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .join(" ");
}
