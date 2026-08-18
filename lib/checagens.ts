/**
 * Checagens de fatos sobre uma pessoa/tema.
 *
 * Duas vias, nesta ordem:
 * 1. **Google Fact Check Tools API** (ClaimReview agregado de Aos Fatos, Lupa, Comprova, Estadão Verifica,
 *    AFP Checamos, UOL Confere…). Exige chave gratuita do Google Cloud em `GOOGLE_FACTCHECK_KEY`.
 * 2. **Fallback sem chave**: RSS público dos próprios checadores, filtrando por menção ao nome.
 *    Cobertura menor, zero configuração — o app nunca fica sem a aba de checagens.
 *
 * Nunca reescrevemos o veredito: mostramos o rótulo do checador, o veículo, a data e o link.
 */
import { getJSON } from "./fetcher";

export type Checagem = {
  texto: string;
  veiculo: string;
  veredito?: string;
  url: string;
  data?: string;
  via: "google" | "rss";
};

export const temChaveFactCheck = () => Boolean(process.env.GOOGLE_FACTCHECK_KEY);

type GoogleResp = {
  claims?: {
    text: string;
    claimant?: string;
    claimDate?: string;
    claimReview?: { publisher?: { name?: string; site?: string }; url?: string; title?: string; textualRating?: string; reviewDate?: string }[];
  }[];
};

async function viaGoogle(query: string, max: number): Promise<Checagem[]> {
  const key = process.env.GOOGLE_FACTCHECK_KEY;
  if (!key) return [];
  const u = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(query)}&languageCode=pt-BR&pageSize=${max}&key=${key}`;
  const r = await getJSON<GoogleResp>(u, { revalidate: 21600, timeoutMs: 15000 }).catch(() => null);
  if (!r?.claims) return [];
  return r.claims.flatMap((c) =>
    (c.claimReview ?? []).map((rev) => ({
      texto: c.text,
      veiculo: rev.publisher?.name ?? rev.publisher?.site ?? "—",
      veredito: rev.textualRating,
      url: rev.url ?? "",
      data: rev.reviewDate ?? c.claimDate,
      via: "google" as const,
    })),
  ).filter((x) => x.url);
}

/** RSS público dos checadores brasileiros (sem chave). */
const FEEDS: { veiculo: string; url: string }[] = [
  { veiculo: "Aos Fatos", url: "https://www.aosfatos.org/noticias/feed/" },
  { veiculo: "Comprova", url: "https://projetocomprova.com.br/feed/" },
];

const decode = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const norm = (s: string) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

async function viaRSS(nome: string, max: number): Promise<Checagem[]> {
  const alvo = norm(nome);
  const out: Checagem[] = [];
  await Promise.all(
    FEEDS.map(async (f) => {
      try {
        const res = await fetch(f.url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; MonitorDeGravata/0.1)" }, next: { revalidate: 21600 }, signal: AbortSignal.timeout(12000) });
        if (!res.ok) return;
        const xml = await res.text();
        for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
          const bloco = m[1];
          const g = (tag: string) => {
            const mm = bloco.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
            return mm ? decode(mm[1]).trim() : "";
          };
          const titulo = g("title");
          const desc = g("description").replace(/<[^>]+>/g, " ");
          // exige o nome como expressão contígua (evita exibir checagem sobre outra pessoa da família)
          const hay = norm(titulo + " " + desc);
          if (alvo && hay.includes(alvo)) {
            out.push({ texto: titulo, veiculo: f.veiculo, url: g("link"), data: g("pubDate"), via: "rss" });
          }
        }
      } catch {
        /* feed fora do ar não derruba a página */
      }
    }),
  );
  return out.slice(0, max);
}

export async function checagensSobre(nome: string, max = 8): Promise<{ itens: Checagem[]; via: "google" | "rss" | "nenhuma"; nota: string }> {
  const g = await viaGoogle(`"${nome}"`, max);
  if (g.length) return { itens: g, via: "google", nota: "Agregado pela API do Google Fact Check Tools (ClaimReview publicado pelos próprios checadores)." };
  const r = await viaRSS(nome, max);
  if (r.length) return { itens: r, via: "rss", nota: "Matérias de agências de checagem que CITAM este nome (não necessariamente uma checagem sobre esta pessoa). Sem veredito estruturado — leia a matéria." };
  return {
    itens: [],
    via: "nenhuma",
    nota: temChaveFactCheck()
      ? "Nenhuma checagem publicada sobre este nome nas bases consultadas."
      : "Nenhuma checagem localizada no RSS dos checadores. Para cobertura completa (Lupa, Estadão Verifica, AFP, UOL Confere), configure GOOGLE_FACTCHECK_KEY.",
  };
}
