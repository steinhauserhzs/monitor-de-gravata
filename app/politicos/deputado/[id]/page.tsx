import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumbs, Notice, Source } from "@/components/ui";
import { KPI, Bars, Flags, Timeline, NoticiasList, Panel, type TLItem } from "@/components/ficha";
import {
  getDeputado,
  getDespesas,
  analisarCEAP,
  getOrgaos,
  getFrentes,
  getProposicoesDoAutor,
  getSessoesDeliberativas,
  getEventosDeputado,
  getVotacoesNominais,
  getDiscursos,
  getMandatosExternos,
  getHistorico,
  getOcupacoes,
  getCeapArquivo,
  CAMARA,
} from "@/lib/camara";
import { safe } from "@/lib/fetcher";
import { runRules } from "@/lib/rules";
import { brl, pct, dateBR, nowBR } from "@/lib/format";
import { noticiasGoogle } from "@/lib/noticias";
import { checagensSobre } from "@/lib/checagens";
import { Checagens } from "@/components/Checagens";
import { wdBuscar, wdTimeline } from "@/lib/wikidata";
import { emendasPorAutor, temChavePortal, brlPT } from "@/lib/transparencia";
import { pistasDeVinculo, sobrenomesRaros, servidoresPorSobrenome } from "@/lib/vinculos";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ANO_ATUAL = new Date().getFullYear();

export async function generateMetadata({ params }: PageProps<"/politicos/deputado/[id]">) {
  const { id } = await params;
  const d = await safe(getDeputado(id));
  return { title: d.data ? `${d.data.ultimoStatus.nome} — Ficha 360` : "Deputado" };
}

export default async function FichaDeputado({ params, searchParams }: PageProps<"/politicos/deputado/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const ano = Number(Array.isArray(sp.ano) ? sp.ano[0] : sp.ano) || ANO_ATUAL;
  const dep = await safe(getDeputado(id));
  if (!dep.data) notFound();
  const d = dep.data;
  const s = d.ultimoStatus;
  const ini = `${ano}-01-01`;
  const fim = ano === ANO_ATUAL ? new Date().toISOString().slice(0, 10) : `${ano}-12-31`;

  const [despesas, orgaos, frentes, props, sessoes, eventos, votacoes, discursos, mandExt, historico, ocupacoes, noticias, checagens, wd, emendas] = await Promise.all([
    safe(getDespesas(id, ano)),
    safe(getOrgaos(id)),
    safe(getFrentes(id)),
    safe(getProposicoesDoAutor(id)),
    safe(getSessoesDeliberativas(ini, fim)),
    safe(getEventosDeputado(id, ini, fim)),
    safe(getVotacoesNominais(fim)),
    safe(getDiscursos(id, ini, fim, 8)),
    safe(getMandatosExternos(id)),
    safe(getHistorico(id)),
    safe(getOcupacoes(id)),
    noticiasGoogle(`"${s.nome}" deputado`),
    checagensSobre(s.nome),
    safe(wdBuscar(d.nomeCivil)),
    temChavePortal() ? safe(emendasPorAutor(s.nome)) : Promise.resolve({ data: null, error: null }),
  ]);

  /* ── CEAP (API ao vivo; se vier vazia, usa o arquivo anual oficial) ── */
  const analiseApi = analisarCEAP(despesas.data ?? []);
  const arquivo = analiseApi.qtd === 0 ? getCeapArquivo(ano, id) : null;
  const analise = arquivo
    ? { total: arquivo.total, qtd: arquivo.qtd, porTipo: arquivo.porTipo.map((t) => ({ ...t, qtd: 0 })), porFornecedor: arquivo.porFornecedor.map((f) => ({ ...f, share: arquivo.total ? f.total / arquivo.total : 0 })), porMes: arquivo.porMes, maiorNota: arquivo.maiorNota as never, concentracaoTop1: arquivo.porFornecedor[0] && arquivo.total ? arquivo.porFornecedor[0].total / arquivo.total : 0, concentracaoTop3: arquivo.porFornecedor.slice(0, 3).reduce((a, f) => a + (arquivo.total ? f.total / arquivo.total : 0), 0), glosas: 0 }
    : analiseApi;
  const findings = runRules("cota", { analise, ano, casa: "camara", mediaBancada: null });

  /* ── Presença ── */
  const sessoesIds = new Set((sessoes.data ?? []).map((e) => e.id));
  const presentes = (eventos.data ?? []).filter((e) => sessoesIds.has(e.id));
  const taxaPresenca = sessoesIds.size ? presentes.length / sessoesIds.size : null;
  const comissoesEventos = (eventos.data ?? []).filter((e) => e.descricaoTipo !== "Sessão Deliberativa").length;

  /* ── Votações: como votou nas últimas nominais do plenário ── */
  // muitas votações do Plenário são simbólicas (sem voto individual): sondamos até 30 e ficamos com as nominais
  const nominais = (votacoes.data ?? []).map(({ votacao: v, votos, orientacoes }) => {
    const meu = votos.find((x) => x.deputado_?.id === d.id);
    const o = orientacoes.find((x) => x.siglaPartidoBloco?.toUpperCase().includes(s.siglaPartido.toUpperCase()));
    return { v, meu: meu?.tipoVoto ?? null, orientacao: o?.orientacaoVoto ?? null, nominal: true };
  });
  const comparaveis = nominais.filter((x) => x.meu && x.orientacao && !/liber/i.test(x.orientacao));
  const coerentes = comparaveis.filter((x) => x.meu?.toLowerCase() === x.orientacao?.toLowerCase()).length;

  /* ── Produtividade (amostra) ── */
  const porTipo = new Map<string, number>();
  for (const p of props.data ?? []) porTipo.set(p.siglaTipo, (porTipo.get(p.siglaTipo) ?? 0) + 1);

  /* ── Linha do tempo ── */
  const tl: TLItem[] = [];
  for (const m of mandExt.data ?? [])
    tl.push({ data: String(m.anoInicio), fim: m.anoFim ? String(m.anoFim) : undefined, tipo: "mandato", titulo: `${m.cargo} · ${m.municipio ?? m.siglaUf}`, detalhe: m.siglaPartidoEleicao ? `eleito por ${m.siglaPartidoEleicao}` : undefined, fonte: "Câmara (mandatos externos)", url: `${CAMARA}/deputados/${id}/mandatosExternos` });
  const partidosVistos = new Set<string>();
  for (const h of historico.data ?? []) {
    const key = `${h.idLegislatura}-${h.siglaPartido}`;
    if (partidosVistos.has(key)) continue;
    partidosVistos.add(key);
    tl.push({ data: h.dataHora?.slice(0, 10), tipo: "legislatura", titulo: `Dep. federal · ${h.siglaPartido}-${h.siglaUf} (leg. ${h.idLegislatura})`, detalhe: h.descricaoStatus ?? undefined, fonte: "Câmara (histórico)", url: `${CAMARA}/deputados/${id}/historico` });
  }
  for (const o of ocupacoes.data ?? []) if (o.titulo) tl.push({ data: o.anoInicio ? String(o.anoInicio) : undefined, fim: o.anoFim ? String(o.anoFim) : undefined, tipo: "ocupação", titulo: o.titulo, detalhe: [o.entidade, o.entidadeUF].filter(Boolean).join(" · ") || undefined, fonte: "Câmara (ocupações)" });
  const wdHit = wd.data?.[0];
  const wdTl = wdHit ? await safe(wdTimeline(wdHit.id)) : { data: null, error: null };
  for (const e of wdTl.data ?? []) tl.push({ data: e.inicio, fim: e.fim, tipo: e.tipo, titulo: e.titulo, detalhe: e.detalhe, fonte: e.fonte, url: e.url });
  tl.sort((a, b) => (a.data ?? "0").localeCompare(b.data ?? "0"));

  const partidos = [...new Set((historico.data ?? []).map((h) => h.siglaPartido))];
  const raros = sobrenomesRaros(d.nomeCivil);
  const servidores = raros[0] ? await servidoresPorSobrenome(raros[0]) : null;
  const pistas = pistasDeVinculo(d.nomeCivil, s.siglaUf);
  const coletado = nowBR();

  return (
    <>
      <Crumbs items={[{ href: "/politicos", label: "Políticos" }, { label: s.nome }]} />
      {/* CABEÇALHO */}
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-8 border-b-2 border-ink">
        <div className="flex flex-col gap-6 md:flex-row md:items-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.urlFoto} alt={`Foto oficial de ${s.nome}`} className="h-44 w-36 object-cover grayscale contrast-125 border-2 border-ink" />
          <div className="flex-1">
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-3">Deputado(a) federal · {s.siglaPartido}-{s.siglaUf} · id Câmara {d.id}</div>
            <h1 className="font-display text-4xl md:text-6xl leading-[0.95] mt-1 rise">{s.nome}</h1>
            <div className="mt-2 text-sm text-ink-2">
              {d.nomeCivil} · nascido(a) em {dateBR(d.dataNascimento)} {d.municipioNascimento ? `em ${d.municipioNascimento}/${d.ufNascimento}` : ""} · {d.escolaridade ?? "escolaridade não informada"}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="stamp stamp--flat stamp--ink">{s.situacao ?? "em exercício"}</span>
              {s.condicaoEleitoral && <span className="stamp stamp--flat stamp--azul">{s.condicaoEleitoral}</span>}
              {partidos.length > 1 && <span className="stamp stamp--flat">{partidos.length} partidos na Câmara</span>}
              {findings.some((f) => f.severidade === "alta") && <span className="stamp stamp--flat">red flag alta</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 font-mono text-[0.62rem] uppercase tracking-[0.12em]">
              <a className="underline underline-offset-2" href={`https://www.camara.leg.br/deputados/${d.id}`} target="_blank" rel="noopener noreferrer">página oficial ↗</a>
              <a className="underline underline-offset-2" href={`${CAMARA}/deputados/${d.id}`} target="_blank" rel="noopener noreferrer">json da API ↗</a>
              {wdHit && <a className="underline underline-offset-2" href={`https://www.wikidata.org/wiki/${wdHit.id}`} target="_blank" rel="noopener noreferrer">wikidata ↗</a>}
              {(d.redeSocial ?? []).slice(0, 4).map((r) => (
                <a key={r} className="underline underline-offset-2" href={r} target="_blank" rel="noopener noreferrer nofollow">{new URL(r).hostname.replace("www.", "")} ↗</a>
              ))}
            </div>
          </div>
          <form className="flex items-end gap-2">
            <label className="block">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Ano de referência</span>
              <select name="ano" defaultValue={ano} className="input">
                {[ANO_ATUAL, ANO_ATUAL - 1, ANO_ATUAL - 2, ANO_ATUAL - 3].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </label>
            <button className="btn" type="submit">Trocar</button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        {/* KPIs */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          <KPI label={`Cota parlamentar ${ano}`} value={analise.total ? brl(analise.total) : "—"} hint={despesas.error ? "API da Câmara indisponível" : `${analise.qtd} notas · ${analise.porFornecedor.length} fornecedores`} />
          <KPI label="Presença no plenário" value={taxaPresenca === null ? "—" : pct(taxaPresenca)} hint={`${presentes.length}/${sessoesIds.size} sessões deliberativas em ${ano}`} tone={taxaPresenca !== null && taxaPresenca < 0.5 ? "stamp" : undefined} />
          <KPI label="Coerência c/ partido" value={comparaveis.length ? pct(coerentes / comparaveis.length) : "—"} hint={`${coerentes}/${comparaveis.length} nas últimas votações nominais`} />
          <KPI label="Proposições (amostra)" value={props.data?.length ?? "—"} hint={[...porTipo.entries()].slice(0, 4).map(([k, v]) => `${k} ${v}`).join(" · ") || "sem dados"} />
          <KPI label="Comissões / frentes" value={`${(orgaos.data ?? []).filter((o) => !o.dataFim).length} / ${frentes.data?.length ?? 0}`} hint="atuais / total de frentes" />
          <KPI label="Red flags" value={findings.length} hint={findings.length ? `${findings.filter((f) => f.severidade === "alta").length} alta · ${findings.filter((f) => f.severidade === "media").length} média` : "nenhum sinal automático"} tone={findings.some((f) => f.severidade === "alta") ? "stamp" : "verde"} />
        </div>

        <Notice tone="info" title="Como ler esta ficha">
          Tudo aqui é dado oficial coletado ao vivo (Câmara, Wikidata, Google Notícias) em {coletado}. Red flags são sinais objetivos calculados por{" "}
          <Link href="/radar" className="underline">regras públicas</Link> — não são acusações. Presença = sessões deliberativas do Plenário em que consta participação ÷ total de sessões deliberativas do ano.
          Coerência = votos iguais à orientação do próprio partido nas últimas votações nominais. Produtividade mostra uma amostra (100 últimas proposições); a contagem completa de leis aprovadas está no roadmap (processamento em lote).
        </Notice>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          {/* COLUNA A */}
          <div className="space-y-6">
            <Panel kicker="§1" title={`Cota parlamentar (CEAP) ${ano}`} right={<Source url={`${CAMARA}/deputados/${id}/despesas?ano=${ano}`} label="Câmara" />}>
              {arquivo && (
                <Notice tone="info" title="Fonte: arquivo anual oficial">
                  A API de despesas da Câmara está devolvendo vazio; estes números vêm do arquivo anual oficial (<a className="underline" href={arquivo.fonte} target="_blank" rel="noopener noreferrer">Ano-{ano}.json.zip</a>), coletado em {arquivo.gerado_em}. Por isso não há link para cada nota fiscal aqui.
                </Notice>
              )}
              {despesas.error && !arquivo && <Notice tone="warn">A API de despesas não respondeu ({despesas.error}) e não há arquivo anual gerado para {ano} (rode <code>npm run ceap {ano}</code>).</Notice>}
              {!despesas.error && !analise.qtd && !arquivo && <p className="text-sm text-ink-3">Nenhuma despesa registrada em {ano} (a Câmara publica com atraso de semanas; o endpoint também passa por instabilidades).</p>}
              {analise.qtd > 0 && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-2">Por tipo de despesa</div>
                    <Bars rows={analise.porTipo.slice(0, 8).map((t) => ({ label: t.tipo.replace(/\.$/, ""), sub: `${t.qtd} notas`, value: t.total }))} />
                  </div>
                  <div>
                    <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-2">Top fornecedores</div>
                    <Bars rows={analise.porFornecedor.slice(0, 8).map((f) => ({ label: f.fornecedor, sub: `${pct(f.share)} · ${f.qtd}`, value: f.total, href: f.cnpj?.length === 14 ? `/empresas/${f.cnpj}` : undefined }))} />
                  </div>
                  <div className="md:col-span-2">
                    <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-2">Por mês</div>
                    <div className="flex items-end gap-1 h-24">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                        const v = analise.porMes.find((x) => x.mes === m)?.total ?? 0;
                        const mx = Math.max(1, ...analise.porMes.map((x) => x.total));
                        return (
                          <div key={m} className="flex-1 flex flex-col items-center gap-1" title={`${m}/${ano}: ${brl(v)}`}>
                            <div className="w-full bg-ink" style={{ height: `${(v / mx) * 80}px` }} />
                            <span className="font-mono text-[0.55rem] text-ink-3">{m}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <details className="md:col-span-2" hidden={Boolean(arquivo)}>
                    <summary className="cursor-pointer font-mono text-[0.65rem] uppercase tracking-[0.16em]">Ver as {Math.min(50, analise.qtd)} maiores notas</summary>
                    <div className="overflow-x-auto mt-2">
                      <table className="table">
                        <thead><tr><th>Data</th><th>Tipo</th><th>Fornecedor</th><th>CNPJ/CPF</th><th className="text-right">Valor</th><th>Doc</th></tr></thead>
                        <tbody>
                          {[...(despesas.data ?? [])].sort((a, b) => b.valorLiquido - a.valorLiquido).slice(0, 50).map((x) => (
                            <tr key={x.codDocumento + "-" + x.parcela}>
                              <td className="font-mono text-xs whitespace-nowrap">{dateBR(x.dataDocumento)}</td>
                              <td className="text-xs">{x.tipoDespesa}</td>
                              <td className="text-xs">{x.nomeFornecedor}</td>
                              <td className="font-mono text-xs">{x.cnpjCpfFornecedor?.length === 14 ? <Link href={`/empresas/${x.cnpjCpfFornecedor}`} className="underline">{x.cnpjCpfFornecedor}</Link> : x.cnpjCpfFornecedor}</td>
                              <td className="text-right font-mono text-xs">{brl(x.valorLiquido)}</td>
                              <td className="text-xs">{x.urlDocumento ? <a href={x.urlDocumento} target="_blank" rel="noopener noreferrer" className="underline">nota ↗</a> : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>
              )}
            </Panel>

            <Panel kicker="§2" title="Red flags automáticas" right={<Link href="/radar" className="font-mono text-[0.6rem] uppercase tracking-[0.12em] underline">ver regras</Link>}>
              <Flags findings={findings} />
            </Panel>

            <Panel kicker="§3" title="Como votou — últimas votações nominais do Plenário" right={<Source url={`${CAMARA}/votacoes?dataFim=${fim}&itens=200&ordem=DESC&ordenarPor=dataHoraRegistro`} label="Câmara" />}>
              {votacoes.error && <Notice tone="warn">Votações indisponíveis: {votacoes.error}</Notice>}
              {!nominais.length && !votacoes.error && <p className="text-sm text-ink-3">Nenhuma votação nominal do Plenário localizada nos últimos ~9 meses (em recesso e período eleitoral quase tudo é votação simbólica, que não registra voto individual).</p>}
              {nominais.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead><tr><th>Data</th><th>Matéria</th><th>Voto</th><th>Orientação {s.siglaPartido}</th><th>Resultado</th></tr></thead>
                    <tbody>
                      {nominais.map(({ v, meu, orientacao }) => (
                        <tr key={v.id}>
                          <td className="font-mono text-xs whitespace-nowrap">{dateBR(v.data)}</td>
                          <td className="text-xs max-w-md"><a href={`https://www.camara.leg.br/propostas-legislativas/${String(v.id).split("-")[0]}`} className="hover:underline" target="_blank" rel="noopener noreferrer">{v.descricao?.slice(0, 180)}</a></td>
                          <td className="font-mono text-xs font-bold">{meu ?? <span className="text-ink-3">não votou/ausente</span>}</td>
                          <td className="font-mono text-xs">{orientacao ?? "—"}</td>
                          <td className="text-xs">{v.aprovacao === 1 ? "aprovado" : v.aprovacao === 0 ? "rejeitado" : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-2 text-[0.68rem] text-ink-3">"Não votou/ausente" pode ser licença, missão oficial ou obstrução orientada. Votações-chave (marcadas pela comunidade com fonte) entram no roadmap.</p>
            </Panel>

            <Panel kicker="§4" title="Produtividade legislativa (amostra das 50 últimas)" right={<Source url={`${CAMARA}/proposicoes?idDeputadoAutor=${id}`} label="Câmara" />}>
              {props.error && <Notice tone="warn">Proposições indisponíveis: {props.error}</Notice>}
              <div className="flex flex-wrap gap-2 mb-3">
                {[...porTipo.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <span key={k} className="tab">{k} · {v}</span>
                ))}
              </div>
              <ul className="space-y-1.5">
                {(props.data ?? []).slice(0, 12).map((p) => (
                  <li key={p.id} className="text-sm">
                    <a href={`https://www.camara.leg.br/propostas-legislativas/${p.id}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs underline underline-offset-2">{p.siglaTipo} {p.numero}/{p.ano}</a>{" "}
                    <span className="text-ink-2">{p.ementa?.slice(0, 160)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[0.68rem] text-ink-3">Requerimentos (REQ) contam como proposição na API. A métrica "leis de autoria transformadas em norma" exige varrer a tramitação de cada PL — está no roadmap como job em lote (GitHub Actions → data/derivados).</p>
            </Panel>
          </div>

          {/* COLUNA B */}
          <div className="space-y-6">
            <Panel kicker="§5" title="Linha do tempo política">
              <Timeline items={tl} />
              {wd.error && <p className="mt-2 text-[0.68rem] text-ink-3">Wikidata indisponível.</p>}
            </Panel>

            <Panel kicker="§6" title="Comissões e cargos" right={<Source url={`${CAMARA}/deputados/${id}/orgaos`} label="Câmara" />}>
              <ul className="space-y-1.5 text-sm">
                {(orgaos.data ?? []).slice(0, 14).map((o, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span><span className="font-mono text-xs">{o.siglaOrgao}</span> {o.nomeOrgao} <span className="text-ink-3">· {o.titulo}</span></span>
                    <span className="font-mono text-[0.6rem] text-ink-3 whitespace-nowrap">{dateBR(o.dataInicio)}{o.dataFim ? ` → ${dateBR(o.dataFim)}` : " → atual"}</span>
                  </li>
                ))}
                {!orgaos.data?.length && <li className="text-ink-3">Sem registro.</li>}
              </ul>
              {(frentes.data?.length ?? 0) > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer font-mono text-[0.65rem] uppercase tracking-[0.16em]">{frentes.data!.length} frentes parlamentares</summary>
                  <ul className="mt-2 text-xs text-ink-2 space-y-1">{frentes.data!.slice(0, 40).map((f) => <li key={f.id}>{f.titulo}</li>)}</ul>
                </details>
              )}
            </Panel>

            <Panel kicker="§7" title="Presença e atividade" right={<Source url={`${CAMARA}/deputados/${id}/eventos?dataInicio=${ini}&dataFim=${fim}`} label="Câmara" />}>
              <div className="grid grid-cols-2 gap-3">
                <KPI label="Sessões deliberativas" value={taxaPresenca === null ? "—" : `${presentes.length}/${sessoesIds.size}`} hint="com participação registrada" />
                <KPI label="Outros eventos" value={comissoesEventos} hint="comissões, audiências, reuniões" />
              </div>
              {(discursos.data?.length ?? 0) > 0 && (
                <div className="mt-4">
                  <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-1">Últimos discursos</div>
                  <ul className="space-y-1.5 text-xs text-ink-2">
                    {discursos.data!.slice(0, 5).map((x, i) => (
                      <li key={i}><span className="font-mono">{dateBR(x.dataHoraInicio)}</span> · {x.tipoDiscurso} — {(x.sumario || x.keywords || "").slice(0, 140)}{x.urlTexto && <> <a href={x.urlTexto} className="underline" target="_blank" rel="noopener noreferrer">texto ↗</a></>}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>

            <Panel kicker="§8" title="Emendas parlamentares (todas as que constam no SIOP)" right={emendas.data ? <Source url={`https://portaldatransparencia.gov.br/emendas/consulta?nomeAutor=${encodeURIComponent(s.nome)}`} label="Portal da Transparência" /> : undefined}>
              {!temChavePortal() && <p className="text-sm text-ink-3">Requer chave gratuita do Portal da Transparência (env <code className="font-mono">PORTAL_TRANSPARENCIA_KEY</code>). Enquanto isso: <a className="underline" href={`https://portaldatransparencia.gov.br/emendas/consulta?nomeAutor=${encodeURIComponent(s.nome)}`} target="_blank" rel="noopener noreferrer">consultar no Portal ↗</a></p>}
              {emendas.data && !emendas.data.length && <p className="text-sm text-ink-3">Nenhuma emenda localizada pelo nome parlamentar "{s.nome.toUpperCase()}" no SIOP (o nome pode constar diferente — confira no Portal).</p>}
              {emendas.data && emendas.data.length > 0 && (() => {
                const porAno = new Map<number, { emp: number; pago: number; n: number }>();
                for (const e of emendas.data!) { const a = porAno.get(e.ano) ?? { emp: 0, pago: 0, n: 0 }; a.emp += brlPT(e.valorEmpenhado); a.pago += brlPT(e.valorPago); a.n++; porAno.set(e.ano, a); }
                return (
                  <>
                    <div className="flex flex-wrap gap-2 mb-3">{[...porAno.entries()].sort((a, b) => b[0] - a[0]).map(([a, v]) => <span key={a} className="tab">{a} · {v.n} emenda(s) · empenhado {brl(v.emp)} · pago {brl(v.pago)}</span>)}</div>
                    <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-1">Por destino (empenhado)</div>
                    <Bars rows={emendas.data!.slice(0, 12).map((e) => ({ label: `${e.localidadeDoGasto} · ${e.funcao}`, sub: `${e.ano} · ${e.tipoEmenda.replace("Emenda ", "")}`, value: brlPT(e.valorEmpenhado) }))} />
                    <p className="mt-2 text-[0.68rem] text-ink-3">Fonte: Portal da Transparência (SIOP), autor "{s.nome.toUpperCase()}". Página 1 (até 15 emendas). Para onde foi e quem recebeu o pagamento: consulte cada emenda no Portal.</p>
                  </>
                );
              })()}
            </Panel>
            <Panel kicker="§8b" title="Vínculos a verificar (hipóteses por sobrenome)">
              {!raros.length && <p className="text-sm text-ink-3">Sobrenomes muito comuns para busca útil.</p>}
              {raros.length > 0 && (
                <>
                  <p className="text-xs text-ink-3 mb-2">Sobrenome(s) menos comum(ns): <span className="font-mono">{raros.join(", ")}</span>. Sobrenome igual não prova parentesco.</p>
                  <ul className="text-sm space-y-1.5">{pistas.map((v, i) => <li key={i}>→ {v.url ? <a className="underline" href={v.url} target={v.url.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer">{v.descricao}</a> : v.descricao}</li>)}</ul>
                  <p className="mt-2 text-[0.68rem] text-ink-3">Secretários parlamentares do gabinete: <a className="underline" href={`https://www.camara.leg.br/deputados/${d.id}/pessoal-gabinete`} target="_blank" rel="noopener noreferrer">lista oficial ↗</a>. Confirmação só com fonte primária, num caso.</p>
                </>
              )}
            </Panel>
            <Panel kicker="§9" title="Na mídia (manchetes recentes)">
              <NoticiasList noticias={noticias} query={s.nome} />
            </Panel>

            <Panel kicker="§9b" title="Checagens de fatos">
              <Checagens dados={checagens} nome={s.nome} />
            </Panel>

            <Panel kicker="§10" title="Contribua com esta ficha">
              <ul className="text-sm space-y-2 text-ink-2">
                <li>→ <a className="underline" href={`https://github.com/steinhauserhzs/monitor-de-gravata/issues/new?template=caso.yml&title=${encodeURIComponent(`[caso] ${s.nome} (${s.siglaPartido}-${s.siglaUf})`)}`} target="_blank" rel="noopener noreferrer">Abrir um caso com fontes</a> sobre este parlamentar</li>
                <li>→ Marcar uma <em>votação-chave</em> (com link da votação e por que importa)</li>
                <li>→ Corrigir/complementar a linha do tempo no <a className="underline" href={wdHit ? `https://www.wikidata.org/wiki/${wdHit.id}` : "https://www.wikidata.org"} target="_blank" rel="noopener noreferrer">Wikidata</a> (fonte aberta que esta página lê)</li>
                <li>→ Se você é o(a) parlamentar ou assessoria: <Link className="underline" href="/sobre#resposta">direito de resposta</Link></li>
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
