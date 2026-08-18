import { getJSON } from "./fetcher";

export const SENADO = "https://legis.senado.leg.br/dadosabertos";

export type SenadorResumo = {
  CodigoParlamentar: string;
  NomeParlamentar: string;
  NomeCompletoParlamentar: string;
  SexoParlamentar?: string;
  UrlFotoParlamentar?: string;
  UrlPaginaParlamentar?: string;
  EmailParlamentar?: string;
  SiglaPartidoParlamentar?: string;
  UfParlamentar?: string;
};

type ListaAtual = {
  ListaParlamentarEmExercicio: {
    Parlamentares: { Parlamentar: { IdentificacaoParlamentar: SenadorResumo; Mandato?: unknown }[] };
  };
};

export async function listSenadores() {
  const r = await getJSON<ListaAtual>(`${SENADO}/senador/lista/atual`, { revalidate: 3600 });
  return r.ListaParlamentarEmExercicio.Parlamentares.Parlamentar.map((p) => p.IdentificacaoParlamentar);
}

export type SenadorDetalhe = {
  IdentificacaoParlamentar: SenadorResumo;
  DadosBasicosParlamentar?: { DataNascimento?: string; Naturalidade?: string; UfNaturalidade?: string; EnderecoParlamentar?: string };
  Telefones?: { Telefone: { NumeroTelefone: string }[] | { NumeroTelefone: string } };
};

export async function getSenador(codigo: string) {
  const r = await getJSON<{ DetalheParlamentar: { Parlamentar: SenadorDetalhe } }>(`${SENADO}/senador/${codigo}`, {
    revalidate: 3600,
  });
  return r.DetalheParlamentar.Parlamentar;
}

const arr = <T,>(x: T | T[] | undefined | null): T[] => (x == null ? [] : Array.isArray(x) ? x : [x]);

export async function getMandatos(codigo: string) {
  const r = await getJSON<{ MandatoParlamentar: { Parlamentar: { Mandatos?: { Mandato: unknown } } } }>(
    `${SENADO}/senador/${codigo}/mandatos`,
    { revalidate: 86400 },
  );
  return arr(r.MandatoParlamentar?.Parlamentar?.Mandatos?.Mandato) as Record<string, unknown>[];
}

export async function getComissoes(codigo: string) {
  const r = await getJSON<{ MembroComissaoParlamentar: { Parlamentar: { MembroComissoes?: { Comissao: unknown } } } }>(
    `${SENADO}/senador/${codigo}/comissoes`,
    { revalidate: 86400 },
  );
  return arr(r.MembroComissaoParlamentar?.Parlamentar?.MembroComissoes?.Comissao) as Record<string, unknown>[];
}

export async function getAutorias(codigo: string) {
  const r = await getJSON<{ MateriasAutoriaParlamentar: { Parlamentar: { Autorias?: { Autoria: unknown } } } }>(
    `${SENADO}/senador/${codigo}/autorias`,
    { revalidate: 86400 },
  );
  return arr(r.MateriasAutoriaParlamentar?.Parlamentar?.Autorias?.Autoria) as Record<string, unknown>[];
}

export async function getVotacoes(codigo: string) {
  const r = await getJSON<{ VotacaoParlamentar: { Parlamentar: { Votacoes?: { Votacao: unknown } } } }>(
    `${SENADO}/senador/${codigo}/votacoes`,
    { revalidate: 86400 },
  );
  return arr(r.VotacaoParlamentar?.Parlamentar?.Votacoes?.Votacao) as Record<string, unknown>[];
}

export async function getFiliacoes(codigo: string) {
  const r = await getJSON<{ FiliacaoParlamentar: { Parlamentar: { Filiacoes?: { Filiacao: unknown } } } }>(
    `${SENADO}/senador/${codigo}/filiacoes`,
    { revalidate: 86400 },
  );
  return arr(r.FiliacaoParlamentar?.Parlamentar?.Filiacoes?.Filiacao) as Record<string, unknown>[];
}
