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

/* ───────── Serviços (CATSER) — para cobrir TODAS as compras, não só material ───────── */
export type Servico = { c: number; n: string; k: number; kn: string; g: string };
let _servicos: Servico[] | null = null;
export function loadServicos(): Servico[] {
  if (_servicos) return _servicos;
  const f = path.join(process.cwd(), "data", "derivados", "catser.json");
  if (!fs.existsSync(f)) return [];
  _servicos = (JSON.parse(fs.readFileSync(f, "utf8")) as { servicos: Servico[] }).servicos;
  return _servicos;
}

export type ItemCatalogo = { tipo: "material" | "servico"; codigo: number; nome: string; classe: string; grupo: string };

/** Busca unificada nos dois catálogos oficiais: materiais (CATMAT/PDM) e serviços (CATSER). */
export function buscarCatalogo(termo: string, max = 30): ItemCatalogo[] {
  const words = norm(termo).split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return [];
  const bate = (hay: string) => words.every((w) => hay.includes(w));
  const mats: ItemCatalogo[] = [];
  for (const p of loadPDMs()) {
    if (bate(norm(p.n + " " + p.kn))) mats.push({ tipo: "material", codigo: p.c, nome: p.n, classe: p.kn, grupo: p.g });
    if (mats.length >= max) break;
  }
  const servs: ItemCatalogo[] = [];
  for (const s of loadServicos()) {
    if (bate(norm(s.n + " " + (s.kn ?? "")))) servs.push({ tipo: "servico", codigo: s.c, nome: s.n, classe: s.kn ?? "", grupo: s.g ?? "" });
    if (servs.length >= max) break;
  }
  // cota garantida para cada catálogo: material e serviço competem por espaço, não um sufoca o outro
  const porTamanho = (a: ItemCatalogo, b: ItemCatalogo) => a.nome.length - b.nome.length;
  mats.sort(porTamanho);
  servs.sort(porTamanho);
  const cota = Math.ceil(max / 2);
  const escolhidos = [...mats.slice(0, cota), ...servs.slice(0, cota)];
  // se um dos catálogos tem menos que a cota, o outro aproveita a sobra
  if (escolhidos.length < max) escolhidos.push(...mats.slice(cota, cota + (max - escolhidos.length)), ...servs.slice(cota, cota + (max - escolhidos.length)));
  return escolhidos.slice(0, max).sort(porTamanho);
}

/** Preços praticados de um SERVIÇO (CATSER). */
export async function precosPorServico(codigoItemCatalogo: number, opts: { uf?: string; desde?: string; ate?: string; pagina?: number; tamanho?: number } = {}) {
  const q = new URLSearchParams({
    pagina: String(opts.pagina ?? 1),
    tamanhoPagina: String(opts.tamanho ?? 200),
    codigoItemCatalogo: String(codigoItemCatalogo),
  });
  if (opts.uf) q.set("estado", opts.uf);
  if (opts.desde) q.set("dataCompraInicio", opts.desde);
  if (opts.ate) q.set("dataCompraFim", opts.ate);
  return getJSON<{ resultado: PrecoPraticado[]; totalRegistros: number; totalPaginas: number }>(`${COMPRAS}/modulo-pesquisa-preco/3_consultarServico?${q}`, {
    revalidate: 3600,
    timeoutMs: 30000,
  });
}

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
  /** ATENÇÃO: vem como número grande no JSON e perde precisão (…2026 vira …2030).
   *  Use `idCompraItem` (string) para montar links — os 17 primeiros dígitos são o id da compra. */
  idCompra: number;
  idCompraItem?: string;
  idItemCompra?: number;
  numeroItemCompra: number;
  codigoUasg: string;
  forma?: string;
  descricaoDetalhadaItem?: string;
  nomeUnidadeFornecimento?: string;
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
export async function precosAmostra(codigo: number, opts: { uf?: string; desde?: string; ate?: string; paginas?: number; tipo?: "material" | "servico" } = {}) {
  const buscar = (pagina: number) =>
    opts.tipo === "servico" ? precosPorServico(codigo, { ...opts, pagina, tamanho: 200 }) : precosPorPDM(codigo, { ...opts, pagina, tamanho: 200 });
  const first = await buscar(1);
  const totalPag = Math.min(opts.paginas ?? 3, first.totalPaginas || 1);
  const rest = totalPag > 1 ? await Promise.all(Array.from({ length: totalPag - 1 }, (_, i) => buscar(i + 2).catch(() => null))) : [];
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
/** id da compra (string, sem perda de precisão) a partir de idCompraItem. */
export const idCompraDe = (p: PrecoPraticado) => (p.idCompraItem ? String(p.idCompraItem).slice(0, 17) : String(p.idCompra));

/** Link oficial para acompanhar a compra no Compras.gov.br (Comprasnet). */
export const linkCompraGov = (p: PrecoPraticado) => `https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-web/public/compras/acompanhamento-compra?compra=${idCompraDe(p)}`;

/** Termo curto do objeto para procurar o edital/contrato no PNCP pelo Radar. */
export const termoObjeto = (p: PrecoPraticado) =>
  (p.objetoCompra || p.descricaoItem || "")
    .replace(/^Objeto:\s*/i, "")
    .replace(/Pregão Eletrônico\s*-?\s*/i, "")
    .split(/[,.;]/)[0]
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .join(" ");

export function classificar(preco: number, e: Estatisticas) {
  const razao = preco / e.mediana;
  const nivel: "abaixo" | "normal" | "atencao" | "alto" | "muito-alto" =
    razao < 0.7 ? "abaixo" : razao <= 1.3 ? "normal" : razao <= 1.7 ? "atencao" : razao <= 2.5 ? "alto" : "muito-alto";
  return { razao, nivel };
}
