import fs from "node:fs";
import path from "node:path";
import { getJSON } from "./fetcher";

export const CAMARA = "https://dadosabertos.camara.leg.br/api/v2";

export type Deputado = {
  id: number;
  nome: string;
  siglaPartido: string;
  siglaUf: string;
  idLegislatura: number;
  urlFoto: string;
  email?: string;
};

export type DeputadoDetalhe = {
  id: number;
  nomeCivil: string;
  cpf?: string;
  sexo?: string;
  dataNascimento?: string;
  ufNascimento?: string;
  municipioNascimento?: string;
  escolaridade?: string;
  redeSocial?: string[];
  ultimoStatus: {
    nome: string;
    siglaPartido: string;
    siglaUf: string;
    urlFoto: string;
    email?: string;
    situacao?: string;
    condicaoEleitoral?: string;
    descricaoStatus?: string;
    gabinete?: { nome?: string; predio?: string; sala?: string; andar?: string; telefone?: string; email?: string };
  };
};

export type Despesa = {
  ano: number;
  mes: number;
  tipoDespesa: string;
  codDocumento: number;
  tipoDocumento: string;
  dataDocumento: string;
  numDocumento: string;
  valorDocumento: number;
  urlDocumento: string | null;
  nomeFornecedor: string;
  cnpjCpfFornecedor: string;
  valorLiquido: number;
  valorGlosa: number;
  numRessarcimento: string;
  codLote: number;
  parcela: number;
};

type Page<T> = { dados: T[]; links: { rel: string; href: string }[] };

/** Lista deputados. `itens=513` traz a legislatura inteira numa requisição (a API aceita). */
export async function listDeputados(params: { uf?: string; partido?: string; nome?: string } = {}) {
  const q = new URLSearchParams({ ordem: "ASC", ordenarPor: "nome", itens: "513" });
  if (params.uf) q.set("siglaUf", params.uf);
  if (params.partido) q.set("siglaPartido", params.partido);
  if (params.nome) q.set("nome", params.nome);
  const r = await getJSON<Page<Deputado>>(`${CAMARA}/deputados?${q}`, { revalidate: 3600 });
  return r.dados;
}

export async function getDeputado(id: string | number) {
  const r = await getJSON<{ dados: DeputadoDetalhe }>(`${CAMARA}/deputados/${id}`, { revalidate: 3600 });
  return r.dados;
}

async function allPagesDespesas(firstUrl: string, maxPages: number): Promise<Despesa[]> {
  const first = await getJSON<Page<Despesa>>(firstUrl, { revalidate: 1800 });
  const last = first.links.find((l) => l.rel === "last")?.href;
  const totalPag = last ? Number(new URL(last).searchParams.get("pagina") ?? 1) : 1;
  const n = Math.min(totalPag, maxPages);
  if (n <= 1) return first.dados;
  const restantes = await Promise.all(
    Array.from({ length: n - 1 }, (_, i) => {
      const u = new URL(last!);
      u.searchParams.set("pagina", String(i + 2));
      return getJSON<Page<Despesa>>(u.toString(), { revalidate: 1800 }).catch(() => ({ dados: [] as Despesa[], links: [] as { rel: string; href: string }[] }));
    }),
  );
  return [...first.dados, ...restantes.flatMap((r) => r.dados)];
}

/** Todas as páginas de despesas do ano (CEAP), em paralelo. */
export async function getDespesas(id: string | number, ano: number, maxPages = 12) {
  return allPagesDespesas(`${CAMARA}/deputados/${id}/despesas?ano=${ano}&itens=100&ordem=DESC&ordenarPor=dataDocumento`, maxPages);
}

export async function getFrentes(id: string | number) {
  const r = await getJSON<Page<{ id: number; titulo: string }>>(`${CAMARA}/deputados/${id}/frentes`, { revalidate: 86400 });
  return r.dados;
}

export async function getOrgaos(id: string | number) {
  const r = await getJSON<Page<{ idOrgao: number; nomeOrgao: string; siglaOrgao: string; titulo: string; dataInicio: string; dataFim: string | null }>>(
    `${CAMARA}/deputados/${id}/orgaos?ordem=DESC&ordenarPor=dataInicio&itens=50`,
    { revalidate: 86400 },
  );
  return r.dados;
}

export async function getProposicoesDoAutor(id: string | number, ano?: number) {
  const q = new URLSearchParams({ idDeputadoAutor: String(id), itens: "50", ordem: "DESC", ordenarPor: "id" });
  if (ano) q.set("ano", String(ano));
  const r = await getJSON<Page<{ id: number; siglaTipo: string; numero: number; ano: number; ementa: string }>>(
    `${CAMARA}/proposicoes?${q}`,
    { revalidate: 3600 },
  );
  return r.dados;
}

/* ───────── Presença, votações, discursos ───────── */
export type Evento = {
  id: number;
  dataHoraInicio: string;
  dataHoraFim: string | null;
  situacao: string;
  descricaoTipo: string;
  descricao: string;
  orgaos: { id: number; sigla: string; nome: string }[];
  urlRegistro?: string | null;
};

/** Busca a 1ª página, descobre a última pelo link rel=last e traz as demais EM PARALELO. */
async function allPages<T>(firstUrl: string, maxPages = 10, revalidate = 3600): Promise<T[]> {
  const first = await getJSON<Page<T>>(firstUrl, { revalidate });
  const last = first.links.find((l) => l.rel === "last")?.href;
  const totalPag = last ? Number(new URL(last).searchParams.get("pagina") ?? 1) : 1;
  const n = Math.min(totalPag, maxPages);
  if (n <= 1) return first.dados;
  const restantes = await Promise.all(
    Array.from({ length: n - 1 }, (_, i) => {
      const u = new URL(last!);
      u.searchParams.set("pagina", String(i + 2));
      return getJSON<Page<T>>(u.toString(), { revalidate }).catch(() => ({ dados: [] as T[], links: [] as { rel: string; href: string }[] }));
    }),
  );
  return [...first.dados, ...restantes.flatMap((r) => r.dados)];
}

/** Sessões deliberativas do Plenário no período (denominador da presença). */
export async function getSessoesDeliberativas(dataInicio: string, dataFim: string) {
  return allPages<Evento>(`${CAMARA}/eventos?codTipoEvento=110&idOrgao=180&dataInicio=${dataInicio}&dataFim=${dataFim}&itens=100&ordem=ASC&ordenarPor=dataHoraInicio`);
}

/** Eventos de que o deputado participou (presença registrada). */
export async function getEventosDeputado(id: string | number, dataInicio: string, dataFim: string) {
  return allPages<Evento>(`${CAMARA}/deputados/${id}/eventos?dataInicio=${dataInicio}&dataFim=${dataFim}&itens=100&ordem=ASC&ordenarPor=dataHoraInicio`);
}

export type Votacao = {
  id: string;
  data: string;
  dataHoraRegistro: string;
  siglaOrgao: string;
  descricao: string;
  aprovacao: number | null;
  proposicaoObjeto?: string | null;
  uriProposicaoObjeto?: string | null;
};

/**
 * Votações do Plenário. A API limita cada consulta a 3 meses, então varremos `janelas`
 * trimestres para trás — necessário porque em recesso/período eleitoral quase toda votação
 * é simbólica (sem voto individual registrado) e as nominais ficam meses atrás.
 */
export async function getVotacoesPlenario(dataFim: string, janelas = 3) {
  const fim = new Date(dataFim).getTime();
  const partes = await Promise.all(
    Array.from({ length: janelas }, (_, i) => {
      const f = new Date(fim - i * 90 * 86400000).toISOString().slice(0, 10);
      const ini = new Date(fim - (i * 90 + 89) * 86400000).toISOString().slice(0, 10);
      return getJSON<Page<Votacao>>(`${CAMARA}/votacoes?dataInicio=${ini}&dataFim=${f}&itens=100&ordem=DESC&ordenarPor=dataHoraRegistro`, { revalidate: 3600 }).catch(() => ({ dados: [] as Votacao[], links: [] as { rel: string; href: string }[] }));
    }),
  );
  const todas = partes.flatMap((p) => p.dados).filter((v) => v.siglaOrgao === "PLEN");
  const vistos = new Set<string>();
  return todas.filter((v) => (vistos.has(v.id) ? false : (vistos.add(v.id), true)));
}

/**
 * Descobre as votações NOMINAIS mais recentes do Plenário (as simbólicas não registram voto
 * individual). O resultado é o mesmo para todos os parlamentares — por isso as chamadas ficam
 * no cache do Next e a segunda ficha em diante não paga o custo.
 */
export async function getVotacoesNominais(dataFim: string, alvo = 12, maxSondagens = 60) {
  const todas = await getVotacoesPlenario(dataFim, 5);
  const ordenadas = [...todas.filter((v) => v.proposicaoObjeto), ...todas.filter((v) => !v.proposicaoObjeto)].slice(0, maxSondagens);
  const achadas: { votacao: Votacao; votos: Voto[]; orientacoes: Orientacao[] }[] = [];
  for (let i = 0; i < ordenadas.length && achadas.length < alvo; i += 8) {
    const lote = await Promise.all(
      ordenadas.slice(i, i + 8).map(async (v) => {
        const [votos, orientacoes] = await Promise.all([getVotos(v.id).catch(() => []), getOrientacoes(v.id).catch(() => [])]);
        return votos.length ? { votacao: v, votos, orientacoes } : null;
      }),
    );
    achadas.push(...(lote.filter(Boolean) as typeof achadas));
  }
  return achadas.slice(0, alvo);
}

export type Voto = { tipoVoto: string; dataRegistroVoto: string; deputado_: { id: number; nome: string; siglaPartido: string; siglaUf: string } };

export async function getVotos(idVotacao: string) {
  const r = await getJSON<Page<Voto>>(`${CAMARA}/votacoes/${idVotacao}/votos`, { revalidate: 86400 });
  return r.dados;
}

export type Orientacao = { siglaPartidoBloco: string; orientacaoVoto: string; codTipoLideranca?: string };

export async function getOrientacoes(idVotacao: string) {
  const r = await getJSON<Page<Orientacao>>(`${CAMARA}/votacoes/${idVotacao}/orientacoes`, { revalidate: 86400 });
  return r.dados;
}

export type Discurso = { dataHoraInicio: string; tipoDiscurso: string; sumario: string; transcricao?: string; keywords?: string; urlTexto?: string; urlAudio?: string; urlVideo?: string };

export async function getDiscursos(id: string | number, dataInicio: string, dataFim: string, itens = 20) {
  const r = await getJSON<Page<Discurso>>(
    `${CAMARA}/deputados/${id}/discursos?dataInicio=${dataInicio}&dataFim=${dataFim}&itens=${itens}&ordem=DESC&ordenarPor=dataHoraInicio`,
    { revalidate: 3600 },
  );
  return r.dados;
}

export type MandatoExterno = { cargo: string; siglaUf: string; municipio: string | null; anoInicio: number; anoFim: number | null; siglaPartidoEleicao?: string };

export async function getMandatosExternos(id: string | number) {
  const r = await getJSON<Page<MandatoExterno>>(`${CAMARA}/deputados/${id}/mandatosExternos`, { revalidate: 86400 });
  return r.dados;
}

export type Historico = { dataHora: string; situacao: string; descricaoStatus?: string; siglaPartido: string; siglaUf: string; nomeEleitoral: string; condicaoEleitoral?: string; idLegislatura: number };

export async function getHistorico(id: string | number) {
  const r = await getJSON<Page<Historico>>(`${CAMARA}/deputados/${id}/historico`, { revalidate: 86400 });
  return r.dados;
}

export type Ocupacao = { titulo: string | null; entidade: string | null; entidadeUF: string | null; anoInicio: number | null; anoFim: number | null };

export async function getOcupacoes(id: string | number) {
  const r = await getJSON<Page<Ocupacao>>(`${CAMARA}/deputados/${id}/ocupacoes`, { revalidate: 86400 });
  return r.dados;
}

export async function getTemas(idProposicao: number | string) {
  const r = await getJSON<Page<{ codTema: number; tema: string; relevancia: number }>>(`${CAMARA}/proposicoes/${idProposicao}/temas`, { revalidate: 86400 });
  return r.dados;
}

/* ───────── Fallback da cota (arquivo anual oficial) ───────── */
export type CeapDerivado = {
  nome: string; uf: string; partido: string; total: number; qtd: number;
  porTipo: { tipo: string; total: number }[];
  porMes: { mes: number; total: number }[];
  porFornecedor: { fornecedor: string; cnpj: string; total: number; qtd: number }[];
  maiorNota: { valorLiquido: number; nomeFornecedor: string; cnpjCpfFornecedor: string; tipoDespesa: string; dataDocumento: string } | null;
};
const _ceapCache = new Map<number, { gerado_em: string; fonte: string; deputados: Record<string, CeapDerivado> } | null>();

/**
 * Agregados da cota vindos do arquivo anual da Câmara (data/derivados/ceap-<ano>.json,
 * gerado por `npm run ceap`). Usado quando a API /despesas devolve vazio — o que aconteceu
 * em 17-18/08/2026 para todos os deputados.
 */
export function getCeapArquivo(ano: number, idDeputado: string | number) {
  if (!_ceapCache.has(ano)) {
    const f = path.join(process.cwd(), "data", "derivados", `ceap-${ano}.json`);
    _ceapCache.set(ano, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null);
  }
  const base = _ceapCache.get(ano);
  const d = base?.deputados?.[String(idDeputado)];
  return d ? { ...d, gerado_em: base!.gerado_em, fonte: base!.fonte } : null;
}

/* ───────── Análise CEAP ───────── */
export type AnaliseCEAP = {
  total: number;
  qtd: number;
  porTipo: { tipo: string; total: number; qtd: number }[];
  porFornecedor: { fornecedor: string; cnpj: string; total: number; qtd: number; share: number }[];
  porMes: { mes: number; total: number }[];
  maiorNota: Despesa | null;
  concentracaoTop1: number;
  concentracaoTop3: number;
  glosas: number;
};

export function analisarCEAP(despesas: Despesa[]): AnaliseCEAP {
  const total = despesas.reduce((a, d) => a + (d.valorLiquido || 0), 0);
  const byTipo = new Map<string, { total: number; qtd: number }>();
  const byForn = new Map<string, { fornecedor: string; cnpj: string; total: number; qtd: number }>();
  const byMes = new Map<number, number>();
  let maior: Despesa | null = null;
  let glosas = 0;
  for (const d of despesas) {
    const v = d.valorLiquido || 0;
    glosas += d.valorGlosa || 0;
    const t = byTipo.get(d.tipoDespesa) ?? { total: 0, qtd: 0 };
    t.total += v;
    t.qtd++;
    byTipo.set(d.tipoDespesa, t);
    const key = d.cnpjCpfFornecedor || d.nomeFornecedor;
    const f = byForn.get(key) ?? { fornecedor: d.nomeFornecedor, cnpj: d.cnpjCpfFornecedor, total: 0, qtd: 0 };
    f.total += v;
    f.qtd++;
    byForn.set(key, f);
    byMes.set(d.mes, (byMes.get(d.mes) ?? 0) + v);
    if (!maior || v > (maior.valorLiquido || 0)) maior = d;
  }
  const porFornecedor = [...byForn.values()]
    .sort((a, b) => b.total - a.total)
    .map((f) => ({ ...f, share: total ? f.total / total : 0 }));
  return {
    total,
    qtd: despesas.length,
    porTipo: [...byTipo.entries()].map(([tipo, v]) => ({ tipo, ...v })).sort((a, b) => b.total - a.total),
    porFornecedor,
    porMes: [...byMes.entries()].map(([mes, total]) => ({ mes, total })).sort((a, b) => a.mes - b.mes),
    maiorNota: maior,
    concentracaoTop1: porFornecedor[0]?.share ?? 0,
    concentracaoTop3: porFornecedor.slice(0, 3).reduce((a, f) => a + f.share, 0),
    glosas,
  };
}
