import { getJSON } from "./fetcher";
import { yyyymmdd, daysAgo } from "./format";

export const PNCP_CONSULTA = "https://pncp.gov.br/api/consulta/v1";
export const PNCP_API = "https://pncp.gov.br/api/pncp/v1";
export const PNCP_SEARCH = "https://pncp.gov.br/api/search/";

export type ContratoPNCP = {
  numeroControlePNCP: string;
  numeroControlePncpCompra: string;
  anoContrato: number;
  sequencialContrato: number;
  tipoContrato: { id: number; nome: string };
  numeroContratoEmpenho: string;
  dataAssinatura: string;
  dataVigenciaInicio: string;
  dataVigenciaFim: string;
  niFornecedor: string;
  tipoPessoa: string;
  nomeRazaoSocialFornecedor: string;
  orgaoEntidade: { cnpj: string; razaoSocial: string; poderId: string; esferaId: string };
  unidadeOrgao: { ufSigla: string; municipioNome: string; nomeUnidade: string; codigoIbge: string };
  categoriaProcesso: { id: number; nome: string };
  objetoContrato: string;
  valorInicial: number;
  valorGlobal: number;
  valorParcela?: number;
  valorAcumulado?: number;
  numeroParcelas?: number;
  numeroRetificacao?: number;
  emendaParlamentar?: string | null;
  frutoAdesao?: boolean;
  dataPublicacaoPncp: string;
  dataAtualizacao: string;
  processo?: string;
};

type PageResp<T> = { data: T[]; totalRegistros: number; totalPaginas: number; numeroPagina: number; paginasRestantes: number; empty: boolean };

/** Contratos publicados por período (máx. 365 dias). */
/** ATENÇÃO: o PNCP devolve HTTP 400 para tamanhoPagina > 50. Nunca aumente sem testar. */
export const PNCP_MAX_PAGINA = 50;

export async function listContratos(params: { dataInicial?: string; dataFinal?: string; cnpjOrgao?: string; uf?: string; pagina?: number; tamanhoPagina?: number }) {
  const q = new URLSearchParams({
    dataInicial: params.dataInicial ?? yyyymmdd(daysAgo(7)),
    dataFinal: params.dataFinal ?? yyyymmdd(new Date()),
    pagina: String(params.pagina ?? 1),
    tamanhoPagina: String(Math.min(params.tamanhoPagina ?? PNCP_MAX_PAGINA, PNCP_MAX_PAGINA)),
  });
  if (params.cnpjOrgao) q.set("cnpjOrgao", params.cnpjOrgao);
  if (params.uf) q.set("uf", params.uf);
  return getJSON<PageResp<ContratoPNCP>>(`${PNCP_CONSULTA}/contratos?${q}`, { revalidate: 600, timeoutMs: 30000 });
}

export type ContratacaoPNCP = {
  numeroControlePNCP: string;
  anoCompra: number;
  sequencialCompra: number;
  numeroCompra: string;
  orgaoEntidade: { cnpj: string; razaoSocial: string; poderId: string; esferaId: string };
  unidadeOrgao: { ufSigla: string; municipioNome: string; nomeUnidade: string; codigoIbge: string };
  modalidadeId: number;
  modalidadeNome: string;
  amparoLegal: { codigo: number; nome: string; descricao: string };
  objetoCompra: string;
  valorTotalEstimado: number;
  valorTotalHomologado: number | null;
  situacaoCompraNome: string;
  dataPublicacaoPncp: string;
  dataAberturaProposta?: string;
  dataEncerramentoProposta?: string;
  srp: boolean;
  tipoInstrumentoConvocatorioNome?: string;
};

/** Contratações (licitações/dispensas) publicadas por período e modalidade. 8 = Dispensa, 9 = Inexigibilidade, 6 = Pregão Eletrônico */
export async function listContratacoes(params: { dataInicial?: string; dataFinal?: string; modalidade: number; uf?: string; cnpj?: string; pagina?: number; tamanhoPagina?: number }) {
  const q = new URLSearchParams({
    dataInicial: params.dataInicial ?? yyyymmdd(daysAgo(3)),
    dataFinal: params.dataFinal ?? yyyymmdd(new Date()),
    codigoModalidadeContratacao: String(params.modalidade),
    pagina: String(params.pagina ?? 1),
    tamanhoPagina: String(Math.min(params.tamanhoPagina ?? PNCP_MAX_PAGINA, PNCP_MAX_PAGINA)),
  });
  if (params.uf) q.set("uf", params.uf);
  if (params.cnpj) q.set("cnpj", params.cnpj);
  return getJSON<PageResp<ContratacaoPNCP>>(`${PNCP_CONSULTA}/contratacoes/publicacao?${q}`, { revalidate: 600, timeoutMs: 30000 });
}

export async function getContrato(cnpjOrgao: string, ano: string | number, seq: string | number) {
  return getJSON<ContratoPNCP & Record<string, unknown>>(`${PNCP_API}/orgaos/${cnpjOrgao}/contratos/${ano}/${seq}`, { revalidate: 3600 });
}

export type ItemCompra = {
  numeroItem: number;
  descricao: string;
  materialOuServicoNome: string;
  valorUnitarioEstimado: number;
  valorTotal: number;
  quantidade: number;
  unidadeMedida: string;
  criterioJulgamentoNome: string;
  situacaoCompraItemNome: string;
  temResultado: boolean;
  orcamentoSigiloso: boolean;
};

export async function getItensCompra(cnpjOrgao: string, ano: string | number, seq: string | number) {
  return getJSON<ItemCompra[]>(`${PNCP_API}/orgaos/${cnpjOrgao}/compras/${ano}/${seq}/itens?pagina=1&tamanhoPagina=50`, { revalidate: 3600 });
}

export type ResultadoItem = {
  numeroItem: number;
  niFornecedor: string;
  nomeRazaoSocialFornecedor: string;
  valorUnitarioHomologado: number;
  valorTotalHomologado: number;
  quantidadeHomologada: number;
  situacaoCompraItemResultadoNome?: string;
};

export async function getResultadosItem(cnpjOrgao: string, ano: string | number, seq: string | number, item: number) {
  return getJSON<ResultadoItem[]>(`${PNCP_API}/orgaos/${cnpjOrgao}/compras/${ano}/${seq}/itens/${item}/resultados`, { revalidate: 3600 });
}

export type SearchItem = {
  id: string;
  title: string;
  description: string;
  item_url: string;
  document_type: "contrato" | "edital" | "ata";
  ano: string;
  numero_sequencial: string;
  numero_controle_pncp: string;
  orgao_cnpj: string;
  orgao_nome: string;
  unidade_nome: string;
  esfera_nome: string;
  municipio_nome: string;
  uf: string;
  modalidade_licitacao_nome: string;
  situacao_nome: string;
  data_publicacao_pncp: string;
  data_assinatura?: string;
  data_inicio_vigencia?: string;
  data_fim_vigencia?: string;
  valor_global?: number;
  cnpj_fornecedor?: string;
  nome_fornecedor?: string;
  tipo_nome?: string;
};

/** Busca textual do próprio site do PNCP (por objeto, CNPJ, nome de fornecedor, órgão). */
export async function searchPNCP(params: { q: string; tipo?: "contrato" | "edital" | "ata"; uf?: string; pagina?: number; tam?: number }) {
  const q = new URLSearchParams({
    q: params.q,
    tipos_documento: params.tipo ?? "contrato",
    ordenacao: "-data",
    pagina: String(params.pagina ?? 1),
    tam_pagina: String(params.tam ?? 20),
    status: "todos",
  });
  if (params.uf) q.set("ufs", params.uf);
  return getJSON<{ items: SearchItem[]; total: number }>(`${PNCP_SEARCH}?${q}`, {
    revalidate: 600,
    timeoutMs: 30000,
    headers: { Referer: "https://pncp.gov.br/app/contratos" },
  });
}

export const MODALIDADES: Record<number, string> = {
  1: "Leilão eletrônico",
  2: "Diálogo competitivo",
  3: "Concurso",
  4: "Concorrência eletrônica",
  5: "Concorrência presencial",
  6: "Pregão eletrônico",
  7: "Pregão presencial",
  8: "Dispensa de licitação",
  9: "Inexigibilidade",
  10: "Manifestação de interesse",
  11: "Pré-qualificação",
  12: "Credenciamento",
  13: "Leilão presencial",
};
