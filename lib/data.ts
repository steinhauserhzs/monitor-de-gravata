import fs from "node:fs";
import path from "node:path";

/**
 * "Repo como banco de dados": tudo que a comunidade edita vive em /data como JSON/MD versionado.
 * O app lê em build/runtime; a CI valida schema; PRs são a trilha de auditoria.
 */
const DATA = path.join(process.cwd(), "data");

export type ApiEntry = {
  id: string;
  nome: string;
  orgao: string;
  esfera: "federal" | "estadual" | "municipal" | "legislativo" | "judiciario" | "eleitoral" | "controle" | "economico" | "civil";
  uf?: string;
  categorias: string[];
  base_url: string;
  docs_url?: string;
  auth: "nenhuma" | "chave-gratuita" | "token" | "oauth" | "bulk-download";
  auth_como?: string;
  formato: string[];
  cors?: "sim" | "nao" | "desconhecido";
  rate_limit?: string;
  endpoints_chave: { metodo?: string; path: string; descricao: string }[];
  utilidade_anticorrupcao: string;
  status_verificado?: string;
  exemplo_resposta?: string;
  notas?: string;
  _arquivo?: string;
};

export type RedFlag = {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  fonte: string;
  dados_necessarios?: string[];
  apis?: string[];
  severidade: "baixa" | "media" | "alta";
  logica?: string;
  implementada?: boolean;
  implementavel_v1?: boolean;
};

function readJSON<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

export function loadApis(): ApiEntry[] {
  const dir = path.join(DATA, "apis");
  if (!fs.existsSync(dir)) return [];
  const out: ApiEntry[] = [];
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    try {
      const arr = readJSON<ApiEntry[]>(path.join(dir, f));
      for (const a of arr) out.push({ ...a, _arquivo: f });
    } catch (e) {
      console.error(`[data] JSON inválido: ${f}`, e);
    }
  }
  // dedupe por id (primeiro vence)
  const seen = new Set<string>();
  return out.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
}

export function loadRedFlags(): RedFlag[] {
  const f = path.join(DATA, "red-flags.json");
  if (!fs.existsSync(f)) return [];
  try {
    return readJSON<RedFlag[]>(f);
  } catch (e) {
    console.error("[data] red-flags.json inválido", e);
    return [];
  }
}

export type Caso = {
  slug: string;
  titulo: string;
  status: "rascunho" | "em-revisao" | "publicado" | "contestado" | "corrigido" | "arquivado";
  tipo: string;
  esfera?: string;
  uf?: string;
  entidades?: string[];
  regras?: string[];
  fontes: { titulo: string; url: string; coletado_em?: string }[];
  autores?: string[];
  revisores?: string[];
  criado_em: string;
  atualizado_em?: string;
  resumo: string;
  corpo: string;
};

/** Frontmatter YAML minimalista (chave: valor, listas com "- ", e listas de objetos {titulo,url}). */
function parseFrontmatter(src: string): { meta: Record<string, unknown>; body: string } {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: src };
  const meta: Record<string, unknown> = {};
  const lines = m[1].split("\n");
  let key: string | null = null;
  for (const raw of lines) {
    if (!raw.trim()) continue;
    const top = raw.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (top && !raw.startsWith(" ") && !raw.startsWith("-")) {
      key = top[1];
      const val = top[2].trim();
      if (val === "" || val === "|") meta[key] = [];
      else if (val.startsWith("[")) meta[key] = val.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      else meta[key] = val.replace(/^["']|["']$/g, "");
      continue;
    }
    const item = raw.match(/^\s*-\s+(.*)$/);
    if (item && key) {
      const arr = (meta[key] as unknown[]) ?? [];
      const v = item[1].trim();
      if (v.startsWith("{")) {
        const obj: Record<string, string> = {};
        v.slice(1, -1).split(",").forEach((kv) => {
          const [k, ...rest] = kv.split(":");
          if (k) obj[k.trim()] = rest.join(":").trim().replace(/^["']|["']$/g, "");
        });
        arr.push(obj);
      } else if (v.startsWith("titulo:")) {
        arr.push({ titulo: v.replace(/^titulo:\s*/, "").replace(/^["']|["']$/g, "") });
      } else arr.push(v.replace(/^["']|["']$/g, ""));
      meta[key] = arr;
      continue;
    }
    const nested = raw.match(/^\s+([a-z_]+):\s*(.*)$/);
    if (nested && key && Array.isArray(meta[key])) {
      const arr = meta[key] as Record<string, string>[];
      const last = arr[arr.length - 1];
      if (last && typeof last === "object") last[nested[1]] = nested[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return { meta, body: m[2] };
}

export function loadCasos(): Caso[] {
  const dir = path.join(DATA, "casos");
  if (!fs.existsSync(dir)) return [];
  const out: Caso[] = [];
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
    const src = fs.readFileSync(path.join(dir, f), "utf8");
    const { meta, body } = parseFrontmatter(src);
    out.push({
      slug: f.replace(/\.md$/, ""),
      titulo: String(meta.titulo ?? f),
      status: (meta.status as Caso["status"]) ?? "rascunho",
      tipo: String(meta.tipo ?? "hipotese"),
      esfera: meta.esfera ? String(meta.esfera) : undefined,
      uf: meta.uf ? String(meta.uf) : undefined,
      entidades: (meta.entidades as string[]) ?? [],
      regras: (meta.regras as string[]) ?? [],
      fontes: ((meta.fontes as Caso["fontes"]) ?? []).filter((x) => x && x.url),
      autores: (meta.autores as string[]) ?? [],
      revisores: (meta.revisores as string[]) ?? [],
      criado_em: String(meta.criado_em ?? ""),
      atualizado_em: meta.atualizado_em ? String(meta.atualizado_em) : undefined,
      resumo: String(meta.resumo ?? ""),
      corpo: body.trim(),
    });
  }
  return out.sort((a, b) => (b.atualizado_em ?? b.criado_em).localeCompare(a.atualizado_em ?? a.criado_em));
}

export function loadCaso(slug: string) {
  return loadCasos().find((c) => c.slug === slug) ?? null;
}

export function loadGlossario(): { termo: string; definicao: string; fonte?: string }[] {
  const f = path.join(DATA, "glossario.json");
  if (!fs.existsSync(f)) return [];
  try {
    return readJSON(f);
  } catch {
    return [];
  }
}
