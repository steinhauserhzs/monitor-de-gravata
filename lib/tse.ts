import fs from "node:fs";
import path from "node:path";
import { getJSON } from "./fetcher";

/**
 * DivulgaCandContas (TSE) — endpoints REST usados pelo próprio site do TSE.
 * Não são "oficialmente documentados", mas são públicos e estáveis desde 2018.
 * Base: https://divulgacandcontas.tse.jus.br/divulga/rest/v1
 */
export const DIVULGA = "https://divulgacandcontas.tse.jus.br/divulga/rest/v1";

export const ELEICOES: Record<number, { id: number; nome: string; abrangencia: "F" | "M" }> = {
  2026: { id: 20322002026, nome: "Eleição Geral Federal 2026", abrangencia: "F" },
  2024: { id: 2045202024, nome: "Eleições Municipais 2024", abrangencia: "M" },
  2022: { id: 2040602022, nome: "Eleição Geral Federal 2022", abrangencia: "F" },
  2020: { id: 2030402020, nome: "Eleições Municipais 2020", abrangencia: "M" },
  2018: { id: 2022802018, nome: "Eleição Geral Federal 2018", abrangencia: "F" },
};

export const CARGOS: Record<number, string> = {
  1: "Presidente",
  3: "Governador",
  5: "Senador",
  6: "Deputado Federal",
  7: "Deputado Estadual",
  8: "Deputado Distrital",
  11: "Prefeito",
  13: "Vereador",
};

export const UFS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

export type EleicaoOrdinaria = { id: number; ano: number; nomeEleicao: string; tipoAbrangencia: string; dataEleicao: string };

export async function listEleicoes() {
  return getJSON<EleicaoOrdinaria[]>(`${DIVULGA}/eleicao/ordinarias`, { revalidate: 86400 });
}

export type CandidatoResumo = {
  id: number;
  nomeUrna: string;
  numero: number;
  nomeCompleto: string;
  descricaoSituacao: string;
  ufCandidatura: string;
  partido: { numero: number; sigla: string; nome: string };
  cargo: { codigo: number; nome: string };
  fotoUrl?: string | null;
  fotoUrlPublicavel?: boolean;
  nomeColigacao?: string;
  descricaoTotalizacao?: string | null;
};

/* ─────────── Índice local de candidatos ───────────
 * O DivulgaCand fica atrás de um WAF que limita consultas automatizadas: de
 * dentro da Vercel a listagem dá 403 sempre, e a lista de SP para deputado
 * federal sozinha tem 2,6 MB. Por isso a LISTAGEM lê de um índice derivado
 * (gerado por `npm run candidatos`, fora da produção) e só cai para a API ao
 * vivo quando o índice não existe. A FICHA individual continua ao vivo.
 * O índice é derivado, nunca fonte da verdade — carrega fonte e data da coleta.
 */
type CandidatoEnxuto = {
  i: number; n: string; c: string; u: number; p: string; pn?: number; s: string; t?: string | null;
  // extras do consulta_cand (dados abertos) — permitem uma ficha mínima quando o ao-vivo está bloqueado
  nasc?: string; ocu?: string; inst?: string; gen?: string; cor?: string; ufn?: string; munn?: string; colig?: string;
};
type IndiceCandidatos = {
  ano: number; uf: string; cargo: number; coletado_em: string; fonte: string;
  total: number; candidatos: CandidatoEnxuto[];
};

const _indices = new Map<string, IndiceCandidatos | null>();

function carregarIndice(ano: number, uf: string, cargo: number): IndiceCandidatos | null {
  const chave = `${ano}/${cargo}-${uf}`;
  const cache = _indices.get(chave);
  if (cache !== undefined) return cache;
  let lido: IndiceCandidatos | null = null;
  try {
    const f = path.join(process.cwd(), "data", "derivados", `candidatos-${ano}`, `${cargo}-${uf}.json`);
    if (fs.existsSync(f)) lido = JSON.parse(fs.readFileSync(f, "utf8")) as IndiceCandidatos;
  } catch {
    lido = null;
  }
  if (lido) _indices.set(chave, lido); // ausência não é memorizada
  return lido;
}

/** De onde veio a lista — para a UI dizer a fonte e a data, como manda a regra do projeto. */
export type OrigemLista = { via: "indice"; coletado_em: string } | { via: "ao-vivo" } | { via: "indisponivel" };

export function origemDaLista(ano: number, uf: string, cargo: number): OrigemLista {
  const ix = carregarIndice(ano, uf, cargo);
  return ix ? { via: "indice", coletado_em: ix.coletado_em } : { via: "ao-vivo" };
}

const expandir = (c: CandidatoEnxuto, uf: string, cargo: number): CandidatoResumo => ({
  id: c.i,
  nomeUrna: c.n,
  nomeCompleto: c.c,
  numero: c.u,
  descricaoSituacao: c.s,
  descricaoTotalizacao: c.t ?? null,
  ufCandidatura: uf,
  partido: { sigla: c.p, numero: c.pn ?? 0, nome: c.p },
  cargo: { codigo: cargo, nome: CARGOS[cargo] ?? String(cargo) },
});

/* ── Índice de bens (bem_candidato, dados abertos) ──
 * Quando o arquivo de um ano existe, a ausência de linhas para um candidato é
 * um FATO ("declarou zero bens"); quando o arquivo não existe, é "não sabemos".
 * bensDoIndice devolve null só no segundo caso — nunca inventa um zero. */
type IndiceBens = { ano: number; uf: string; coletado_em: string; bens: Record<string, [string, string, number][]> };
const _bens = new Map<string, IndiceBens | null>();

function carregarBens(ano: number, uf: string): IndiceBens | null {
  const chave = `${ano}/${uf}`;
  const cache = _bens.get(chave);
  if (cache !== undefined) return cache;
  let lido: IndiceBens | null = null;
  try {
    const f = path.join(process.cwd(), "data", "derivados", `bens-${ano}`, `${uf}.json`);
    if (fs.existsSync(f)) lido = JSON.parse(fs.readFileSync(f, "utf8")) as IndiceBens;
  } catch {
    lido = null;
  }
  if (lido) _bens.set(chave, lido); // ausência não é memorizada
  return lido;
}

export function bensDoIndice(ano: number, uf: string, id: string | number): { bens: Bem[]; totalDeBens: number } | null {
  const ix = carregarBens(ano, uf);
  if (!ix) return null;
  const linhas = ix.bens[String(id)] ?? [];
  const bens: Bem[] = linhas.map(([tipo, desc, valor], i) => ({ ordem: i + 1, descricaoDeTipoDeBem: tipo, descricao: desc, valor }));
  return { bens, totalDeBens: bens.reduce((a, b) => a + b.valor, 0) };
}

/**
 * Ficha mínima a partir do índice local — o plano B da ficha do candidato.
 *
 * Quando o DivulgaCand ao vivo está bloqueado (WAF), em vez de "fonte
 * indisponível" a ficha renderiza o registro oficial do consulta_cand:
 * identificação completa, sem bens/prestação (esses só existem no ao-vivo).
 * A tela é obrigada a rotular a procedência — por isso devolvemos coletado_em.
 */
export function candidatoDoIndice(
  ano: number,
  uf: string,
  id: string,
): { candidato: CandidatoDetalhe; coletado_em: string } | null {
  const cargos = uf === "BR" ? [1] : [3, 5, 6, 7, 8];
  for (const cargo of cargos) {
    const ix = carregarIndice(ano, uf, cargo);
    const c = ix?.candidatos.find((x) => String(x.i) === String(id));
    if (ix && c) {
      const bx = bensDoIndice(ano, uf, c.i);
      return {
        coletado_em: ix.coletado_em,
        candidato: {
          ...expandir(c, uf, cargo),
          ...(bx ? { bens: bx.bens, totalDeBens: bx.totalDeBens } : {}),
          dataDeNascimento: c.nasc,
          ocupacao: c.ocu,
          grauInstrucao: c.inst,
          descricaoSexo: c.gen,
          descricaoCorRaca: c.cor,
          sgUfNascimento: c.ufn,
          nomeMunicipioNascimento: c.munn,
          nomeColigacao: c.colig,
        },
      };
    }
  }
  return null;
}

export async function listCandidatos(ano: number, uf: string, cargo: number) {
  const ix = carregarIndice(ano, uf, cargo);
  if (ix) return ix.candidatos.map((c) => expandir(c, uf, cargo));

  const el = ELEICOES[ano];
  if (!el) throw new Error(`Eleição ${ano} não mapeada`);
  const r = await getJSON<{ candidatos: CandidatoResumo[]; cargo: { nome: string } }>(
    `${DIVULGA}/candidatura/listar/${ano}/${uf}/${el.id}/${cargo}/candidatos`,
    { revalidate: 3600, timeoutMs: 30000 },
  );
  return r.candidatos ?? [];
}

export type Bem = { ordem: number; descricao: string; descricaoDeTipoDeBem: string; valor: number };

export type CandidatoDetalhe = CandidatoResumo & {
  cpf?: string;
  descricaoSexo?: string;
  dataDeNascimento?: string;
  descricaoEstadoCivil?: string;
  descricaoCorRaca?: string;
  nacionalidade?: string;
  grauInstrucao?: string;
  ocupacao?: string;
  gastoCampanha1T?: number | null;
  gastoCampanha2T?: number | null;
  sgUfNascimento?: string;
  nomeMunicipioNascimento?: string;
  localCandidatura?: string;
  numeroProcesso?: string;
  numeroProcessoDrap?: string;
  numeroProcessoPrestContas?: string;
  processosCassacao?: unknown[];
  processosDesconstituicao?: unknown[];
  bens?: Bem[];
  totalDeBens?: number;
  vices?: unknown;
  eleicao?: { id: number; ano: number };
  emails?: string[] | null;
  sites?: string[];
  arquivos?: { idArquivo: number; nome: string; url: string; tipo: string; codTipo: string }[];
  composicaoColigacao?: string;
  descricaoTipoDrap?: string;
  dataUltimaAtualizacao?: string;
  descricaoTotalizacao?: string | null;
};

export async function getCandidato(ano: number, uf: string, id: string | number) {
  const el = ELEICOES[ano];
  if (!el) throw new Error(`Eleição ${ano} não mapeada`);
  return getJSON<CandidatoDetalhe>(`${DIVULGA}/candidatura/buscar/${ano}/${uf}/${el.id}/candidato/${id}`, {
    revalidate: 3600,
    timeoutMs: 30000,
  });
}

export type Prestacao = {
  idEleicao: number;
  ano: number;
  sgUe: string;
  nrPartido: number;
  siglaPartido: string;
  nrCandidato: number;
  idCandidato: string;
  cnpj?: string;
  nrProcessoPje?: string;
  dataUltimaAtualizacaoContas?: string;
  dadosConsolidados?: {
    totalRecebido: number;
    qtdRecebido: number;
    totalFinanceiro: number;
    totalEstimados: number;
    totalReceitaPF: number;
    qtdReceitaPF: number;
    totalReceitaPJ: number;
    totalPartidos: number;
    totalInternet: number;
    totalRoni: number;
    totalProprios: number;
    totalReceitaOutCand: number;
    totalDoacaoFcc: number;
    [k: string]: number | null | undefined;
  };
  despesas?: { totalDespesasContratadas?: number; totalDespesasPagas?: number; qtdDespesas?: number; [k: string]: unknown };
  [k: string]: unknown;
};

export async function getPrestacao(ano: number, uf: string, cargo: number, nrPartido: number, nrCandidato: number, idCandidato: string | number) {
  const el = ELEICOES[ano];
  if (!el) throw new Error(`Eleição ${ano} não mapeada`);
  return getJSON<Prestacao>(`${DIVULGA}/prestador/consulta/${el.id}/${ano}/${uf}/${cargo}/${nrPartido}/${nrCandidato}/${idCandidato}`, {
    revalidate: 3600,
    timeoutMs: 30000,
  });
}

/** Receitas detalhadas (doador a doador). Formato do site: /prestador/consulta/receitas/{idEleicao}/{ano}/{sgUe}/{cargo}/{nrPartido}/{nrCandidato}/{idCandidato} */
export async function getReceitas(ano: number, uf: string, cargo: number, nrPartido: number, nrCandidato: number, idCandidato: string | number) {
  const el = ELEICOES[ano];
  return getJSON<unknown>(`${DIVULGA}/prestador/consulta/receitas/${el.id}/${ano}/${uf}/${cargo}/${nrPartido}/${nrCandidato}/${idCandidato}`, {
    revalidate: 3600,
    timeoutMs: 30000,
  });
}

/** Despesas detalhadas (fornecedor a fornecedor). */
export async function getDespesasCampanha(ano: number, uf: string, cargo: number, nrPartido: number, nrCandidato: number, idCandidato: string | number) {
  const el = ELEICOES[ano];
  return getJSON<unknown>(`${DIVULGA}/prestador/consulta/despesas/${el.id}/${ano}/${uf}/${cargo}/${nrPartido}/${nrCandidato}/${idCandidato}`, {
    revalidate: 3600,
    timeoutMs: 30000,
  });
}

export const fotoCandidato = (idEleicao: number, idCandidato: number | string, uf: string) =>
  `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/${idEleicao}/${idCandidato}/${uf}`;
