import fs from "node:fs";
import path from "node:path";
import { getJSON } from "./fetcher";

/**
 * Comparador de preços — "esse notebook de R$ 10 mil custa R$ 4 mil em outros órgãos?"
 * Fonte: Compras.gov.br Dados Abertos (MGI) — módulo pesquisa de preço: preços PRATICADOS
 * (homologados) em compras públicas por PDM/CATMAT, com fornecedor, marca, órgão, UF e data.
 * Índice de PDMs gerado por scripts/gerar-catmat.mjs → data/derivados/catmat-pdm.json (15 mil PDMs).
 */
export const COMPRAS = "https://dadosabertos.compras.gov.br";

export type PDM = { c: number; n: string; k: number; kn: string; g: string };
let _pdms: PDM[] | null = null;
export function loadPDMs(): PDM[] {
  if (_pdms) return _pdms;
  const f = path.join(process.cwd(), "data", "derivados", "catmat-pdm.json");
  if (!fs.existsSync(f)) return [];
  _pdms = (JSON.parse(fs.readFileSync(f, "utf8")) as { pdms: PDM[] }).pdms;
  return _pdms;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

/** Busca PDMs por termo (todas as palavras precisam aparecer). */
export function buscarPDM(termo: string, max = 25): PDM[] {
  const words = norm(termo).split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return [];
  const out: PDM[] = [];
  for (const p of loadPDMs()) {
    const hay = norm(p.n + " " + p.kn);
    if (words.every((w) => hay.includes(w))) {
      out.push(p);
      if (out.length >= max) break;
    }
  }
  // mais curtos primeiro (mais genéricos, ex.: "NOTEBOOK" antes de "NOTEBOOK GAMER")
  return out.sort((a, b) => a.n.length - b.n.length);
}

export type PrecoPraticado = {
  idCompra: number;
  dataCompra: string;
  dataResultado: string;
  modalidade: number;
  niFornecedor: string;
  nomeFornecedor: string;
  marca: string | null;
  codigoItemCatalogo: number;
  quantidade: number;
  precoUnitario: number;
  descricaoItem: string;
  siglaUnidadeFornecimento: string;
  nomeUasg: string;
  nomeOrgao: string;
  estado: string;
  municipio: string;
  esfera: string;
  poder: string;
  objetoCompra?: string;
  idCompraItem?: string;
};

export async function precosPorPDM(codigoPdm: number, opts: { uf?: string; desde?: string; ate?: string; pagina?: number; tamanho?: number } = {}) {
  const q = new URLSearchParams({
    pagina: String(opts.pagina ?? 1),
    tamanhoPagina: String(opts.tamanho ?? 200),
    tipo: "codigoPdm",
    codigo: String(codigoPdm),
  });
  if (opts.uf) q.set("estado", opts.uf);
  if (opts.desde) q.set("dataCompraInicio", opts.desde);
  if (opts.ate) q.set("dataCompraFim", opts.ate);
  return getJSON<{ resultado: PrecoPraticado[]; totalRegistros: number; totalPaginas: number }>(`${COMPRAS}/modulo-pesquisa-preco/1_consultarMaterial?${q}`, {
    revalidate: 3600,
    timeoutMs: 30000,
  });
}

/** Até `paginas` páginas (200 cada) em paralelo — amostra maior para mediana mais estável. */
export async function precosAmostra(codigoPdm: number, opts: { uf?: string; desde?: string; ate?: string; paginas?: number } = {}) {
  const first = await precosPorPDM(codigoPdm, { ...opts, pagina: 1, tamanho: 200 });
  const totalPag = Math.min(opts.paginas ?? 3, first.totalPaginas || 1);
  const rest = totalPag > 1 ? await Promise.all(Array.from({ length: totalPag - 1 }, (_, i) => precosPorPDM(codigoPdm, { ...opts, pagina: i + 2, tamanho: 200 }).catch(() => null))) : [];
  const resultado = [...first.resultado, ...rest.flatMap((r) => r?.resultado ?? [])];
  return { resultado, totalRegistros: first.totalRegistros, paginasLidas: 1 + rest.filter(Boolean).length };
}

export type Estatisticas = { n: number; min: number; q1: number; mediana: number; q3: number; max: number; media: number };

export function estatisticas(valores: number[]): Estatisticas | null {
  const v = valores.filter((x) => Number.isFinite(x) && x > 0).sort((a, b) => a - b);
  if (!v.length) return null;
  const q = (p: number) => {
    const i = (v.length - 1) * p;
    const lo = Math.floor(i), hi = Math.ceil(i);
    return v[lo] + (v[hi] - v[lo]) * (i - lo);
  };
  return { n: v.length, min: v[0], q1: q(0.25), mediana: q(0.5), q3: q(0.75), max: v[v.length - 1], media: v.reduce((a, b) => a + b, 0) / v.length };
}

/** Classifica um preço contra a distribuição: razão vs mediana e posição no percentil. */
export function classificar(preco: number, e: Estatisticas) {
  const razao = preco / e.mediana;
  const nivel: "abaixo" | "normal" | "atencao" | "alto" | "muito-alto" =
    razao < 0.7 ? "abaixo" : razao <= 1.3 ? "normal" : razao <= 1.7 ? "atencao" : razao <= 2.5 ? "alto" : "muito-alto";
  return { razao, nivel };
}
