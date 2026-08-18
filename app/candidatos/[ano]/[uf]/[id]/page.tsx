import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumbs, Notice, Source } from "@/components/ui";
import { KPI, Bars, Flags, NoticiasList, Panel, Timeline, type TLItem } from "@/components/ficha";
import { getCandidato, getPrestacao, listCandidatos, ELEICOES, CARGOS, DIVULGA, fotoCandidato } from "@/lib/tse";
import { safe } from "@/lib/fetcher";
import { runRules } from "@/lib/rules";
import { brl, dateBR, nowBR, pct } from "@/lib/format";
import { noticiasGoogle } from "@/lib/noticias";
import { wdBuscar, wdTimeline } from "@/lib/wikidata";
import { pistasDeVinculo, sobrenomesRaros, servidoresPorSobrenome } from "@/lib/vinculos";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function generateMetadata({ params }: PageProps<"/candidatos/[ano]/[uf]/[id]">) {
  const { ano, uf, id } = await params;
  const c = await safe(getCandidato(Number(ano), uf, id));
  return { title: c.data ? `${c.data.nomeUrna} — candidato ${ano}` : "Candidato" };
}

const norm = (s: string) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export default async function FichaCandidato({ params }: PageProps<"/candidatos/[ano]/[uf]/[id]">) {
  const { ano: anoS, uf, id } = await params;
  const ano = Number(anoS);
  const el = ELEICOES[ano];
  if (!el) notFound();
  const c = await safe(getCandidato(ano, uf, id));
  if (!c.data) notFound();
  const cand = c.data;
  const cargo = cand.cargo?.codigo;

  const [prest, noticias, wd] = await Promise.all([
    cargo && cand.partido?.numero && cand.numero ? safe(getPrestacao(ano, uf, cargo, cand.partido.numero, cand.numero, cand.id)) : Promise.resolve({ data: null, error: "sem dados de partido/número" }),
    noticiasGoogle(`"${cand.nomeUrna}" candidato ${uf}`),
    safe(wdBuscar(cand.nomeCompleto)),
  ]);

  /* eleições anteriores — mesmo nome completo, mesma UF, mesmo cargo (e cargos federais correlatos) */
  const anteriores: { ano: number; totalDeBens: number; id: number; situacao: string; totalizacao?: string | null; cargo: string; url: string }[] = [];
  const anosAnt = Object.keys(ELEICOES).map(Number).filter((a) => a < ano && ELEICOES[a].abrangencia === el.abrangencia).sort((a, b) => b - a).slice(0, 2);
  const cargosBusca = el.abrangencia === "F" ? [cargo, 6, 7, 5, 3].filter((x, i, a) => x && a.indexOf(x) === i) : [cargo];
  await Promise.all(
    anosAnt.flatMap((a) =>
      cargosBusca.slice(0, 3).map(async (cg) => {
        const l = await safe(listCandidatos(a, cargo === 1 ? "BR" : uf, cg!));
        const hit = (l.data ?? []).find((x) => norm(x.nomeCompleto) === norm(cand.nomeCompleto));
        if (hit) {
          const det = await safe(getCandidato(a, cargo === 1 ? "BR" : uf, hit.id));
          if (det.data) anteriores.push({ ano: a, totalDeBens: det.data.totalDeBens ?? 0, id: hit.id, situacao: det.data.descricaoSituacao, totalizacao: det.data.descricaoTotalizacao, cargo: CARGOS[cg!] ?? String(cg), url: `/candidatos/${a}/${cargo === 1 ? "BR" : uf}/${hit.id}` });
        }
      }),
    ),
  );
  anteriores.sort((a, b) => a.ano - b.ano);

  /* vínculos por sobrenome — HIPÓTESES */
  const raros = sobrenomesRaros(cand.nomeCompleto);
  const cargosUF = el.abrangencia === "F" ? [3, 5, 6, 7, 8] : [11, 13];
  const mesmoSobrenome: { nomeUrna: string; nomeCompleto: string; cargo: string; partido: string; id: number; situacao: string }[] = [];
  if (raros.length && cargo !== 1) {
    await Promise.all(
      cargosUF.map(async (cg) => {
        const l = await safe(listCandidatos(ano, uf, cg));
        for (const x of l.data ?? []) {
          if (x.id === cand.id) continue;
          const nx = norm(x.nomeCompleto).toUpperCase();
          if (raros.some((r) => nx.split(/\s+/).includes(r))) mesmoSobrenome.push({ nomeUrna: x.nomeUrna, nomeCompleto: x.nomeCompleto, cargo: CARGOS[cg] ?? String(cg), partido: x.partido?.sigla ?? "", id: x.id, situacao: x.descricaoSituacao });
        }
      }),
    );
  }
  const servidores = raros[0] ? await servidoresPorSobrenome(raros[0]) : null;
  const pistas = pistasDeVinculo(cand.nomeCompleto, uf);

  const findings = runRules("candidato", { candidato: cand, prestacao: prest.data, anteriores });
  const bens = [...(cand.bens ?? [])].sort((a, b) => b.valor - a.valor);
  const porTipoBem = new Map<string, number>();
  for (const b of bens) porTipoBem.set(b.descricaoDeTipoDeBem, (porTipoBem.get(b.descricaoDeTipoDeBem) ?? 0) + b.valor);
  const dc = prest.data?.dadosConsolidados;

  const tl: TLItem[] = anteriores.map((a) => ({ data: String(a.ano), tipo: "candidatura", titulo: `${a.cargo} · ${a.situacao}${a.totalizacao ? ` · ${a.totalizacao}` : ""}`, detalhe: `bens declarados: ${brl(a.totalDeBens)}`, fonte: "TSE DivulgaCand", url: a.url }));
  const wdHit = wd.data?.[0];
  const wdTl = wdHit ? await safe(wdTimeline(wdHit.id)) : { data: null, error: null };
  for (const e of wdTl.data ?? []) tl.push({ data: e.inicio, fim: e.fim, tipo: e.tipo, titulo: e.titulo, detalhe: e.detalhe, fonte: e.fonte, url: e.url });
  tl.push({ data: String(ano), tipo: "candidatura", titulo: `${cand.cargo?.nome} · ${cand.descricaoSituacao}`, detalhe: `bens declarados: ${brl(cand.totalDeBens)}`, fonte: "TSE DivulgaCand", url: `https://divulgacandcontas.tse.jus.br/divulga/#/candidato/${ano}/${el.id}/${uf}/${cand.id}` });
  tl.sort((a, b) => (a.data ?? "0").localeCompare(b.data ?? "0"));

  const certidoes = (cand.arquivos ?? []).filter((a) => /certid/i.test(a.nome));
  const coletado = nowBR();
  const foto = cand.fotoUrl || fotoCandidato(el.id, cand.id, uf);

  return (
    <>
      <Crumbs items={[{ href: "/candidatos", label: "Candidatos" }, { href: `/candidatos?ano=${ano}&uf=${uf}&cargo=${cargo}`, label: `${ano} · ${uf} · ${cand.cargo?.nome}` }, { label: cand.nomeUrna }]} />
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-8 border-b-2 border-ink">
        <div className="flex flex-col gap-6 md:flex-row md:items-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={foto} alt={`Foto de urna de ${cand.nomeUrna}`} className="h-44 w-36 object-cover grayscale contrast-125 border-2 border-ink bg-paper-2" />
          <div className="flex-1">
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-3">{cand.cargo?.nome} · {uf} · {el.nome} · nº {cand.numero}</div>
            <h1 className="font-display text-4xl md:text-6xl leading-[0.95] mt-1 rise">{cand.nomeUrna}</h1>
            <div className="mt-2 text-sm text-ink-2">{cand.nomeCompleto} · {cand.partido?.sigla} ({cand.partido?.nome}) {cand.nomeColigacao && cand.nomeColigacao !== cand.partido?.sigla ? `· ${cand.nomeColigacao}` : ""}</div>
            <div className="mt-1 text-sm text-ink-2">{cand.ocupacao ?? "ocupação n/i"} · {cand.grauInstrucao ?? "instrução n/i"} · nasc. {dateBR(cand.dataDeNascimento)} {cand.nomeMunicipioNascimento ? `em ${cand.nomeMunicipioNascimento}/${cand.sgUfNascimento}` : ""}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`stamp stamp--flat ${/deferid|apto/i.test(cand.descricaoSituacao) && !/indefer/i.test(cand.descricaoSituacao) ? "stamp--verde" : /indefer|cassad|renunc/i.test(cand.descricaoSituacao) ? "" : "stamp--azul"}`}>{cand.descricaoSituacao}</span>
              {cand.descricaoTotalizacao && <span className="stamp stamp--flat stamp--ink">{cand.descricaoTotalizacao}</span>}
              {findings.some((f) => f.severidade === "alta") && <span className="stamp stamp--flat">red flag alta</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 font-mono text-[0.62rem] uppercase tracking-[0.12em]">
              <a className="underline underline-offset-2" href={`https://divulgacandcontas.tse.jus.br/divulga/#/candidato/${ano}/${el.id}/${uf}/${cand.id}`} target="_blank" rel="noopener noreferrer">DivulgaCand ↗</a>
              <a className="underline underline-offset-2" href={`${DIVULGA}/candidatura/buscar/${ano}/${uf}/${el.id}/candidato/${cand.id}`} target="_blank" rel="noopener noreferrer">json ↗</a>
              {cand.numeroProcesso && <a className="underline underline-offset-2" href={`https://consultaunificadapje.tse.jus.br/#/public/inicial/index`} target="_blank" rel="noopener noreferrer">processo {cand.numeroProcesso} (PJe) ↗</a>}
              {wdHit && <a className="underline underline-offset-2" href={`https://www.wikidata.org/wiki/${wdHit.id}`} target="_blank" rel="noopener noreferrer">wikidata ↗</a>}
              {(cand.sites ?? []).slice(0, 3).map((s) => <a key={s} className="underline underline-offset-2" href={s.startsWith("http") ? s : `https://${s}`} target="_blank" rel="noopener noreferrer nofollow">{s.replace(/^https?:\/\//, "").slice(0, 30)} ↗</a>)}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
          <KPI label={`Bens declarados ${ano}`} value={brl(cand.totalDeBens)} hint={`${bens.length} item(ns)`} />
          <KPI label="Eleição anterior" value={anteriores.length ? brl(anteriores[anteriores.length - 1].totalDeBens) : "—"} hint={anteriores.length ? `${anteriores[anteriores.length - 1].ano} · ${anteriores[anteriores.length - 1].cargo}` : "sem candidatura anterior localizada (mesmo nome/UF)"} />
          <KPI label="Variação patrimonial" value={anteriores.length && anteriores[anteriores.length - 1].totalDeBens ? `${(((cand.totalDeBens ?? 0) / anteriores[anteriores.length - 1].totalDeBens - 1) * 100).toFixed(0)}%` : "—"} tone={anteriores.length && cand.totalDeBens > 2 * anteriores[anteriores.length - 1].totalDeBens ? "stamp" : undefined} />
          <KPI label="Receitas de campanha" value={dc?.totalRecebido ? brl(dc.totalRecebido) : "—"} hint={dc ? `${pct((dc.totalPartidos ?? 0) / (dc.totalRecebido || 1))} de partido/fundo · ${pct((dc.totalReceitaPF ?? 0) / (dc.totalRecebido || 1))} de PF` : ano >= 2026 ? "contas a partir de set/2026" : "sem prestação localizada"} />
          <KPI label="Red flags" value={findings.length} tone={findings.some((f) => f.severidade === "alta") ? "stamp" : "verde"} hint={findings.length ? findings.map((f) => f.nome).slice(0, 2).join(" · ") : "nenhum sinal automático"} />
        </div>

        <Notice tone="info" title="Como ler">
          Dados do TSE (DivulgaCandContas), Wikidata e Google Notícias coletados em {coletado}. Bens são autodeclarados pelo candidato. Comparação com eleições anteriores casa por nome completo + UF (pode falhar em homônimos ou mudança de UF). Sinais são perguntas, não conclusões.
        </Notice>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-6">
            <Panel kicker="§1" title="Patrimônio declarado" right={<Source url={`${DIVULGA}/candidatura/buscar/${ano}/${uf}/${el.id}/candidato/${cand.id}`} label="TSE" />}>
              {!bens.length && <p className="text-sm text-ink-3">Nenhum bem declarado.</p>}
              {bens.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-2">Por tipo</div>
                    <Bars rows={[...porTipoBem.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k, value: v }))} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead><tr><th>Bem</th><th className="text-right">Valor</th></tr></thead>
                      <tbody>{bens.slice(0, 25).map((b) => <tr key={b.ordem}><td className="text-xs">{b.descricao}<div className="text-ink-3">{b.descricaoDeTipoDeBem}</div></td><td className="text-right font-mono text-xs whitespace-nowrap">{brl(b.valor)}</td></tr>)}</tbody>
                    </table>
                  </div>
                </div>
              )}
              {anteriores.length > 0 && (
                <div className="mt-5">
                  <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-2">Evolução declarada</div>
                  <Bars rows={[...anteriores.map((a) => ({ label: `${a.ano} · ${a.cargo}`, sub: a.situacao, value: a.totalDeBens, href: a.url })), { label: `${ano} · ${cand.cargo?.nome}`, sub: cand.descricaoSituacao, value: cand.totalDeBens }]} />
                </div>
              )}
            </Panel>

            <Panel kicker="§2" title="Red flags automáticas" right={<Link href="/radar" className="font-mono text-[0.6rem] uppercase tracking-[0.12em] underline">ver regras</Link>}>
              <Flags findings={findings} />
            </Panel>

            <Panel kicker="§3" title="Financiamento de campanha" right={prest.data ? <Source url={`${DIVULGA}/prestador/consulta/${el.id}/${ano}/${uf}/${cargo}/${cand.partido?.numero}/${cand.numero}/${cand.id}`} label="TSE" /> : undefined}>
              {!dc && <p className="text-sm text-ink-3">{ano >= 2026 ? "A prestação de contas parcial de 2026 começa a ser publicada em setembro; a final, após a eleição." : `Sem prestação de contas localizada (${prest.error ?? "vazio"}).`}</p>}
              {dc && (
                <div className="grid gap-6 md:grid-cols-2">
                  <Bars rows={[
                    { label: "Partido / fundo partidário / FEFC", value: dc.totalPartidos ?? 0 },
                    { label: "Pessoas físicas", value: dc.totalReceitaPF ?? 0 },
                    { label: "Recursos próprios", value: dc.totalProprios ?? 0 },
                    { label: "Financiamento coletivo (internet)", value: dc.totalInternet ?? 0 },
                    { label: "Outros candidatos", value: dc.totalReceitaOutCand ?? 0 },
                    { label: "Origem não identificada", value: dc.totalRoni ?? 0 },
                    { label: "Estimáveis (bens/serviços)", value: dc.totalEstimados ?? 0 },
                  ].filter((r) => r.value > 0)} />
                  <div className="text-sm space-y-1">
                    <div><span className="font-mono text-[0.6rem] uppercase text-ink-3">Total recebido</span><div className="font-display text-2xl">{brl(dc.totalRecebido)}</div></div>
                    <div><span className="font-mono text-[0.6rem] uppercase text-ink-3">Gasto declarado (1º turno)</span><div className="font-display text-2xl">{brl(cand.gastoCampanha1T)}</div></div>
                    {prest.data?.cnpj && <div className="font-mono text-xs">CNPJ de campanha: <Link className="underline" href={`/empresas/${prest.data.cnpj}`}>{prest.data.cnpj}</Link></div>}
                    <div className="text-[0.68rem] text-ink-3">Doadores e fornecedores nominais: no DivulgaCand (link acima) — a listagem detalhada via API está sendo mapeada (issue aberta).</div>
                  </div>
                </div>
              )}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel kicker="§4" title="Linha do tempo eleitoral e política">
              <Timeline items={tl} />
            </Panel>
            <Panel kicker="§5" title="Processos e certidões (registro)">
              <ul className="text-sm space-y-1.5">
                <li>Processo de registro: <span className="font-mono text-xs">{cand.numeroProcesso ?? "—"}</span></li>
                <li>Processo DRAP (partido/coligação): <span className="font-mono text-xs">{cand.numeroProcessoDrap ?? "—"}</span></li>
                <li>Prestação de contas: <span className="font-mono text-xs">{cand.numeroProcessoPrestContas ?? "—"}</span></li>
                <li>Cassação/desconstituição registradas: <strong>{(cand.processosCassacao?.length ?? 0) + (cand.processosDesconstituicao?.length ?? 0)}</strong></li>
              </ul>
              {certidoes.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer font-mono text-[0.65rem] uppercase tracking-[0.16em]">{certidoes.length} certidões anexadas ao registro</summary>
                  <ul className="mt-2 text-xs text-ink-2 space-y-1">{certidoes.map((a) => <li key={a.idArquivo}>{a.nome.replace(/^pje-[a-z0-9]+-/, "")}</li>)}</ul>
                </details>
              )}
              <p className="mt-3 text-[0.68rem] text-ink-3">Processos judiciais fora da Justiça Eleitoral (DataJud/CNJ) exigem CPF ou nome exato — integração em andamento no módulo Judiciário. Presunção de inocência sempre.</p>
            </Panel>
            <Panel kicker="§5b" title="Vínculos a verificar (hipóteses por sobrenome)">
              {!raros.length && <p className="text-sm text-ink-3">Todos os sobrenomes são muito comuns para busca útil por sobrenome.</p>}
              {raros.length > 0 && (
                <>
                  <p className="text-xs text-ink-3 mb-2">Sobrenome(s) menos comum(ns): <span className="font-mono">{raros.join(", ")}</span>. Sobrenome igual <strong>não</strong> prova parentesco — é só onde começar a olhar.</p>
                  {mesmoSobrenome.length > 0 && (
                    <div className="mb-3">
                      <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-1">Outros candidatos {ano} em {uf} com o mesmo sobrenome ({mesmoSobrenome.length})</div>
                      <ul className="text-sm space-y-1">{mesmoSobrenome.slice(0, 8).map((m) => <li key={m.id}><Link className="underline" href={`/candidatos/${ano}/${uf}/${m.id}`}>{m.nomeUrna}</Link> <span className="text-ink-3 text-xs">· {m.nomeCompleto} · {m.cargo} · {m.partido} · {m.situacao}</span></li>)}</ul>
                    </div>
                  )}
                  {servidores && <div className="mb-3 text-sm">Servidores federais com "{raros[0]}" (Portal da Transparência): <strong>{servidores.qtd}{servidores.qtd >= 15 ? "+" : ""}</strong>{servidores.nomes.length ? <span className="text-xs text-ink-3"> — ex.: {servidores.nomes.join("; ")}</span> : null}</div>}
                  <ul className="text-sm space-y-1.5">
                    {pistas.map((v, i) => <li key={i}>→ {v.url ? <a className="underline" href={v.url} target={v.url.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer">{v.descricao}</a> : v.descricao} <span className="font-mono text-[0.58rem] uppercase text-ink-3">· {v.fonte}</span></li>)}
                  </ul>
                </>
              )}
              <p className="mt-3 text-[0.68rem] text-ink-3">Parentesco confirmado só entra num <Link href="/casos" className="underline">caso</Link> com fonte primária (diário oficial de nomeação, certidão, declaração do próprio). Nepotismo: Súmula Vinculante 13.</p>
            </Panel>
            <Panel kicker="§6" title="Na mídia (manchetes recentes)">
              <NoticiasList noticias={noticias} query={cand.nomeUrna} />
            </Panel>
            <Panel kicker="§7" title="Perguntas para fazer ao candidato">
              <ul className="text-sm space-y-2 text-ink-2 list-disc pl-5">
                {findings.map((f) => <li key={f.regra}>{f.evidencia} — como o(a) candidato(a) explica?</li>)}
                {!bens.length && <li>Por que não há bens declarados? Onde mora e como se sustenta?</li>}
                {dc && (dc.totalPartidos ?? 0) / (dc.totalRecebido || 1) > 0.9 && <li>Quem no partido decidiu destinar recursos do fundo à sua campanha e com que critério?</li>}
                <li>Quais compromissos assume sobre transparência do gabinete e das emendas?</li>
              </ul>
            </Panel>
            <Panel kicker="§8" title="Contribua">
              <ul className="text-sm space-y-2 text-ink-2">
                <li>→ <a className="underline" href={`https://github.com/steinhauserhzs/monitor-de-gravata/issues/new?template=caso.yml&title=${encodeURIComponent(`[caso] ${cand.nomeUrna} (${cand.partido?.sigla}-${uf}, ${ano})`)}`} target="_blank" rel="noopener noreferrer">Abrir um caso com fontes</a></li>
                <li>→ <Link className="underline" href="/sobre#resposta">Direito de resposta</Link> (candidato/assessoria)</li>
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
