import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumbs, Notice, Source, Section } from "@/components/ui";
import { KPI, Panel } from "@/components/ficha";
import { precosAmostra, estatisticas, classificar, loadPDMs, loadServicos, COMPRAS, linkCompraGov, termoObjeto, idCompraDe } from "@/lib/precos";
import { searchPNCP } from "@/lib/pncp";
import { safe } from "@/lib/fetcher";
import { brl, dateBR, nowBR } from "@/lib/format";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function generateMetadata({ params }: PageProps<"/precos/compra/[id]">) {
  const { id } = await params;
  return { title: `Compra ${id} — licitação e itens` };
}

const MODALIDADES: Record<number, string> = {
  1: "Convite", 2: "Tomada de preços", 3: "Concorrência", 4: "Concorrência internacional", 5: "Pregão", 6: "Dispensa de licitação",
  7: "Inexigibilidade", 20: "Concurso", 22: "Tomada de preços por técnica e preço", 33: "Manifestação de interesse", 99: "Regime diferenciado",
};

export default async function CompraDetalhe({ params, searchParams }: PageProps<"/precos/compra/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const pdm = Number(Array.isArray(sp.pdm) ? sp.pdm[0] : sp.pdm) || 0;
  const itemFoco = Number(Array.isArray(sp.item) ? sp.item[0] : sp.item) || 0;
  if (!/^\d{10,20}$/.test(id) || !pdm) notFound();

  const tipo = (Array.isArray(sp.tipo) ? sp.tipo[0] : sp.tipo ?? "material") as "material" | "servico";
  const pdmSel = tipo === "servico" ? loadServicos().filter((x) => x.c === pdm).map((x) => ({ c: x.c, n: x.n }))[0] : loadPDMs().filter((x) => x.c === pdm).map((x) => ({ c: x.c, n: x.n }))[0];
  // a API de preços filtra por PDM; pegamos a amostra e isolamos os itens desta compra
  const amostra = await safe(precosAmostra(pdm, { paginas: 3, tipo }));
  const itens = (amostra.data?.resultado ?? []).filter((p) => idCompraDe(p) === id);
  const ref = itens[0];
  if (!ref) {
    return (
      <>
        <Crumbs items={[{ href: "/precos", label: "Preços" }, { label: `Compra ${id}` }]} />
        <Section>
          <Notice tone="warn" title="Compra fora da amostra atual">
            Esta compra não está na amostra de preços carregada agora (a API do Compras.gov.br devolve por padrão de material e período).
            Você ainda pode abri-la direto na fonte oficial:{" "}
            <a className="underline" href={`https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-web/public/compras/acompanhamento-compra?compra=${id}`} target="_blank" rel="noopener noreferrer">acompanhamento da compra no Compras.gov.br ↗</a>{" "}
            · <Link className="underline" href="/precos">voltar ao comparador</Link>
          </Notice>
        </Section>
      </>
    );
  }

  const todos = [...itens].sort((a, b) => a.numeroItemCompra - b.numeroItemCompra);
  const est = estatisticas((amostra.data?.resultado ?? []).map((p) => p.precoUnitario));
  const total = todos.reduce((a, p) => a + p.precoUnitario * (p.quantidade || 0), 0);
  const objeto = (ref.objetoCompra || "").replace(/^Objeto:\s*/i, "");
  const termo = termoObjeto(ref);
  const pncp = await safe(searchPNCP({ q: termo, uf: ref.estado || undefined, tipo: "edital", tam: 5 }));
  const pncpContratos = await safe(searchPNCP({ q: ref.nomeFornecedor || termo, uf: ref.estado || undefined, tipo: "contrato", tam: 5 }));

  return (
    <>
      <Crumbs items={[{ href: "/precos", label: "Preços" }, { href: `/precos?q=${encodeURIComponent(pdmSel?.n ?? "")}&pdm=${pdm}`, label: pdmSel?.n ?? `PDM ${pdm}` }, { label: `Compra ${id}` }]} />
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-8 border-b-2 border-ink">
        <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-3">
          {MODALIDADES[ref.modalidade] ?? `Modalidade ${ref.modalidade}`} · {ref.forma} · UASG {ref.codigoUasg} · {ref.municipio}/{ref.estado} · esfera {ref.esfera} · poder {ref.poder}
        </div>
        <h1 className="font-display text-3xl md:text-5xl leading-[0.95] mt-1 rise">{objeto || `Compra ${id}`}</h1>
        <div className="mt-3 text-sm text-ink-2"><strong>{ref.nomeOrgao}</strong> · {ref.nomeUasg}</div>
        <div className="mt-3 flex flex-wrap gap-3 font-mono text-[0.62rem] uppercase tracking-[0.12em]">
          <a className="underline underline-offset-2" href={linkCompraGov(ref)} target="_blank" rel="noopener noreferrer">acompanhar no Compras.gov.br ↗</a>
          <a className="underline underline-offset-2" href={tipo === "servico" ? `${COMPRAS}/modulo-pesquisa-preco/3_consultarServico?codigoItemCatalogo=${pdm}&idCompra=${id}&pagina=1&tamanhoPagina=10` : `${COMPRAS}/modulo-pesquisa-preco/1_consultarMaterial?tipo=codigoPdm&codigo=${pdm}&idCompra=${id}&pagina=1&tamanhoPagina=10`} target="_blank" rel="noopener noreferrer">json da compra ↗</a>
          <a className="underline underline-offset-2" href={`https://pncp.gov.br/app/editais?q=${encodeURIComponent(termo)}`} target="_blank" rel="noopener noreferrer">procurar no PNCP ↗</a>
          <Link className="underline underline-offset-2" href={`/contratos?q=${encodeURIComponent(termo)}&uf=${ref.estado}`}>ver contratos relacionados no radar</Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
          <KPI label="Data da compra" value={dateBR(ref.dataCompra)} hint={ref.dataResultado ? `resultado em ${dateBR(ref.dataResultado)}` : undefined} />
          <KPI label="Itens nesta amostra" value={todos.length} hint={`do padrão ${pdmSel?.n ?? pdm}`} />
          <KPI label="Valor destes itens" value={brl(total)} hint="preço unitário × quantidade homologada" />
          <KPI label="Fornecedor" value={<span className="text-lg">{ref.nomeFornecedor}</span>} hint={<Link href={`/empresas/${ref.niFornecedor}`} className="underline font-mono">{ref.niFornecedor}</Link>} />
          <KPI
            label="Maior unitário vs. mediana nacional"
            value={est ? `${(Math.max(...todos.map((t) => t.precoUnitario)) / est.mediana).toFixed(1)}×` : "—"}
            tone={est && Math.max(...todos.map((t) => t.precoUnitario)) / est.mediana >= 1.7 ? "stamp" : "verde"}
            hint={est ? `mediana ${brl(est.mediana)}` : undefined}
          />
        </div>

        <Panel kicker="§1" title="Itens desta compra (padrão selecionado)" right={<Source url={`${COMPRAS}/modulo-pesquisa-preco/${tipo === "servico" ? "3_consultarServico" : "1_consultarMaterial"}?codigo=${pdm}&idCompra=${id}`} label="Compras.gov.br" />}>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>#</th><th>Descrição</th><th>Marca</th><th className="text-right">Qtd</th><th>Unidade</th><th className="text-right">Unitário</th><th className="text-right">Total</th><th>Sinal</th></tr></thead>
              <tbody>
                {todos.map((p) => {
                  const cls = est ? classificar(p.precoUnitario, est) : null;
                  return (
                    <tr key={p.idItemCompra ?? p.numeroItemCompra} className={itemFoco === p.numeroItemCompra ? "bg-marker/20" : undefined}>
                      <td className="font-mono text-xs">{p.numeroItemCompra}</td>
                      <td className="text-xs max-w-lg">{p.descricaoDetalhadaItem || p.descricaoItem}</td>
                      <td className="text-xs">{p.marca ?? "—"}</td>
                      <td className="text-right font-mono text-xs">{p.quantidade}</td>
                      <td className="text-xs">{p.nomeUnidadeFornecimento || p.siglaUnidadeFornecimento || "—"}</td>
                      <td className="text-right font-mono text-xs font-bold">{brl(p.precoUnitario)}</td>
                      <td className="text-right font-mono text-xs">{brl(p.precoUnitario * (p.quantidade || 0))}</td>
                      <td className="text-xs">{cls ? <span className={`sev ${cls.nivel === "muito-alto" || cls.nivel === "alto" ? "sev--alta" : cls.nivel === "atencao" ? "sev--media" : "sev--ok"}`}>{cls.razao.toFixed(1)}× mediana</span> : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[0.68rem] text-ink-3">
            Só aparecem aqui os itens do padrão de material selecionado. A compra pode ter outros itens — veja a íntegra no{" "}
            <a className="underline" href={linkCompraGov(ref)} target="_blank" rel="noopener noreferrer">Compras.gov.br</a>. Preço muito acima da mediana pode ser sobrepreço, unidade diferente (caixa × unidade) ou erro de digitação do órgão.
          </p>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel kicker="§2" title="Editais no PNCP com objeto parecido">
            {pncp.error && <Notice tone="warn">Busca do PNCP indisponível: {pncp.error}</Notice>}
            {pncp.data && !pncp.data.items.length && <p className="text-sm text-ink-3">Nenhum edital com o termo “{termo}” em {ref.estado}. Tente no <Link href={`/contratos?q=${encodeURIComponent(termo)}`} className="underline">radar</Link> sem filtro de UF.</p>}
            <ul className="space-y-2 text-sm">
              {(pncp.data?.items ?? []).map((it) => (
                <li key={it.id}>
                  <Link href={`/contratos/${it.orgao_cnpj}/${it.ano}/${it.numero_sequencial}`} className="underline decoration-stamp underline-offset-2">{it.orgao_nome}</Link>
                  <div className="text-xs text-ink-2">{(it.description || "").slice(0, 150)}</div>
                  <div className="font-mono text-[0.6rem] uppercase text-ink-3">{it.modalidade_licitacao_nome} · {it.municipio_nome}/{it.uf} · {dateBR(it.data_publicacao_pncp)}</div>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel kicker="§3" title={`Contratos do fornecedor no PNCP`}>
            {pncpContratos.data && !pncpContratos.data.items.length && <p className="text-sm text-ink-3">Nenhum contrato indexado no PNCP para “{ref.nomeFornecedor}”.</p>}
            <ul className="space-y-2 text-sm">
              {(pncpContratos.data?.items ?? []).map((it) => (
                <li key={it.id}>
                  <Link href={`/contratos/${it.orgao_cnpj}/${it.ano}/${it.numero_sequencial}`} className="underline decoration-stamp underline-offset-2">{it.orgao_nome}</Link>
                  <div className="text-xs text-ink-2">{(it.description || "").slice(0, 130)}</div>
                  <div className="font-mono text-[0.6rem] uppercase text-ink-3">{brl(it.valor_global)} · {it.municipio_nome}/{it.uf}</div>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[0.68rem] text-ink-3"><Link href={`/empresas/${ref.niFornecedor}`} className="underline">Ficha completa da empresa →</Link></p>
          </Panel>
        </div>

        <Notice tone="info" title="De onde vem cada número">
          Itens e preços: Compras.gov.br (dados abertos, módulo de pesquisa de preço). Editais e contratos: PNCP. Empresa: Receita Federal via BrasilAPI.
          Coletado em {nowBR()}. Nada aqui é acusação — é o registro público da compra.
        </Notice>
      </div>
    </>
  );
}
