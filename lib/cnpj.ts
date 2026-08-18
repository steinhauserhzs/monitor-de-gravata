import { getJSON, safe } from "./fetcher";
import { onlyDigits } from "./format";

export type Socio = {
  nome_socio: string;
  cnpj_cpf_do_socio: string;
  qualificacao_socio: string;
  data_entrada_sociedade: string;
  faixa_etaria?: string;
  identificador_de_socio?: number;
  nome_representante_legal?: string;
};

export type Empresa = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral?: number | string;
  descricao_situacao_cadastral: string;
  data_situacao_cadastral?: string;
  data_inicio_atividade: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  natureza_juridica: string;
  porte: string;
  capital_social: number;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  municipio: string;
  uf: string;
  cep?: string;
  ddd_telefone_1?: string;
  email?: string;
  opcao_pelo_simples?: boolean | null;
  opcao_pelo_mei?: boolean | null;
  qsa: Socio[];
  cnaes_secundarios?: { codigo: number; descricao: string }[];
  _fonte: string;
};

/** BrasilAPI (dados da Receita, atualização mensal). Fallback: minhareceita.org (mesma base). */
export async function getEmpresa(cnpjInput: string): Promise<Empresa> {
  const cnpj = onlyDigits(cnpjInput);
  const a = await safe(getJSON<Empresa>(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, { revalidate: 86400 }));
  if (a.data) return { ...a.data, _fonte: "BrasilAPI (Receita Federal)" };
  const b = await safe(getJSON<Empresa>(`https://minhareceita.org/${cnpj}`, { revalidate: 86400 }));
  if (b.data) return { ...b.data, _fonte: "Minha Receita (Receita Federal)" };
  throw new Error(`CNPJ não encontrado: ${a.error} / ${b.error}`);
}

/** Idade da empresa em dias na data informada (ou hoje). */
export function idadeEmDias(dataInicio: string, ref?: string) {
  const a = new Date(dataInicio).getTime();
  const b = ref ? new Date(ref).getTime() : Date.now();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.floor((b - a) / 86400000);
}
