import { safe } from "./fetcher";
import { listDeputados, getDespesas, analisarCEAP, getVotacoesPlenario, getVotos, getOrientacoes, getProposicoesDoAutor, getTemas, getSessoesDeliberativas, getEventosDeputado, CAMARA, type AnaliseCEAP } from "./camara";
import { listSenadores, getVotacoes as getVotacoesSenador, getAutorias, getRecursosUtilizados, SENADO, SENADO_ADM } from "./senado";
import { emendasPorAutor, temChavePortal, brlPT } from "./transparencia";

/**
 * "Visão de Deus" do candidato: se ele(a) exerce mandato hoje na Câmara ou no Senado,
 * puxa o que fez com o poder que já teve — como votou (a favor/contra), pautas que
 * defende (temas das proposições), verba pública consumida (cota + emendas) e presença.
 *
 * Casamento por nome: a API da Câmara busca por NOME PARLAMENTAR (de urna), não pelo nome civil.
 * Por isso tentamos nome de urna → nome completo, e marcamos o resultado como "provável"
 * quando o nome não bate exatamente (homônimos existem — a UI avisa).
 */
const norm = (s: string) =>
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z ]/g, " ").replace(/\s+/g, " ").trim();

export type VotoResumo = {
  data: string;
  materia: string;
  descricao: string;
  voto: string;
  posicao: "a favor" | "contra" | "outro";
  orientacaoPartido?: string | null;
  seguiuPartido?: boolean | null;
  resultado?: string;
  url?: string;
};

export type Mandato360 = {
  casa: "camara" | "senado";
  id: string;
  nome: string;
  partido: string;
  uf: string;
  confianca: "exata" | "provavel";
  urlFicha: string;
  urlOficial: string;
  votos: VotoResumo[];
  totalFavor: number;
  totalContra: number;
  temas: { tema: string; n: number }[];
  proposicoes: { id: number; siglaTipo: string; numero: number; ano: number; ementa: string }[];
  cota?: { ano: number; total: number; analise?: AnaliseCEAP } | null;
  cotaHistorico?: { ano: number; total: number }[];
  emendas?: { ano: number; n: number; empenhado: number; pago: number }[] | null;
  emendasDestinos?: { destino: string; funcao: string; ano: number; empenhado: number }[] | null;
  presenca?: { presentes: number; total: number } | null;
  fontes: string[];
};

const POSITIVOS = /^sim$|^sim,|favor/i;
const NEGATIVOS = /^n[ãa]o$|contra/i;
const posicaoDoVoto = (v: string): VotoResumo["posicao"] => (POSITIVOS.test(v) ? "a favor" : NEGATIVOS.test(v) ? "contra" : "outro");

/** Procura mandato atual (Câmara ou Senado) por nome de urna / nome completo. */
export async function acharMandato(nomeUrna: string, nomeCompleto: string, uf?: string): Promise<{ casa: "camara" | "senado"; id: string; nome: string; partido: string; uf: string; confianca: "exata" | "provavel" } | null> {
  const alvos = [nomeUrna, nomeCompleto].filter(Boolean);
  for (const alvo of alvos) {
    const r = await safe(listDeputados({ nome: alvo, uf }));
    const hit = (r.data ?? []).find((d) => norm(d.nome) === norm(alvo)) ?? (r.data ?? [])[0];
    if (hit) {
      return { casa: "camara", id: String(hit.id), nome: hit.nome, partido: hit.siglaPartido, uf: hit.siglaUf, confianca: norm(hit.nome) === norm(alvo) ? "exata" : "provavel" };
    }
  }
  const sens = await safe(listSenadores());
  for (const alvo of alvos) {
    const hit = (sens.data ?? []).find((s) => norm(s.NomeParlamentar) === norm(alvo) || norm(s.NomeCompletoParlamentar) === norm(alvo));
    if (hit) return { casa: "senado", id: hit.CodigoParlamentar, nome: hit.NomeParlamentar, partido: hit.SiglaPartidoParlamentar ?? "", uf: hit.UfParlamentar ?? "", confianca: "exata" };
  }
  const parcial = (sens.data ?? []).find((s) => alvos.some((a) => norm(s.NomeCompletoParlamentar).includes(norm(a)) || norm(a).includes(norm(s.NomeParlamentar))));
  if (parcial) return { casa: "senado", id: parcial.CodigoParlamentar, nome: parcial.NomeParlamentar, partido: parcial.SiglaPartidoParlamentar ?? "", uf: parcial.UfParlamentar ?? "", confianca: "provavel" };
  return null;
}

export async function montarMandato360(nomeUrna: string, nomeCompleto: string, uf?: string): Promise<Mandato360 | null> {
  const m = await acharMandato(nomeUrna, nomeCompleto, uf);
  if (!m) return null;
  const ano = new Date().getFullYear();
  const hoje = new Date().toISOString().slice(0, 10);
  const fontes: string[] = [];

  if (m.casa === "camara") {
    const [despesas, votacoes, props, sessoes, eventos, emendas] = await Promise.all([
      safe(getDespesas(m.id, ano)),
      safe(getVotacoesPlenario(hoje)),
      safe(getProposicoesDoAutor(m.id)),
      safe(getSessoesDeliberativas(`${ano}-01-01`, hoje)),
      safe(getEventosDeputado(m.id, `${ano}-01-01`, hoje)),
      temChavePortal() ? safe(emendasPorAutor(m.nome)) : Promise.resolve({ data: null, error: null }),
    ]);
    fontes.push("Câmara dos Deputados (dados abertos)");

    // votos nominais: priorizamos votações com proposição associada (as simbólicas raramente registram voto individual)
    const todasVotacoes = votacoes.data ?? [];
    const candidatas = [...todasVotacoes.filter((v) => v.proposicaoObjeto), ...todasVotacoes.filter((v) => !v.proposicaoObjeto)].slice(0, 36);
    const detalhes = await Promise.all(
      candidatas.map(async (v) => {
        const [votos, orient] = await Promise.all([safe(getVotos(v.id)), safe(getOrientacoes(v.id))]);
        const meu = (votos.data ?? []).find((x) => String(x.deputado_?.id) === m.id);
        if (!meu) return null;
        const o = (orient.data ?? []).find((x) => x.siglaPartidoBloco?.toUpperCase().includes((m.partido || "").toUpperCase()))?.orientacaoVoto ?? null;
        const voto: VotoResumo = {
          data: v.data,
          materia: v.proposicaoObjeto ?? "",
          descricao: v.descricao,
          voto: meu.tipoVoto,
          posicao: posicaoDoVoto(meu.tipoVoto),
          orientacaoPartido: o,
          seguiuPartido: o && !/liber/i.test(o) ? o.toLowerCase() === meu.tipoVoto.toLowerCase() : null,
          resultado: v.aprovacao === 1 ? "aprovado" : v.aprovacao === 0 ? "rejeitado" : undefined,
          url: `https://www.camara.leg.br/presenca-comissoes/votacao-portal?reuniao=${v.id}`,
        };
        return voto;
      }),
    );
    const votos = detalhes.filter(Boolean) as VotoResumo[];

    // pautas (temas das proposições de autoria)
    const amostra = (props.data ?? []).slice(0, 24);
    const temasArr = await Promise.all(amostra.map((p) => safe(getTemas(p.id))));
    const contagem = new Map<string, number>();
    temasArr.forEach((t) => (t.data ?? []).forEach((x) => contagem.set(x.tema, (contagem.get(x.tema) ?? 0) + 1)));

    const analise = analisarCEAP(despesas.data ?? []);
    const sessoesIds = new Set((sessoes.data ?? []).map((e) => e.id));
    const presentes = (eventos.data ?? []).filter((e) => sessoesIds.has(e.id)).length;

    const porAnoEmenda = new Map<number, { n: number; empenhado: number; pago: number }>();
    for (const e of emendas.data ?? []) {
      const a = porAnoEmenda.get(e.ano) ?? { n: 0, empenhado: 0, pago: 0 };
      a.n++;
      a.empenhado += brlPT(e.valorEmpenhado);
      a.pago += brlPT(e.valorPago);
      porAnoEmenda.set(e.ano, a);
    }
    if (emendas.data?.length) fontes.push("Portal da Transparência (emendas/SIOP)");

    return {
      ...m,
      urlFicha: `/politicos/deputado/${m.id}`,
      urlOficial: `https://www.camara.leg.br/deputados/${m.id}`,
      votos,
      totalFavor: votos.filter((v) => v.posicao === "a favor").length,
      totalContra: votos.filter((v) => v.posicao === "contra").length,
      temas: [...contagem.entries()].map(([tema, n]) => ({ tema, n })).sort((a, b) => b.n - a.n).slice(0, 10),
      proposicoes: (props.data ?? []).slice(0, 10),
      cota: { ano, total: analise.total, analise },
      emendas: emendas.data ? [...porAnoEmenda.entries()].map(([ano, v]) => ({ ano, ...v })).sort((a, b) => b.ano - a.ano) : null,
      emendasDestinos: emendas.data ? (emendas.data ?? []).slice(0, 10).map((e) => ({ destino: e.localidadeDoGasto, funcao: e.funcao, ano: e.ano, empenhado: brlPT(e.valorEmpenhado) })) : null,
      presenca: sessoesIds.size ? { presentes, total: sessoesIds.size } : null,
      fontes,
    };
  }

  // Senado
  const [votacoes, autorias, recursos, emendas] = await Promise.all([
    safe(getVotacoesSenador(m.id)),
    safe(getAutorias(m.id)),
    safe(getRecursosUtilizados(m.id)),
    temChavePortal() ? safe(emendasPorAutor(m.nome)) : Promise.resolve({ data: null, error: null }),
  ]);
  fontes.push("Senado Federal (dados abertos)");
  const g = (o: unknown, path: string): unknown => path.split(".").reduce<unknown>((a, k) => (a && typeof a === "object" ? (a as Record<string, unknown>)[k] : undefined), o);
  const votos: VotoResumo[] = (votacoes.data ?? [])
    .slice()
    .reverse()
    .filter((v) => /^(Sim|Não|Abst)/i.test(String(g(v, "SiglaDescricaoVoto") ?? "")))
    .slice(0, 20)
    .map((v) => ({
      data: String(g(v, "SessaoPlenaria.DataSessao") ?? ""),
      materia: String(g(v, "Materia.DescricaoIdentificacao") ?? ""),
      descricao: String(g(v, "Materia.Ementa") ?? ""),
      voto: String(g(v, "SiglaDescricaoVoto") ?? ""),
      posicao: posicaoDoVoto(String(g(v, "SiglaDescricaoVoto") ?? "")),
      resultado: String(g(v, "DescricaoResultado") ?? ""),
      url: `https://www25.senado.leg.br/web/atividade/materias/-/materia/${g(v, "Materia.Codigo")}`,
    }));
  const contagem = new Map<string, number>();
  for (const a of autorias.data ?? []) {
    const sig = String(g(a, "Materia.Sigla") ?? "");
    if (sig) contagem.set(sig, (contagem.get(sig) ?? 0) + 1);
  }
  const porAnoEmenda = new Map<number, { n: number; empenhado: number; pago: number }>();
  for (const e of emendas.data ?? []) {
    const a = porAnoEmenda.get(e.ano) ?? { n: 0, empenhado: 0, pago: 0 };
    a.n++;
    a.empenhado += brlPT(e.valorEmpenhado);
    a.pago += brlPT(e.valorPago);
    porAnoEmenda.set(e.ano, a);
  }
  if (emendas.data?.length) fontes.push("Portal da Transparência (emendas/SIOP)");
  if (recursos.data) fontes.push("Senado — dados abertos administrativos (CEAPS)");

  return {
    ...m,
    urlFicha: `/politicos/senador/${m.id}`,
    urlOficial: `https://www25.senado.leg.br/web/senadores/senador/-/perfil/${m.id}`,
    votos,
    totalFavor: votos.filter((v) => v.posicao === "a favor").length,
    totalContra: votos.filter((v) => v.posicao === "contra").length,
    temas: [...contagem.entries()].map(([tema, n]) => ({ tema: `Matérias ${tema}`, n })).sort((a, b) => b.n - a.n).slice(0, 8),
    proposicoes: [],
    cota: recursos.data ? { ano: recursos.data.ano, total: recursos.data.cotas?.totalValor ?? 0 } : null,
    emendas: emendas.data ? [...porAnoEmenda.entries()].map(([ano, v]) => ({ ano, ...v })).sort((a, b) => b.ano - a.ano) : null,
    emendasDestinos: emendas.data ? (emendas.data ?? []).slice(0, 10).map((e) => ({ destino: e.localidadeDoGasto, funcao: e.funcao, ano: e.ano, empenhado: brlPT(e.valorEmpenhado) })) : null,
    presenca: null,
    fontes: [...fontes, SENADO, SENADO_ADM, CAMARA].slice(0, 4),
  };
}
