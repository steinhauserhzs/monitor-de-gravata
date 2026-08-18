import type { ContratoPNCP, ContratacaoPNCP, ItemCompra } from "@/lib/pncp";
import type { AnaliseCEAP, Despesa, DeputadoDetalhe } from "@/lib/camara";
import type { Empresa } from "@/lib/cnpj";
import type { CandidatoDetalhe, Prestacao } from "@/lib/tse";

export type Severidade = "baixa" | "media" | "alta";
export type Categoria = "contratacao" | "parlamentar" | "eleitoral" | "empresa" | "servidor" | "obra" | "municipal";

export type Finding = {
  regra: string;
  nome: string;
  categoria: Categoria;
  severidade: Severidade;
  /** Frase factual, com número. Nunca juízo de valor. */
  evidencia: string;
  /** Valor numérico do sinal (para ordenar/agregar) */
  valor?: number;
  /** Fonte do dado usado */
  fonte: string;
};

export type CtxContrato = { contrato: ContratoPNCP; empresa?: Empresa | null; itens?: ItemCompra[] | null; sancoes?: { ceis: number; cnep: number } | null };
export type CtxContratacao = { contratacao: ContratacaoPNCP };
export type CtxDeputado = { deputado: DeputadoDetalhe; ano: number; despesas: Despesa[]; analise: AnaliseCEAP; mediaBancada?: number | null };
export type CtxEmpresa = { empresa: Empresa; contratos?: { valor: number; orgao: string; data: string }[]; sancoes?: { ceis: number; cnep: number } | null };
export type CtxCandidato = { candidato: CandidatoDetalhe; prestacao?: Prestacao | null; anteriores?: { ano: number; totalDeBens: number }[] };

export type Contexts = {
  contrato: CtxContrato;
  contratacao: CtxContratacao;
  deputado: CtxDeputado;
  empresa: CtxEmpresa;
  candidato: CtxCandidato;
};

export type Rule<K extends keyof Contexts = keyof Contexts> = {
  id: string;
  nome: string;
  categoria: Categoria;
  severidade: Severidade;
  aplicaA: K;
  descricao: string;
  fonte: string;
  check: (ctx: Contexts[K]) => Finding | null;
};
