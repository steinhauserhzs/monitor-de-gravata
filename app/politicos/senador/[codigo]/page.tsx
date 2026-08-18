import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumbs, Notice, Source } from "@/components/ui";
import { KPI, Bars, Flags, Timeline, NoticiasList, Panel, type TLItem } from "@/components/ficha";
import { getSenador, getMandatos, getComissoes, getAutorias, getVotacoes, getFiliacoes, getRecursosUtilizados, getCEAPS, SENADO, SENADO_ADM } from "@/lib/senado";
import { analisarCEAP, type Despesa } from "@/lib/camara";
import { runRules } from "@/lib/rules";
import { onlyDigits } from "@/lib/format";
import { safe } from "@/lib/fetcher";
import { brl, dateBR, nowBR, pct } from "@/lib/format";
import { noticiasGoogle } from "@/lib/noticias";
import { wdBuscar, wdTimeline } from "@/lib/wikidata";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Any = Record<string, unknown>;
const g = (o: unknown, path: string): unknown => path.split(".").reduce<unknown>((a, k) => (a && typeof a === "object" ? (a as Any)[k] : undefined), o);
const arr = <T,>(x: unknown): T[] => (x == null ? [] : Array.isArray(x) ? (x as T[]) : [x as T]);

export async function generateMetadata({ params }: PageProps<"/politicos/senador/[codigo]">) {
  const { codigo } = await params;
  const s = await safe(getSenador(codigo));
  return { title: s.data ? `${s.data.IdentificacaoParlamentar.NomeParlamentar} — Ficha 360` : "Senador" };
}

export default async function FichaSenador({ params }: PageProps<"/politicos/senador/[codigo]">) {
  const { codigo } = await params;
  const sen = await safe(getSenador(codigo));
  if (!sen.data) notFound();
  const idp = sen.data.IdentificacaoParlamentar;
  const basicos = sen.data.DadosBasicosParlamentar;

  const anoAtual = new Date().getFullYear();
  const [mandatos, comissoes, autorias, votacoes, filiacoes, noticias, wd, recursos, ceaps] = await Promise.all([
    safe(getMandatos(codigo)),
    safe(getComissoes(codigo)),
    safe(getAutorias(codigo)),
    safe(getVotacoes(codigo)),
    safe(getFiliacoes(codigo)),
    noticiasGoogle(`"${idp.NomeParlamentar}" senador`),
    safe(wdBuscar(idp.NomeCompletoParlamentar)),
    safe(getRecursosUtilizados(codigo)),
    safe(getCEAPS(codigo, anoAtual)),
  ]);

  /* CEAPS → mesma análise da CEAP */
  const despesasCEAPS: Despesa[] = (ceaps.data ?? []).map((d) => ({
    ano: d.ano, mes: d.mes, tipoDespesa: d.tipoDespesa.split(",")[0].split(".")[0].trim(), codDocumento: d.id, tipoDocumento: d.tipoDocumento,
    dataDocumento: d.data, numDocumento: d.documento, valorDocumento: d.valorReembolsado, urlDocumento: null, nomeFornecedor: d.fornecedor,
    cnpjCpfFornecedor: onlyDigits(d.cpfCnpj), valorLiquido: d.valorReembolsado, valorGlosa: 0, numRessarcimento: "", codLote: 0, parcela: 0,
  }));
  const analise = analisarCEAP(despesasCEAPS);
  const findings = runRules("cota", { analise, ano: anoAtual, casa: "senado", mediaBancada: null });

  /* votações: distribuição */
  const votos = votacoes.data ?? [];
  const dist = new Map<string, number>();
  for (const v of votos) {
    const k = String(g(v, "SiglaDescricaoVoto") ?? "?");
    dist.set(k, (dist.get(k) ?? 0) + 1);
  }
  const registrou = votos.filter((v) => /^(Sim|Não|Votou|Abst)/i.test(String(g(v, "SiglaDescricaoVoto") ?? ""))).length;
  const missao = dist.get("Missão da Casa no País/exterior") ?? 0;
  const presenteSemVoto = [...dist.entries()].filter(([k]) => /Presente/i.test(k)).reduce((a, [, v]) => a + v, 0);
  const votosAno = votos.filter((v) => String(g(v, "SessaoPlenaria.DataSessao") ?? "").startsWith(String(anoAtual)));

  /* autorias por tipo */
  const aut = autorias.data ?? [];
  const porTipo = new Map<string, number>();
  for (const a of aut) {
    const sig = String(g(a, "Materia.Sigla") ?? "?");
    porTipo.set(sig, (porTipo.get(sig) ?? 0) + 1);
  }
  const principais = aut.filter((a) => g(a, "IndicadorAutorPrincipal") === "Sim");

  /* linha do tempo */
  const tl: TLItem[] = [];
  for (const m of mandatos.data ?? []) {
    const l1 = g(m, "PrimeiraLegislaturaDoMandato") as Any | undefined;
    const l2 = g(m, "SegundaLegislaturaDoMandato") as Any | undefined;
    tl.push({ data: String(l1?.DataInicio ?? ""), fim: String(l2?.DataFim ?? l1?.DataFim ?? ""), tipo: "mandato", titulo: `Senador(a) · ${g(m, "UfParlamentar")} · ${g(m, "DescricaoParticipacao")}`, detalhe: `Legislaturas ${l1?.NumeroLegislatura ?? ""}${l2 ? `–${l2.NumeroLegislatura}` : ""}`, fonte: "Senado (mandatos)", url: `${SENADO}/senador/${codigo}/mandatos` });
    for (const ex of arr<Any>(g(m, "Exercicios.Exercicio"))) {
      if (ex.DescricaoCausaAfastamento) tl.push({ data: String(ex.DataInicio ?? ""), fim: ex.DataFim ? String(ex.DataFim) : undefined, tipo: "afastamento", titulo: String(ex.DescricaoCausaAfastamento), fonte: "Senado (exercícios)" });
    }
  }
  for (const f of filiacoes.data ?? []) tl.push({ data: String(g(f, "DataFiliacao") ?? ""), fim: g(f, "DataDesfiliacao") ? String(g(f, "DataDesfiliacao")) : undefined, tipo: "partido", titulo: `Filiação · ${g(f, "Partido.SiglaPartido")}`, fonte: "Senado (filiações)", url: `${SENADO}/senador/${codigo}/filiacoes` });
  const wdHit = wd.data?.[0];
  const wdTl = wdHit ? await safe(wdTimeline(wdHit.id)) : { data: null, error: null };
  for (const e of wdTl.data ?? []) tl.push({ data: e.inicio, fim: e.fim, tipo: e.tipo, titulo: e.titulo, detalhe: e.detalhe, fonte: e.fonte, url: e.url });
  tl.sort((a, b) => (a.data ?? "0").localeCompare(b.data ?? "0"));

  const comAtuais = (comissoes.data ?? []).filter((c) => !g(c, "DataFim"));
  const coletado = nowBR();

  return (
    <>
      <Crumbs items={[{ href: "/politicos", label: "Políticos" }, { label: idp.NomeParlamentar }]} />
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-8 border-b-2 border-ink">
        <div className="flex flex-col gap-6 md:flex-row md:items-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={idp.UrlFotoParlamentar} alt={`Foto oficial de ${idp.NomeParlamentar}`} className="h-44 w-36 object-cover grayscale contrast-125 border-2 border-ink" />
          <div className="flex-1">
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-3">Senador(a) · {idp.SiglaPartidoParlamentar}-{idp.UfParlamentar} · código {idp.CodigoParlamentar}</div>
            <h1 className="font-display text-4xl md:text-6xl leading-[0.95] mt-1 rise">{idp.NomeParlamentar}</h1>
            <div className="mt-2 text-sm text-ink-2">{idp.NomeCompletoParlamentar} · nascido(a) em {dateBR(basicos?.DataNascimento)} {basicos?.Naturalidade ? `em ${basicos.Naturalidade}/${basicos.UfNaturalidade}` : ""}</div>
            <div className="mt-3 flex flex-wrap gap-3 font-mono text-[0.62rem] uppercase tracking-[0.12em]">
              <a className="underline underline-offset-2" href={idp.UrlPaginaParlamentar} target="_blank" rel="noopener noreferrer">página oficial ↗</a>
              <a className="underline underline-offset-2" href={`${SENADO}/senador/${codigo}`} target="_blank" rel="noopener noreferrer">json da API ↗</a>
              <a className="underline underline-offset-2" href={`https://www6g.senado.leg.br/transparencia/sen/${codigo}/?ano=${anoAtual}`} target="_blank" rel="noopener noreferrer">transparência (CEAPS, gabinete) ↗</a>
              {wdHit && <a className="underline underline-offset-2" href={`https://www.wikidata.org/wiki/${wdHit.id}`} target="_blank" rel="noopener noreferrer">wikidata ↗</a>}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="grid gap-3 grid-cols-2 md:grid-cols-6">
          <KPI label={`Cota (CEAPS) ${anoAtual}`} value={recursos.data?.cotas?.totalValor ? brl(recursos.data.cotas.totalValor) : analise.total ? brl(analise.total) : "—"} hint={`${analise.qtd} notas · ${analise.porFornecedor.length} fornecedores${recursos.data?.gastosNaoInclusos ? ` · +${brl(recursos.data.gastosNaoInclusos.totalValor)} fora da cota` : ""}`} tone={findings.some((f) => f.severidade === "alta") ? "stamp" : undefined} />
          <KPI label="Votações registradas" value={votos.length} hint={`${votosAno.length} em ${anoAtual} · desde o início do mandato`} />
          <KPI label="Registrou voto" value={votos.length ? pct(registrou / votos.length) : "—"} hint={`${registrou} de ${votos.length} (Sim/Não/secreta)`} />
          <KPI label="Presente sem votar" value={presenteSemVoto} hint="conta como presença, não como voto" />
          <KPI label="Missão oficial" value={missao} hint="ausências justificadas pela Casa" />
          <KPI label="Matérias de autoria" value={aut.length} hint={`${principais.length} como autor principal`} />
        </div>

        <Notice tone="info" title="Como ler esta ficha">
          Dados oficiais do Senado (dados abertos), Wikidata e Google Notícias, coletados em {coletado}. Gastos da cota (CEAPS), verba de gabinete e servidores ficam no Portal da Transparência do Senado (link acima) — integração via CSV anual está no roadmap. Nada aqui é acusação.
        </Notice>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-6">
            <Panel kicker="§1" title="Como votou (últimas 25 votações do Plenário)" right={<Source url={`${SENADO}/senador/${codigo}/votacoes`} label="Senado" />}>
              {votacoes.error && <Notice tone="warn">Votações indisponíveis: {votacoes.error}</Notice>}
              <div className="flex flex-wrap gap-2 mb-3">
                {[...dist.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <span key={k} className="tab">{k} · {v}</span>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Sessão</th><th>Matéria</th><th>Voto</th><th>Resultado</th></tr></thead>
                  <tbody>
                    {[...votos].reverse().slice(0, 25).map((v, i) => (
                      <tr key={i}>
                        <td className="font-mono text-xs whitespace-nowrap">{dateBR(String(g(v, "SessaoPlenaria.DataSessao") ?? ""))}</td>
                        <td className="text-xs max-w-md"><span className="font-mono">{String(g(v, "Materia.DescricaoIdentificacao") ?? "")}</span> — {String(g(v, "Materia.Ementa") ?? "").slice(0, 150)}</td>
                        <td className="font-mono text-xs font-bold">{String(g(v, "SiglaDescricaoVoto") ?? "—")}</td>
                        <td className="text-xs">{String(g(v, "DescricaoResultado") ?? "—")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel kicker="§2" title="Produtividade — matérias de autoria" right={<Source url={`${SENADO}/senador/${codigo}/autorias`} label="Senado" />}>
              <div className="flex flex-wrap gap-2 mb-3">
                {[...porTipo.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <span key={k} className="tab">{k} · {v}</span>
                ))}
              </div>
              <ul className="space-y-1.5">
                {[...aut].reverse().slice(0, 15).map((a, i) => (
                  <li key={i} className="text-sm">
                    <a href={`https://www25.senado.leg.br/web/atividade/materias/-/materia/${g(a, "Materia.Codigo")}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs underline underline-offset-2">{String(g(a, "Materia.DescricaoIdentificacao"))}</a>{" "}
                    <span className="text-ink-2">{String(g(a, "Materia.Ementa") ?? "").slice(0, 160)}</span>
                    {g(a, "IndicadorAutorPrincipal") === "Sim" && <span className="ml-2 font-mono text-[0.58rem] uppercase text-verde">autor principal</span>}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[0.68rem] text-ink-3">RQS = requerimentos. "Transformadas em norma" exige cruzar com /materia/{"{codigo}"} — no roadmap (job em lote).</p>
            </Panel>
          </div>
          <div className="space-y-6">
            <Panel kicker="§3" title="Linha do tempo política">
              <Timeline items={tl} />
            </Panel>
            <Panel kicker="§4" title="Comissões atuais" right={<Source url={`${SENADO}/senador/${codigo}/comissoes`} label="Senado" />}>
              <ul className="space-y-1.5 text-sm">
                {comAtuais.slice(0, 20).map((c, i) => (
                  <li key={i}><span className="font-mono text-xs">{String(g(c, "IdentificacaoComissao.SiglaComissao"))}</span> {String(g(c, "IdentificacaoComissao.NomeComissao"))} <span className="text-ink-3">· {String(g(c, "DescricaoParticipacao"))} desde {dateBR(String(g(c, "DataInicio") ?? ""))}</span></li>
                ))}
                {!comAtuais.length && <li className="text-ink-3">Sem registro.</li>}
              </ul>
            </Panel>
            <Panel kicker="§5" title={`Cota parlamentar (CEAPS) ${anoAtual}`} right={<Source url={`${SENADO_ADM}/senadores/${codigo}/recursos-utilizados`} label="Senado (dados abertos adm.)" />}>
              {recursos.error && ceaps.error && <Notice tone="warn">Dados da cota indisponíveis: {recursos.error}</Notice>}
              {recursos.data?.cotas && (
                <div className="mb-4">
                  <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-2">Por rubrica (total {brl(recursos.data.cotas.totalValor)})</div>
                  <Bars rows={recursos.data.cotas.despesas.filter((d) => d.valor > 0).sort((a, b) => b.valor - a.valor).map((d) => ({ label: d.recurso, value: d.valor }))} />
                  {recursos.data.gastosNaoInclusos && recursos.data.gastosNaoInclusos.totalValor > 0 && (
                    <details className="mt-3"><summary className="cursor-pointer font-mono text-[0.65rem] uppercase tracking-[0.16em]">Gastos fora da cota: {brl(recursos.data.gastosNaoInclusos.totalValor)}</summary>
                      <div className="mt-2"><Bars rows={recursos.data.gastosNaoInclusos.despesas.filter((d) => d.valor > 0).sort((a, b) => b.valor - a.valor).map((d) => ({ label: d.recurso, value: d.valor }))} /></div></details>
                  )}
                </div>
              )}
              {analise.qtd > 0 && (
                <>
                  <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-2">Top fornecedores (notas reembolsadas)</div>
                  <Bars rows={analise.porFornecedor.slice(0, 8).map((f) => ({ label: f.fornecedor, sub: `${pct(f.share)} · ${f.qtd}`, value: f.total, href: f.cnpj?.length === 14 ? `/empresas/${f.cnpj}` : undefined }))} />
                  <details className="mt-3"><summary className="cursor-pointer font-mono text-[0.65rem] uppercase tracking-[0.16em]">Ver as {Math.min(40, analise.qtd)} maiores notas</summary>
                    <div className="overflow-x-auto mt-2"><table className="table"><thead><tr><th>Data</th><th>Tipo</th><th>Fornecedor</th><th>CNPJ/CPF</th><th className="text-right">Valor</th></tr></thead><tbody>
                      {[...despesasCEAPS].sort((a, b) => b.valorLiquido - a.valorLiquido).slice(0, 40).map((x) => <tr key={x.codDocumento}><td className="font-mono text-xs whitespace-nowrap">{dateBR(x.dataDocumento)}</td><td className="text-xs">{x.tipoDespesa}</td><td className="text-xs">{x.nomeFornecedor}</td><td className="font-mono text-xs">{x.cnpjCpfFornecedor?.length === 14 ? <Link href={`/empresas/${x.cnpjCpfFornecedor}`} className="underline">{x.cnpjCpfFornecedor}</Link> : x.cnpjCpfFornecedor}</td><td className="text-right font-mono text-xs">{brl(x.valorLiquido)}</td></tr>)}
                    </tbody></table></div></details>
                </>
              )}
              <div className="mt-4"><div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-2">Red flags automáticas (cota)</div><Flags findings={findings} /></div>
              <p className="mt-3 text-[0.68rem] text-ink-3">Fonte: Senado Federal — dados abertos administrativos (JSON, sem chave), notas de {anoAtual}. Gabinete/servidores: <a className="underline" href={`https://www6g.senado.leg.br/transparencia/sen/${codigo}/?ano=${anoAtual}`} target="_blank" rel="noopener noreferrer">transparência do senador ↗</a>.</p>
            </Panel>
            <Panel kicker="§6" title="Na mídia (manchetes recentes)">
              <NoticiasList noticias={noticias} query={idp.NomeParlamentar} />
            </Panel>
            <Panel kicker="§7" title="Contribua com esta ficha">
              <ul className="text-sm space-y-2 text-ink-2">
                <li>→ <a className="underline" href={`https://github.com/steinhauserhzs/monitor-de-gravata/issues/new?template=caso.yml&title=${encodeURIComponent(`[caso] Sen. ${idp.NomeParlamentar} (${idp.SiglaPartidoParlamentar}-${idp.UfParlamentar})`)}`} target="_blank" rel="noopener noreferrer">Abrir um caso com fontes</a></li>
                <li>→ Ajudar a ingerir a CEAPS (issue "ingestão CEAPS" no repositório)</li>
                <li>→ <Link className="underline" href="/sobre#resposta">Direito de resposta</Link></li>
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
