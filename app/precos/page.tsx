import Link from "next/link";
import { PageHead, Section, Notice, Empty, Sev } from "@/components/ui";
import { KPI } from "@/components/ficha";
import { buscarPDM, precosAmostra, estatisticas, classificar, loadPDMs, COMPRAS, linkCompraGov, termoObjeto, idCompraDe } from "@/lib/precos";
import { safe } from "@/lib/fetcher";
import { brl, dateBR, nowBR } from "@/lib/format";
import { UFS } from "@/lib/tse";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const metadata = { title: "Comparador de preços públicos" };

export default async function Precos({ searchParams }: PageProps<"/precos">) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q ?? "").trim();
  const pdm = Number(Array.isArray(sp.pdm) ? sp.pdm[0] : sp.pdm) || 0;
  const uf = (Array.isArray(sp.uf) ? sp.uf[0] : sp.uf ?? "").toUpperCase();
  const preco = Number(String(Array.isArray(sp.preco) ? sp.preco[0] : sp.preco ?? "").replace(/\./g, "").replace(",", ".")) || 0;
  const desde = (Array.isArray(sp.desde) ? sp.desde[0] : sp.desde) || `${new Date().getFullYear() - 1}-01-01`;

  const total = loadPDMs().length;
  const candidatos = q && !pdm ? buscarPDM(q) : [];
  const pdmSel = pdm ? loadPDMs().find((p) => p.c === pdm) : candidatos.length === 1 ? candidatos[0] : null;
  const precos = pdmSel ? await safe(precosAmostra(pdmSel.c, { uf: uf || undefined, desde, paginas: 3 })) : { data: null, error: null };
  const lista = precos.data?.resultado ?? [];
  const est = estatisticas(lista.map((p) => p.precoUnitario));
  const cls = preco && est ? classificar(preco, est) : null;

  return (
    <>
      <PageHead
        kicker="Módulo 07"
        title="Comparador de preços"
        stamp="Compras.gov ao vivo"
        stampTone="verde"
        lead={`"Esse notebook de R$ 10 mil custa R$ 4 mil em outros órgãos?" — busque o item no catálogo oficial (${total.toLocaleString("pt-BR")} padrões de material CATMAT) e veja os preços realmente pagos por outros órgãos públicos, com fornecedor, marca, UF e data. Digite o preço que você viu e receba a classificação.`}
        right={
          <form className="card p-4 grid gap-2 sm:grid-cols-2 min-w-[22rem]">
            <label className="block sm:col-span-2"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Item (ex.: notebook, ar condicionado, merenda, asfalto)</span><input name="q" defaultValue={q} className="input" placeholder="notebook" /></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Preço unitário visto (R$)</span><input name="preco" defaultValue={preco || ""} className="input" placeholder="10000" /></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">UF (opcional)</span><select name="uf" defaultValue={uf} className="input"><option value="">Todas</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Compras desde</span><input name="desde" type="date" defaultValue={desde} className="input" /></label>
            {pdmSel && <input type="hidden" name="pdm" value={pdmSel.c} />}
            <button className="btn sm:col-span-2" type="submit">Comparar</button>
          </form>
        }
      />

      {q && !pdmSel && (
        <Section kicker="Passo 1" title={`Qual destes é o item? (${candidatos.length} padrões encontrados)`}>
          {!candidatos.length && <Empty>Nenhum padrão CATMAT com todas essas palavras. Tente termos mais genéricos ("computador portátil", "condicionador ar", "veículo").</Empty>}
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {candidatos.map((p) => (
              <Link key={p.c} href={`/precos?q=${encodeURIComponent(q)}&pdm=${p.c}&uf=${uf}&preco=${preco || ""}&desde=${desde}`} className="card p-3 hover:-translate-y-0.5 transition-transform">
                <div className="font-semibold text-sm">{p.n}</div>
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">PDM {p.c} · {p.kn}</div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {pdmSel && (
        <>
          <Section kicker="Passo 2" title={`${pdmSel.n} — preços praticados${uf ? ` em ${uf}` : " no Brasil"} desde ${dateBR(desde)}`}>
            {precos.error && <Notice tone="warn" title="Compras.gov.br">API não respondeu: {precos.error}</Notice>}
            {precos.data && !lista.length && <Empty>Nenhuma compra homologada registrada para este padrão no período/UF. Amplie a data ou tire o filtro de UF.</Empty>}
            {est && (
              <>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-6">
                  <KPI label="Compras analisadas" value={est.n} hint={`amostra de ${precos.data?.totalRegistros?.toLocaleString("pt-BR") ?? est.n} registradas (${precos.data?.paginasLidas ?? 1} pág.)`} />
                  <KPI label="Mediana" value={brl(est.mediana)} hint="metade pagou menos que isso" />
                  <KPI label="Faixa típica (Q1–Q3)" value={<span className="text-xl">{brl(est.q1)} – {brl(est.q3)}</span>} />
                  <KPI label="Mínimo" value={brl(est.min)} />
                  <KPI label="Máximo" value={brl(est.max)} />
                  <KPI label="Média" value={brl(est.media)} />
                </div>
                {cls && (
                  <div className={`card mt-4 p-5 border-l-4 ${cls.nivel === "muito-alto" || cls.nivel === "alto" ? "border-stamp" : cls.nivel === "atencao" ? "border-marker" : "border-verde"}`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <Sev level={cls.nivel === "muito-alto" || cls.nivel === "alto" ? "alta" : cls.nivel === "atencao" ? "media" : "ok"}>{cls.nivel.replace("-", " ")}</Sev>
                      <div className="font-display text-2xl">{brl(preco)} é {cls.razao.toFixed(2)}× a mediana</div>
                    </div>
                    <p className="mt-2 text-sm text-ink-2">
                      {cls.nivel === "normal" && "Dentro da faixa do que outros órgãos pagam por este padrão. Ainda assim, compare a especificação — o mesmo PDM abriga configurações diferentes."}
                      {cls.nivel === "abaixo" && "Abaixo do que a maioria paga. Bom sinal de economia — ou item de especificação inferior/quantidade grande."}
                      {cls.nivel === "atencao" && "Acima da faixa típica. Vale ler a especificação, a marca e a quantidade antes de concluir."}
                      {(cls.nivel === "alto" || cls.nivel === "muito-alto") && "Muito acima do praticado. Sinal objetivo de possível sobrepreço — confirme especificação, marca e se houve disputa (nº de propostas). Isso é uma pergunta, não uma sentença."}
                    </p>
                    <p className="mt-2 text-[0.68rem] text-ink-3">Regra: <Link href="/radar#sobrepreco-vs-painel-de-precos" className="underline">sobrepreco-vs-painel-de-precos</Link> — razão vs mediana dos preços homologados no período (Compras.gov.br). Limiares: ≤1,3 normal · ≤1,7 atenção · ≤2,5 alto · &gt;2,5 muito alto.</p>
                  </div>
                )}
                <div className="overflow-x-auto card mt-4">
                  <table className="table">
                    <thead><tr><th>Data</th><th>Órgão</th><th>UF</th><th>Item (como descrito)</th><th>Marca</th><th>Fornecedor</th><th className="text-right">Qtd</th><th className="text-right">Unitário</th><th>Compra</th></tr></thead>
                    <tbody>
                      {[...lista].sort((a, b) => b.precoUnitario - a.precoUnitario).slice(0, 60).map((p, i) => {
                        const razao = est ? p.precoUnitario / est.mediana : 1;
                        const extremo = razao >= 10;
                        return (
                          <tr key={i} className={extremo ? "bg-marker/15" : undefined}>
                            <td className="font-mono text-xs whitespace-nowrap">{dateBR(p.dataResultado || p.dataCompra)}</td>
                            <td className="text-xs">{p.nomeOrgao}</td>
                            <td className="font-mono text-xs">{p.estado}</td>
                            <td className="text-xs max-w-md">
                              {p.descricaoItem?.slice(0, 140)}
                              {p.objetoCompra && (
                                <details className="mt-1">
                                  <summary className="cursor-pointer font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-3">objeto da licitação</summary>
                                  <p className="mt-1 text-[0.72rem] text-ink-2">{p.objetoCompra.replace(/^Objeto:\s*/i, "")}</p>
                                </details>
                              )}
                            </td>
                            <td className="text-xs">{p.marca ?? "—"}</td>
                            <td className="text-xs">{p.nomeFornecedor}<div><Link href={`/empresas/${p.niFornecedor}`} className="font-mono text-[0.6rem] underline">{p.niFornecedor}</Link></div></td>
                            <td className="text-right font-mono text-xs">{p.quantidade}</td>
                            <td className="text-right font-mono text-xs font-bold">
                              {brl(p.precoUnitario)}
                              {extremo && <div className="font-mono text-[0.55rem] uppercase text-stamp">{razao.toFixed(0)}× a mediana</div>}
                            </td>
                            <td className="text-xs whitespace-nowrap">
                              <Link href={`/precos/compra/${idCompraDe(p)}?pdm=${pdmSel.c}&item=${p.numeroItemCompra}`} className="underline decoration-stamp underline-offset-2">abrir →</Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {lista.some((p) => est && p.precoUnitario / est.mediana >= 10) && (
                  <Notice tone="warn" title="Valores extremos na tabela">
                    Linhas destacadas estão 10× ou mais acima da mediana. Isso pode ser <strong>sobrepreço</strong>, unidade de fornecimento diferente (caixa vs. unidade) ou <strong>erro de digitação do próprio órgão</strong> ao publicar. Clique em "abrir" para ver a licitação e conferir antes de qualquer conclusão.
                  </Notice>
                )}
                <div className="mt-2 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">fonte: <a className="underline" href={`${COMPRAS}/modulo-pesquisa-preco/1_consultarMaterial?tipo=codigoPdm&codigo=${pdmSel.c}&pagina=1&tamanhoPagina=50`} target="_blank" rel="noopener noreferrer">Compras.gov.br dados abertos</a> · coletado {nowBR()}</div>
              </>
            )}
          </Section>
          <Section>
            <div className="grid gap-4 md:grid-cols-3">
              <Notice tone="warn" title="Cuidados">O mesmo PDM cobre especificações diferentes (um notebook básico e um de 32 GB são "NOTEBOOK"). Compare a descrição. Quantidade grande baixa o unitário. Preço não é fraude: sobrepreço vira irregularidade só com edital, proposta e ausência de justificativa.</Notice>
              <Notice tone="info" title="Cobertura">Compras homologadas por órgãos que usam o Compras.gov.br/PNCP (União, muitos estados e municípios). Estados/municípios com sistema próprio podem não aparecer — o comparador melhora com mais integrações (TCEs, Banco de Preços em Saúde).</Notice>
              <Notice tone="ok" title="Próximo passo">Achou item muito acima? <Link href="/contratos" className="underline">Localize o contrato no Radar</Link>, abra a ficha do fornecedor e <a className="underline" href="https://github.com/steinhauserhzs/monitor-de-gravata/issues/new?template=caso.yml" target="_blank" rel="noopener noreferrer">documente um caso</a> com o print desta comparação.</Notice>
            </div>
          </Section>
        </>
      )}
      {!q && (
        <Section>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {[["notebook", 8435], ["computador", 17186], ["condicionador ar", 0], ["veículo", 0], ["papel a4", 0], ["merenda", 0], ["medicamento dipirona", 0], ["cimento", 0]].map(([t, c]) => (
              <Link key={String(t)} href={`/precos?q=${encodeURIComponent(String(t))}${c ? `&pdm=${c}` : ""}`} className="btn btn--ghost justify-center">{String(t)}</Link>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
