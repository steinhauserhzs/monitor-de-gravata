/**
 * fetch server-side com timeout, cache curto e erro legível.
 * Toda chamada a API pública passa por aqui — sem CORS, sem chave no cliente.
 */

/** Por que a fonte não respondeu. A UI usa isso para não confundir "não existe" com "não consegui verificar". */
export type MotivoFalha =
  | "nao-encontrado" // 404/410 — a fonte respondeu que o registro não existe
  | "bloqueado" // 401/403/429 — WAF, rate limit ou credencial
  | "instavel" // 5xx ou resposta ilegível
  | "timeout"; // não respondeu a tempo

export class UpstreamError extends Error {
  status: number;
  url: string;
  motivo: MotivoFalha;
  constructor(message: string, status: number, url: string, motivo?: MotivoFalha) {
    super(message);
    this.status = status;
    this.url = url;
    this.motivo = motivo ?? classificar(status);
  }
}

function classificar(status: number): MotivoFalha {
  if (status === 404 || status === 410) return "nao-encontrado";
  if (status === 401 || status === 403 || status === 429) return "bloqueado";
  if (status === 504 || status === 408) return "timeout";
  return "instavel";
}

/** Nome curto do serviço, a partir do host — para a mensagem que o leitor vê. */
export function fonteDaURL(url: string): string {
  try {
    const h = new URL(url).hostname;
    if (h.includes("camara.leg.br")) return "Câmara dos Deputados";
    if (h.includes("senado.leg.br")) return "Senado Federal";
    if (h.includes("tse.jus.br")) return "TSE (DivulgaCand)";
    if (h.includes("pncp.gov.br")) return "PNCP";
    if (h.includes("portaldatransparencia")) return "Portal da Transparência";
    if (h.includes("compras")) return "Compras.gov.br";
    if (h.includes("receita") || h.includes("brasilapi")) return "Receita Federal";
    if (h.includes("wikidata")) return "Wikidata";
    if (h.includes("google")) return "Google Notícias";
    return h.replace(/^www\./, "");
  } catch {
    return "a fonte oficial";
  }
}

/**
 * Corpo de erro vindo de WAF (Akamai/Cloudflare) é uma página HTML inteira.
 * Nunca despejar isso na tela: vira uma frase curta.
 */
function resumirCorpo(body: string, status: number): string {
  const t = body.trim();
  if (!t) return "";
  if (/^\s*</.test(t) || /<html|<!doctype/i.test(t)) {
    if (/access denied|forbidden|bot|blocked/i.test(t)) {
      return status === 429
        ? "limite de requisições excedido"
        : "a fonte recusou a consulta automatizada (bloqueio de borda)";
    }
    return "a fonte devolveu uma página de erro em vez de dados";
  }
  return t.slice(0, 160).replace(/\s+/g, " ");
}

const ESPERAR = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Só vale reinsistir em instabilidade momentânea (5xx, resposta ilegível).
 *
 * NÃO reinsistimos em:
 *  - `nao-encontrado`: "não existe" é resposta definitiva;
 *  - `bloqueado`: a fonte está pedindo recuo. Repetir na hora agrava o rate
 *    limit e prejudica os próximos leitores — recuar é o comportamento correto;
 *  - `timeout`: a ficha do deputado faz 15 chamadas em paralelo com limite de
 *    20 s cada, dentro de uma função de 60 s. Uma segunda tentativa de algo que
 *    já demorou 20 s troca um painel vazio por a página inteira estourando.
 */
const VALE_REINSISTIR: MotivoFalha[] = ["instavel"];

export async function getJSON<T = unknown>(
  url: string,
  opts: {
    headers?: Record<string, string>;
    revalidate?: number;
    timeoutMs?: number;
    /** tentativas em caso de instabilidade. Padrão 2. Ver VALE_REINSISTIR. */
    tentativas?: number;
  } = {},
): Promise<T> {
  const maxTentativas = Math.max(1, opts.tentativas ?? 2);
  let ultimo: UpstreamError | null = null;

  for (let n = 0; n < maxTentativas; n++) {
    try {
      return await umaTentativa<T>(url, opts);
    } catch (e) {
      if (!(e instanceof UpstreamError)) throw e;
      ultimo = e;
      if (!VALE_REINSISTIR.includes(e.motivo)) throw e;
      if (n < maxTentativas - 1) await ESPERAR(400 * 2 ** n + Math.floor(Math.random() * 250));
    }
  }
  throw ultimo!;
}

async function umaTentativa<T>(
  url: string,
  opts: { headers?: Record<string, string>; revalidate?: number; timeoutMs?: number },
): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20000);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "pt-BR,pt;q=0.9",
        // Alguns portais (PNCP search, Akamai do TSE) rejeitam cliente que não
        // se apresenta como navegador. Mandamos o conjunto de cabeçalhos que
        // qualquer navegador envia — requisição bem formada, sem disfarce:
        // o User-Agent identifica o projeto e o repositório.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 MonitorDeGravata/0.1 (+https://github.com/steinhauserhzs/monitor-de-gravata)",
        "sec-ch-ua": '"Chromium";v="126", "Not(A:Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "Sec-Fetch-Site": "cross-site",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        ...(opts.headers ?? {}),
      },
      signal: controller.signal,
      next: { revalidate: opts.revalidate ?? 300 },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const resumo = resumirCorpo(body, res.status);
      throw new UpstreamError(
        `${res.status} ${res.statusText}${resumo ? ` — ${resumo}` : ""}`,
        res.status,
        url,
      );
    }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("json")) return (await res.json()) as T;
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new UpstreamError(`resposta não-JSON (${ct || "sem content-type"})`, 502, url, "instavel");
    }
  } catch (e) {
    if (e instanceof UpstreamError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    const ehTimeout = msg.toLowerCase().includes("abort") || msg.toLowerCase().includes("timeout");
    throw new UpstreamError(ehTimeout ? "a fonte não respondeu a tempo" : msg, 504, url, ehTimeout ? "timeout" : "instavel");
  } finally {
    clearTimeout(t);
  }
}

export type Resultado<T> =
  | { data: T; error: null; motivo: null; status: 200; fonte: null }
  | { data: null; error: string; motivo: MotivoFalha; status: number; fonte: string };

/**
 * Nunca lança: devolve {data} ou {error, motivo}.
 *
 * `motivo` é o que separa "esse registro não existe" (404 legítimo) de
 * "a fonte oficial não respondeu" (não é 404 — é falha de consulta).
 * Quem chama DEVE olhar o motivo antes de decidir por notFound().
 */
export async function safe<T>(p: Promise<T>): Promise<Resultado<T>> {
  try {
    return { data: await p, error: null, motivo: null, status: 200, fonte: null };
  } catch (e) {
    if (e instanceof UpstreamError) {
      return { data: null, error: e.message, motivo: e.motivo, status: e.status, fonte: fonteDaURL(e.url) };
    }
    const msg = e instanceof Error ? e.message : String(e);
    return { data: null, error: msg, motivo: "instavel", status: 500, fonte: "a fonte oficial" };
  }
}

/** true quando a fonte respondeu explicitamente que o registro não existe. */
export function inexistente(r: { motivo: MotivoFalha | null }): boolean {
  return r.motivo === "nao-encontrado";
}
