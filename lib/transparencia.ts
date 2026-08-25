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
export type Sancoes =
  | { ok: true; ceis: number; cnep: number; ceisLista: SancaoCEIS[]; cnepLista: SancaoCEIS[] }
  | { ok: false; motivo: "sem-chave" | "falha"; erro: string | null };

/**
 * Sanções (CEIS/CNEP) de um CNPJ.
 *
 * ATENÇÃO — este campo exonera alguém quando dá errado.
 * A versão antiga fazia `a.data ?? []` e devolvia `ceis: 0` quando a consulta
 * falhava: a ficha então afirmava "Sanções: 0" para uma empresa que ninguém
 * conseguiu checar. Dizer "não tem sanção" sem ter olhado é pior do que não
 * dizer nada. Por isso a falha agora sai tipada, e quem exibe é obrigado a
 * tratar `ok: false` como DESCONHECIDO — nunca como zero.
 */
export async function sancoesPorCNPJ(cnpjInput: string): Promise<Sancoes> {
  if (!temChavePortal()) return { ok: false, motivo: "sem-chave", erro: null };
  const cnpj = onlyDigits(cnpjInput);
  const [a, b] = await Promise.all([
    safe(pt<SancaoCEIS[]>(`/ceis?codigoSancionado=${cnpj}&pagina=1`)),
    safe(pt<SancaoCEIS[]>(`/cnep?codigoSancionado=${cnpj}&pagina=1`)),
  ]);
  // qualquer uma das duas listas faltando já torna a contagem não confiável
  if (!a.data || !b.data) {
    return { ok: false, motivo: "falha", erro: a.error ?? b.error };
  }
  return { ok: true, ceis: a.data.length, cnep: b.data.length, ceisLista: a.data, cnepLista: b.data };
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
  // O SIOP grava o autor em CAIXA ALTA; o filtro por ano só devolve algo se houver emenda naquele ano — por isso buscamos sem ano e agrupamos na UI.
  const q = new URLSearchParams({ nomeAutor: nomeAutor.toUpperCase(), pagina: String(pagina) });
  if (ano) q.set("ano", String(ano));
  const r = await safe(pt<EmendaPT[]>(`/emendas?${q}`));
  return r.data ?? [];
}

export const brlPT = (v: string | number | undefined) => Number(String(v ?? "0").replace(/\./g, "").replace(",", ".")) || 0;
