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

export async function listCandidatos(ano: number, uf: string, cargo: number) {
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
  bens: Bem[];
  totalDeBens: number;
  vices?: unknown;
  eleicao: { id: number; ano: number };
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
