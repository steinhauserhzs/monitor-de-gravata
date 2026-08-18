/**
 * Postgres (Neon) — ÍNDICES DERIVADOS, nunca fonte da verdade.
 *
 * A v1 do Monitor funciona sem banco: o repositório é o banco (data/) e as APIs oficiais
 * são consultadas ao vivo. O Postgres entra só para o que NÃO cabe em uma requisição:
 * cruzamentos em escala nacional (doador × fornecedor), séries históricas (cota, presença,
 * leis por autor), busca e alertas. Tudo gerado por jobs em lote a partir de fonte oficial,
 * com `fonte_url` e `coletado_em` em cada linha — se o banco sumir, o site continua de pé.
 *
 * Uso: defina DATABASE_URL (Neon, tier free). Sem a variável, `db()` devolve null e o app
 * segue funcionando com as APIs ao vivo.
 */
import { neon } from "@neondatabase/serverless";

export const temBanco = () => Boolean(process.env.DATABASE_URL);

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

/* ───────── Consultas de leitura (o app NUNCA escreve) ───────── */

export type CotaDaEmpresa = {
  fornecedor_nome: string;
  n_deputados: number;
  n_notas: number;
  valor_total: string;
  deputados: { id: string; nome: string; uf: string; partido: string; valor: string }[];
};

/** Quanto uma empresa recebeu de cota parlamentar, e de quem. Só possível com índice derivado. */
export async function cotaRecebidaPorEmpresa(cnpj: string): Promise<CotaDaEmpresa | null> {
  const sql = db();
  if (!sql) return null;
  const doc = cnpj.replace(/\D/g, "");
  try {
    const linhas = (await sql.query(
      `select id_parlamentar, nome, uf, partido, count(*)::int as notas, sum(valor)::numeric as valor
         from cota_parlamentar where fornecedor_documento = $1
        group by id_parlamentar, nome, uf, partido
        order by valor desc limit 50`,
      [doc],
    )) as { id_parlamentar: string; nome: string; uf: string; partido: string; notas: number; valor: string }[];
    if (!linhas.length) return null;
    const nome = (await sql.query(`select fornecedor_nome from cota_parlamentar where fornecedor_documento = $1 limit 1`, [doc])) as { fornecedor_nome: string }[];
    return {
      fornecedor_nome: nome[0]?.fornecedor_nome ?? "",
      n_deputados: linhas.length,
      n_notas: linhas.reduce((a, l) => a + l.notas, 0),
      valor_total: String(linhas.reduce((a, l) => a + Number(l.valor), 0)),
      deputados: linhas.map((l) => ({ id: l.id_parlamentar, nome: l.nome, uf: l.uf, partido: l.partido, valor: l.valor })),
    };
  } catch {
    return null;
  }
}

export type Cruzamento = {
  cnpj: string;
  razao_social: string;
  n_contratos: number;
  valor_total: string;
  n_deputados: number;
  valor_cota: string;
};

/** Empresas que recebem cota parlamentar E têm contrato público no PNCP. */
export async function empresasCotaEContrato(limite = 100): Promise<Cruzamento[]> {
  const sql = db();
  if (!sql) return [];
  try {
    return (await sql.query(
      `select f.cnpj, f.razao_social, f.n_contratos, f.valor_total,
              count(distinct c.id_parlamentar)::int as n_deputados,
              sum(c.valor)::numeric as valor_cota
         from fornecedor_contratos f
         join cota_parlamentar c on c.fornecedor_documento = f.cnpj
        group by f.cnpj, f.razao_social, f.n_contratos, f.valor_total
        order by valor_cota desc
        limit $1`,
      [limite],
    )) as Cruzamento[];
  } catch {
    return [];
  }
}

export type MetaDerivado = { chave: string; gerado_em: string; fonte_url: string; linhas: number; observacao: string | null };

export async function metaDerivados(): Promise<MetaDerivado[]> {
  const sql = db();
  if (!sql) return [];
  try {
    return (await sql.query(`select chave, gerado_em, fonte_url, linhas, observacao from derivado_meta order by chave`)) as MetaDerivado[];
  } catch {
    return [];
  }
}

/** Fornecedores que mais receberam cota parlamentar (ranking objetivo, sem juízo). */
export async function topFornecedoresCota(limite = 50) {
  const sql = db();
  if (!sql) return [];
  try {
    return (await sql.query(
      `select fornecedor_documento as cnpj, min(fornecedor_nome) as nome,
              count(distinct id_parlamentar)::int as n_deputados, count(*)::int as n_notas, sum(valor)::numeric as valor
         from cota_parlamentar
        where fornecedor_documento is not null and length(fornecedor_documento) = 14
        group by fornecedor_documento
        order by valor desc limit $1`,
      [limite],
    )) as { cnpj: string; nome: string; n_deputados: number; n_notas: number; valor: string }[];
  } catch {
    return [];
  }
}

/** Schema mínimo dos índices derivados (rodar no job, não no request). */
export const SCHEMA_SQL = `
create table if not exists derivado_meta (
  chave text primary key,
  gerado_em timestamptz not null default now(),
  fonte_url text not null,
  linhas integer not null default 0,
  observacao text
);

-- Doações de campanha (TSE) já normalizadas
create table if not exists doacao (
  ano int not null,
  uf text not null,
  id_candidato text not null,
  nome_candidato text not null,
  cargo text,
  partido text,
  doador_documento text not null,   -- CNPJ completo ou CPF mascarado, como o TSE publica
  doador_nome text not null,
  valor numeric(14,2) not null,
  fonte_url text not null,
  coletado_em date not null,
  primary key (ano, id_candidato, doador_documento, valor)
);
create index if not exists doacao_doador on doacao (doador_documento);

-- Fornecedores de contratos públicos (PNCP) agregados por CNPJ
create table if not exists fornecedor_contratos (
  cnpj text primary key,
  razao_social text,
  n_contratos int not null,
  valor_total numeric(16,2) not null,
  ufs text[],
  orgaos text[],
  fonte_url text not null,
  coletado_em date not null
);

-- Cruzamento materializado: doador que também é fornecedor público
create table if not exists doador_fornecedor (
  ano int not null,
  id_candidato text not null,
  nome_candidato text not null,
  cnpj text not null,
  razao_social text,
  valor_doado numeric(14,2) not null,
  valor_contratos numeric(16,2) not null,
  n_contratos int not null,
  fonte_url_doacao text not null,
  fonte_url_contrato text not null,
  coletado_em date not null,
  primary key (ano, id_candidato, cnpj)
);

-- Série histórica de cota parlamentar (CEAP/CEAPS)
create table if not exists cota_parlamentar (
  casa text not null,           -- camara | senado
  id_parlamentar text not null,
  nome text not null,
  uf text,
  partido text,
  ano int not null,
  mes int not null,
  tipo text not null,
  fornecedor_documento text,
  fornecedor_nome text,
  valor numeric(14,2) not null,
  fonte_url text not null,
  coletado_em date not null
);
create index if not exists cota_parlamentar_idx on cota_parlamentar (casa, id_parlamentar, ano);
create index if not exists cota_fornecedor_idx on cota_parlamentar (fornecedor_documento);
`;
