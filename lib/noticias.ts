/**
 * Coletânea de notícias — só título, veículo, data e link (sem reproduzir conteúdo).
 * Fonte: Google Notícias RSS (feed público). Uso: renderizar manchetes com link para o veículo.
 */
export type Noticia = { titulo: string; url: string; veiculo: string; data: string };

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

export async function noticiasGoogle(query: string, max = 12): Promise<Noticia[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MonitorDeGravata/0.1)" },
      signal: controller.signal,
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, max);
    return items
      .map((m) => {
        const block = m[1];
        const g = (tag: string) => {
          const mm = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
          return mm ? decode(mm[1]).trim() : "";
        };
        const tituloRaw = g("title");
        const veiculo = g("source");
        const titulo = veiculo && tituloRaw.endsWith(` - ${veiculo}`) ? tituloRaw.slice(0, -(veiculo.length + 3)) : tituloRaw;
        return { titulo, url: g("link"), veiculo, data: g("pubDate") };
      })
      .filter((n) => n.titulo && n.url);
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}
