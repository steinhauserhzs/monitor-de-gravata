/**
 * fetch server-side com timeout, cache curto e erro legível.
 * Toda chamada a API pública passa por aqui — sem CORS, sem chave no cliente.
 */
export class UpstreamError extends Error {
  status: number;
  url: string;
  constructor(message: string, status: number, url: string) {
    super(message);
    this.status = status;
    this.url = url;
  }
}

export async function getJSON<T = unknown>(
  url: string,
  opts: { headers?: Record<string, string>; revalidate?: number; timeoutMs?: number } = {},
): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20000);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "pt-BR,pt;q=0.9",
        // alguns portais (PNCP search) rejeitam UA não-navegador
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 MonitorDeGravata/0.1 (+https://github.com/steinhauserhzs/monitor-de-gravata)",
        ...(opts.headers ?? {}),
      },
      signal: controller.signal,
      next: { revalidate: opts.revalidate ?? 300 },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new UpstreamError(`${res.status} ${res.statusText} — ${body.slice(0, 200)}`, res.status, url);
    }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("json")) return (await res.json()) as T;
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new UpstreamError(`Resposta não-JSON (${ct})`, 502, url);
    }
  } catch (e) {
    if (e instanceof UpstreamError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    throw new UpstreamError(msg.includes("abort") ? "timeout" : msg, 504, url);
  } finally {
    clearTimeout(t);
  }
}

/** Nunca lança: devolve {data} ou {error} para a UI decidir. */
export async function safe<T>(p: Promise<T>): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    return { data: await p, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
}
