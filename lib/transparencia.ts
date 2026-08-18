import { getJSON, safe } from "./fetcher";
import { onlyDigits } from "./format";

/**
 * Portal da Transparência (CGU) — exige chave gratuita.
 * Cadastro: https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email
 * Env: PORTAL_TRANSPARENCIA_KEY (só no servidor).
 */
export const PT = "https://api.portaldatransparencia.gov.br/api-de-dados";

export const temChavePortal = () => Boolean(process.env.PORTAL_TRANSPARENCIA_KEY);

async function pt<T>(path: string) {
  const key = process.env.PORTAL_TRANSPARENCIA_KEY;
  if (!key) throw new Error("PORTAL_TRANSPARENCIA_KEY ausente");
  return getJSON<T>(`${PT}${path}`, { headers: { "chave-api-dados": key }, revalidate: 3600 });
}

export type SancaoCEIS = {
  id: number;
  dataInicioSancao: string;
  dataFimSancao: string;
  tipoSancao?: { descricaoResumida: string };
  orgaoSancionador?: { nome: string; siglaUf?: string };
  sancionado?: { nome: string; codigoFormatado: string };
  fundamentacao?: { descricao: string }[];
  fonteSancao?: { nomeExibicao: string };
};

/** Conta sanções CEIS + CNEP para um CNPJ. Retorna null se não houver chave. */
export async function sancoesPorCNPJ(cnpjInput: string): Promise<{ ceis: number; cnep: number; ceisLista: SancaoCEIS[]; cnepLista: SancaoCEIS[] } | null> {
  if (!temChavePortal()) return null;
  const cnpj = onlyDigits(cnpjInput);
  const [a, b] = await Promise.all([
    safe(pt<SancaoCEIS[]>(`/ceis?codigoSancionado=${cnpj}&pagina=1`)),
    safe(pt<SancaoCEIS[]>(`/cnep?codigoSancionado=${cnpj}&pagina=1`)),
  ]);
  const ceisLista = a.data ?? [];
  const cnepLista = b.data ?? [];
  return { ceis: ceisLista.length, cnep: cnepLista.length, ceisLista, cnepLista };
}

export type ContratoPT = {
  id: number;
  numero: string;
  objeto: string;
  dataAssinatura: string;
  dataInicioVigencia: string;
  dataFimVigencia: string;
  valorInicialCompra: number;
  valorFinalCompra: number;
  unidadeGestora?: { nome: string; orgaoVinculado?: { nome: string } };
  fornecedor?: { nome: string; cnpjFormatado: string };
  modalidadeCompra?: string;
  situacaoContrato?: string;
};

export async function contratosFederaisPorCNPJ(cnpjInput: string, pagina = 1) {
  if (!temChavePortal()) return null;
  const cnpj = onlyDigits(cnpjInput);
  const r = await safe(pt<ContratoPT[]>(`/contratos/cpf-cnpj?cpfCnpj=${cnpj}&pagina=${pagina}`));
  return r.data ?? [];
}

export type EmendaPT = {
  codigoEmenda: string;
  ano: number;
  tipoEmenda: string;
  autor: string;
  nomeAutor?: string;
  numeroEmenda: string;
  localidadeDoGasto: string;
  funcao: string;
  subfuncao: string;
  valorEmpenhado: string;
  valorLiquidado: string;
  valorPago: string;
};

/** Emendas parlamentares por nome do autor (como consta no SIOP). */
export async function emendasPorAutor(nomeAutor: string, ano?: number, pagina = 1) {
  if (!temChavePortal()) return null;
  const q = new URLSearchParams({ nomeAutor, pagina: String(pagina) });
  if (ano) q.set("ano", String(ano));
  const r = await safe(pt<EmendaPT[]>(`/emendas?${q}`));
  return r.data ?? [];
}
