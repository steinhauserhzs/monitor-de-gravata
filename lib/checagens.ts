/**
 * Checagens de fatos sobre uma pessoa.
 *
 * Três vias, em ordem de qualidade — as duas primeiras NÃO precisam de chave nenhuma:
 *  1. **Busca restrita aos checadores** via Google Notícias (`site:aosfatos.org OR site:lupa.uol.com.br …`).
 *     Cobre o arquivo inteiro de cada agência, não só as últimas publicações.
 *  2. **RSS direto** de Aos Fatos, Lupa e Comprova (últimas publicações).
 *  3. **Google Fact Check Tools API** (ClaimReview com veredito estruturado), se `GOOGLE_FACTCHECK_KEY` existir.
 *
 * Honestidade obrigatória: só chamamos de "veredito" o que vem estruturado do ClaimReview (via 3).
 * Nas vias 1 e 2 dizemos o que é: matérias de agências de checagem que citam o nome.
 * Filtro anti-homônimo: o nome precisa aparecer como expressão contígua no título.
 */
import { getJSON } from "./fetcher";

export type Checagem = {
  texto: string;
  veiculo: string;
  veredito?: string;
  url: string;
  data?: string;
  via: "google" | "busca" | "rss";
};

export const temChaveFactCheck = () => Boolean(process.env.GOOGLE_FACTCHECK_KEY);

const CHECADORES = [
  { veiculo: "Aos Fatos", dominio: "aosfatos.org", rss: "https://www.aosfatos.org/noticias/feed/" },
  { veiculo: "Lupa", dominio: "lupa.uol.com.br", rss: "https://lupa.uol.com.br/feed" },
  { veiculo: "Comprova", dominio: "projetocomprova.com.br", rss: "https://projetocomprova.com.br/feed/" },
  { veiculo: "AFP Checamos", dominio: "checamos.afp.com" },
  { veiculo: "UOL Confere", dominio: "noticias.uol.com.br/confere" },
  { veiculo: "Estadão Verifica", dominio: "estadao.com.br/estadao-verifica" },
  { veiculo: "Boatos.org", dominio: "boatos.org" },
];

const decode = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
const norm = (s: string) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** O nome precisa aparecer inteiro e contíguo — evita atribuir checagem de um parente/xará. */
function citaNome(nome: string, texto: string) {
  const n = norm(nome).replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  return Boolean(n) && norm(texto).includes(n);
}

function itensDoRSS(xml: string, veiculoPadrao: string): { titulo: string; url: string; data: string; veiculo: string }[] {
  const out: { titulo: string; url: string; data: string; veiculo: string }[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const bloco = m[1];
    const g = (tag: string) => {
      const mm = bloco.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return mm ? decode(mm[1]).trim() : "";
    };
    const tituloRaw = g("title");
    const fonte = g("source") || veiculoPadrao;
    const titulo = fonte && tituloRaw.endsWith(` - ${fonte}`) ? tituloRaw.slice(0, -(fonte.length + 3)) : tituloRaw;
    if (titulo && g("link")) out.push({ titulo, url: g("link"), data: g("pubDate"), veiculo: fonte });
  }
  return out;
}

async function baixar(url: string, revalidate = 21600) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; MonitorDeGravata/0.1)" }, next: { revalidate }, signal: AbortSignal.timeout(12000) });
    return r.ok ? await r.text() : "";
  } catch {
    return "";
  }
}

/** VIA 1 — busca dentro dos sites de checagem, sem chave. */
async function viaBuscaChecadores(nome: string, max: number): Promise<Checagem[]> {
  const sites = CHECADORES.map((c) => `site:${c.dominio}`).join(" OR ");
  const q = encodeURIComponent(`"${nome}" (${sites})`);
  const xml = await baixar(`https://news.google.com/rss/search?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-419`);
  if (!xml) return [];
  return itensDoRSS(xml, "")
    .filter((i) => citaNome(nome, i.titulo))
    .slice(0, max)
    .map((i) => ({ texto: i.titulo, veiculo: i.veiculo || "agência de checagem", url: i.url, data: i.data, via: "busca" as const }));
}

/** VIA 2 — RSS das agências (últimas publicações). */
async function viaRSS(nome: string, max: number): Promise<Checagem[]> {
  const comRss = CHECADORES.filter((c) => c.rss);
  const paginas = await Promise.all(comRss.map((c) => baixar(c.rss!).then((xml) => ({ c, xml }))));
  const out: Checagem[] = [];
  for (const { c, xml } of paginas) {
    if (!xml) continue;
    for (const i of itensDoRSS(xml, c.veiculo)) {
      if (citaNome(nome, i.titulo)) out.push({ texto: i.titulo, veiculo: c.veiculo, url: i.url, data: i.data, via: "rss" });
    }
  }
  return out.slice(0, max);
}

/** VIA 3 — ClaimReview com veredito estruturado (exige chave gratuita). */
async function viaGoogle(nome: string, max: number): Promise<Checagem[]> {
  const key = process.env.GOOGLE_FACTCHECK_KEY;
  if (!key) return [];
  type Resp = { claims?: { text: string; claimDate?: string; claimReview?: { publisher?: { name?: string; site?: string }; url?: string; textualRating?: string; reviewDate?: string }[] }[] };
  const u = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(`"${nome}"`)}&languageCode=pt-BR&pageSize=${max}&key=${key}`;
  const r = await getJSON<Resp>(u, { revalidate: 21600, timeoutMs: 15000 }).catch(() => null);
  return (r?.claims ?? [])
    .flatMap((c) =>
      (c.claimReview ?? []).map((rev) => ({
        texto: c.text,
        veiculo: rev.publisher?.name ?? rev.publisher?.site ?? "—",
        veredito: rev.textualRating,
        url: rev.url ?? "",
        data: rev.reviewDate ?? c.claimDate,
        via: "google" as const,
      })),
    )
    .filter((x) => x.url);
}

const dedupe = (itens: Checagem[]) => {
  const vistos = new Set<string>();
  return itens.filter((i) => {
    const k = norm(i.texto).slice(0, 80);
    return vistos.has(k) ? false : (vistos.add(k), true);
  });
};

export async function checagensSobre(nome: string, max = 8): Promise<{ itens: Checagem[]; via: "google" | "busca" | "rss" | "nenhuma"; nota: string }> {
  const [comChave, busca, rss] = await Promise.all([viaGoogle(nome, max), viaBuscaChecadores(nome, max), viaRSS(nome, max)]);

  if (comChave.length) {
    const extras = dedupe([...comChave, ...busca, ...rss]).slice(0, max);
    return { itens: extras, via: "google", nota: "Checagens com veredito vêm do ClaimReview publicado pelas próprias agências (Google Fact Check Tools); as demais são matérias de agências de checagem que citam este nome." };
  }
  const semChave = dedupe([...busca, ...rss]).slice(0, max);
  if (semChave.length) {
    return {
      itens: semChave,
      via: busca.length ? "busca" : "rss",
      nota: `Matérias publicadas por agências de checagem (${CHECADORES.map((c) => c.veiculo).slice(0, 5).join(", ")}…) que citam este nome. São reportagens de checagem, não um veredito sobre esta pessoa — leia a matéria.`,
    };
  }
  return {
    itens: [],
    via: "nenhuma",
    nota: "Nenhuma matéria de agência de checagem citando este nome foi localizada. Buscamos no arquivo de Aos Fatos, Lupa, Comprova, AFP Checamos, UOL Confere, Estadão Verifica e Boatos.org.",
  };
}
