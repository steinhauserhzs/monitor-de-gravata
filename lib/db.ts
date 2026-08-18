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
