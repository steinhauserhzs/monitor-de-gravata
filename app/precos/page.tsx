import Link from "next/link";
import { PageHead, Section, Notice, Empty, Sev, AvisoFonte } from "@/components/ui";
import { KPI } from "@/components/ficha";
import { buscarCatalogo, precosAmostra, estatisticas, estatisticasPorFaixa, faixaDe, classificar, loadPDMs, loadServicos, COMPRAS, linkCompraGov, termoObjeto, idCompraDe } from "@/lib/precos";
import { Veredito, FaixasQuantidade, ComoLer } from "@/components/Veredito";
import { precoDeMercado, termoVarejo, temProvedorMercado } from "@/lib/mercado";
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

  const tipo = (Array.isArray(sp.tipo) ? sp.tipo[0] : sp.tipo ?? "material") as "material" | "servico";
  const totalMat = loadPDMs().length;
  const totalServ = loadServicos().length;
  const candidatos = q && !pdm ? buscarCatalogo(q) : [];
  const selecionado = pdm
    ? tipo === "servico"
      ? loadServicos().filter((x) => x.c === pdm).map((x) => ({ tipo: "servico" as const, codigo: x.c, nome: x.n, classe: x.kn ?? "", grupo: x.g ?? "" }))[0]
      : loadPDMs().filter((x) => x.c === pdm).map((x) => ({ tipo: "material" as const, codigo: x.c, nome: x.n, classe: x.kn, grupo: x.g }))[0]
    : candidatos.length === 1
      ? candidatos[0]
      : null;
  const pdmSel = selecionado ? { c: selecionado.codigo, n: selecionado.nome, kn: selecionado.classe } : ({ c: 0, n: "", kn: "" } as const);
  const precos = selecionado ? await safe(precosAmostra(selecionado.codigo, { uf: uf || undefined, desde, paginas: 3, tipo: selecionado.tipo })) : { data: null, error: null };
  const lista = precos.data?.resultado ?? [];
  const est = estatisticas(lista.map((p) => p.precoUnitario));
  const qtd = Number(String(Array.isArray(sp.qtd) ? sp.qtd[0] : sp.qtd ?? "").replace(/\D/g, "")) || 0;
  const faixas = estatisticasPorFaixa(lista);
  const faixaAtual = faixaDe(qtd || 1);
  const estDaFaixa = faixas.find((f) => f.faixa.id === faixaAtual.id && f.itens >= 3)?.est ?? null;
  const cls = preco && est ? classificar(preco, est) : null;
  const descricaoRef = lista[0]?.descricaoItem ?? selecionado?.nome ?? q;
  const mercado = selecionado && preco ? await precoDeMercado(termoVarejo(descricaoRef)) : null;

  return (
    <>
      <PageHead
        kicker="Módulo 07"
        title="Comparador de preços"
        stamp="Compras.gov ao vivo"
        stampTone="verde"
        lead={`"Esse notebook de R$ 10 mil custa R$ 4 mil em outros órgãos?" — busque em TODAS as compras públicas: ${totalMat.toLocaleString("pt-BR")} padrões de material (CATMAT) + ${totalServ.toLocaleString("pt-BR")} serviços (CATSER). Veja o que outros órgãos pagaram de verdade, com fornecedor, marca, UF e data, e compare com o preço que você viu.`}
        right={
          <form className="card p-4 grid gap-2 sm:grid-cols-2 w-full sm:min-w-[22rem]">
            <label className="block sm:col-span-2"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Item (ex.: notebook, ar condicionado, merenda, asfalto)</span><input name="q" defaultValue={q} className="input" placeholder="notebook" /></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Preço unitário visto (R$)</span><input name="preco" defaultValue={preco || ""} className="input" placeholder="ex.: 3500" /></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Quantidade comprada</span><input name="qtd" defaultValue={qtd || ""} className="input" placeholder="ex.: 50" inputMode="numeric" /></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">UF (opcional)</span><select name="uf" defaultValue={uf} className="input"><option value="">Todas</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Compras desde</span><input name="desde" type="date" defaultValue={desde} className="input" /></label>
            {selecionado && <><input type="hidden" name="pdm" value={selecionado.codigo} /><input type="hidden" name="tipo" value={selecionado.tipo} /></>}
            <button className="btn sm:col-span-2" type="submit">Comparar</button>
          </form>
        }
      />

      {q && !selecionado && (
        <Section kicker="Passo 1" title={`Qual destes é o item? (${candidatos.length} padrões encontrados)`}>
          {!candidatos.length && <Empty>Nenhum padrão CATMAT com todas essas palavras. Tente termos mais genéricos ("computador portátil", "condicionador ar", "veículo").</Empty>}
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {candidatos.map((p) => (
              <Link key={`${p.tipo}-${p.codigo}`} href={`/precos?q=${encodeURIComponent(q)}&pdm=${p.codigo}&tipo=${p.tipo}&uf=${uf}&preco=${preco || ""}&desde=${desde}`} className="card p-3 hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center gap-2">
                  <span className={`stamp stamp--flat ${p.tipo === "servico" ? "stamp--azul" : "stamp--ink"}`}>{p.tipo}</span>
                  <div className="font-semibold text-sm">{p.nome}</div>
                </div>
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3 mt-1">código {p.codigo} · {p.classe}</div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {selecionado && (
        <>
          <Section kicker="Passo 2" title={`${selecionado.nome} — preços praticados${uf ? ` em ${uf}` : " no Brasil"} desde ${dateBR(desde)}`}>
            {precos.error && <AvisoFonte fonte="Compras.gov.br" resultado={precos} oQue="a amostra de preços" />}
            {precos.data && !lista.length && <Empty>Nenhuma compra homologada registrada para este padrão no período/UF. Amplie a data ou tire o filtro de UF.</Empty>}
            {est && (
              <>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                  <KPI label="Preço típico (mediana)" value={brl(est.mediana)} hint="metade das compras custou menos que isso" />
                  <KPI label="Mais barato já pago" value={brl(est.min)} tone="verde" />
                  <KPI label="Mais caro já pago" value={brl(est.max)} tone="stamp" />
                  <KPI label="Compras analisadas" value={est.n} hint={`de ${precos.data?.totalRegistros?.toLocaleString("pt-BR") ?? est.n} publicadas`} />
                </div>
                {preco > 0 && est && (
                  <div className="space-y-4 mt-4">
                    <Veredito preco={preco} quantidade={qtd} faixa={faixaAtual} estFaixa={estDaFaixa} estGeral={est} nomeItem={selecionado.nome} />
                    <FaixasQuantidade faixas={faixas} faixaAtual={faixaAtual.id} />
                    {mercado?.media3 && (
                      <div className="card p-5">
                        <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-2">Referência de varejo (fora do governo)</div>
                        <div className="flex flex-wrap items-baseline gap-4">
                          <div className="font-display text-3xl">{brl(mercado.media3)}</div>
                          <div className="text-sm text-ink-2">média dos 3 menores anúncios · {preco > mercado.media3 ? `o órgão pagou ${(((preco / mercado.media3) - 1) * 100).toFixed(0)}% a mais` : "abaixo do varejo"}</div>
                        </div>
                        <ul className="mt-2 text-xs space-y-1">
                          {mercado.ofertas.slice(0, 3).map((o, i) => (
                            <li key={i}>{o.url ? <a href={o.url} target="_blank" rel="noopener noreferrer nofollow" className="underline">{o.titulo}</a> : o.titulo} <span className="font-mono">— {brl(o.preco)}</span>{o.loja && <span className="text-ink-3"> · {o.loja}</span>}</li>
                          ))}
                        </ul>
                        <p className="mt-2 text-[0.7rem] text-ink-3">Varejo não é contrato: compra pública pode incluir garantia, instalação, entrega em vários endereços e tributos. Use como pista.</p>
                      </div>
                    )}
                    <ComoLer />
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
                              <Link href={`/precos/compra/${idCompraDe(p)}?pdm=${selecionado.codigo}&tipo=${selecionado.tipo}&item=${p.numeroItemCompra}`} className="underline decoration-stamp underline-offset-2">abrir →</Link>
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
                <div className="mt-2 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">fonte: <a className="underline" href={selecionado.tipo === "servico" ? `${COMPRAS}/modulo-pesquisa-preco/3_consultarServico?codigoItemCatalogo=${selecionado.codigo}&pagina=1&tamanhoPagina=50` : `${COMPRAS}/modulo-pesquisa-preco/1_consultarMaterial?tipo=codigoPdm&codigo=${selecionado.codigo}&pagina=1&tamanhoPagina=50`} target="_blank" rel="noopener noreferrer">Compras.gov.br dados abertos</a> · coletado {nowBR()}</div>
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
      {!q && !selecionado && (
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
