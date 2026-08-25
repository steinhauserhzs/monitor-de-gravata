import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumbs, Notice, Source } from "@/components/ui";
import { KPI, Flags, Panel } from "@/components/ficha";
import { getContrato, getItensCompra, PNCP_API, type ContratoPNCP } from "@/lib/pncp";
import { getEmpresa } from "@/lib/cnpj";
import { sancoesPorCNPJ, temChavePortal } from "@/lib/transparencia";
import { safe } from "@/lib/fetcher";
import { inexistente } from "@/lib/fetcher";
import { FonteIndisponivel } from "@/components/FonteIndisponivel";
import { runRules } from "@/lib/rules";
import { brl, dateBR, fmtCNPJ, nowBR } from "@/lib/format";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function ContratoDetalhe({ params }: PageProps<"/contratos/[cnpj]/[ano]/[seq]">) {
  const { cnpj, ano, seq } = await params;
  const c = await safe(getContrato(cnpj, ano, seq));
  if (!c.data) {
    if (inexistente(c)) notFound();
    return (
      <FonteIndisponivel
        motivo={c.motivo}
        fonte={c.fonte}
        detalhe={c.error}
        oQue="a ficha deste contrato"
        voltarHref="/contratos"
        voltarLabel="Voltar ao radar de contratos"
        siteOficial={{ href: "https://pncp.gov.br", label: "Abrir o PNCP" }}
      />
    );
  }
  const k = c.data as ContratoPNCP & Record<string, unknown>;

  const compraSeq = k.numeroControlePncpCompra ? Number(k.numeroControlePncpCompra.split("-")[2]?.split("/")[0]) : null;
  const compraAno = k.numeroControlePncpCompra ? Number(k.numeroControlePncpCompra.split("/")[1]) : null;
  const compraCnpj = k.numeroControlePncpCompra ? k.numeroControlePncpCompra.split("-")[0] : null;

  const [emp, itens, sanc] = await Promise.all([
    k.tipoPessoa === "PJ" && k.niFornecedor ? safe(getEmpresa(k.niFornecedor)) : Promise.resolve({ data: null, error: "fornecedor pessoa física" }),
    compraCnpj && compraAno && compraSeq ? safe(getItensCompra(compraCnpj, compraAno, compraSeq)) : Promise.resolve({ data: null, error: null }),
    k.niFornecedor && k.tipoPessoa === "PJ"
      ? sancoesPorCNPJ(k.niFornecedor).catch((e) => ({ ok: false as const, motivo: "falha" as const, erro: String(e) }))
      : Promise.resolve({ ok: false as const, motivo: "sem-chave" as const, erro: null }),
  ]);

  const findings = runRules("contrato", { contrato: k, empresa: emp.data, itens: itens.data, sancoes: sanc.ok ? { ceis: sanc.ceis, cnep: sanc.cnep } : null });
  const orgao = k.orgaoEntidade;
  const un = k.unidadeOrgao;

  return (
    <>
      <Crumbs items={[{ href: "/contratos", label: "Contratos" }, { label: k.numeroControlePNCP }]} />
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-8 border-b-2 border-ink">
        <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-3">{k.tipoContrato?.nome} · {k.categoriaProcesso?.nome} · {un?.municipioNome}/{un?.ufSigla}</div>
        <h1 className="font-display text-3xl md:text-5xl leading-[0.95] mt-1 rise">{k.objetoContrato}</h1>
        <div className="mt-3 text-sm text-ink-2">
          <strong>{orgao?.razaoSocial}</strong> ({fmtCNPJ(orgao?.cnpj ?? "")}) · {un?.nomeUnidade}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {findings.some((f) => f.severidade === "alta") && <span className="stamp stamp--flat">red flag alta</span>}
          {k.frutoAdesao && <span className="stamp stamp--flat stamp--azul">adesão a ata</span>}
          {k.emendaParlamentar && <span className="stamp stamp--flat stamp--azul">emenda parlamentar</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 font-mono text-[0.62rem] uppercase tracking-[0.12em]">
          <a className="underline underline-offset-2" href={`https://pncp.gov.br/app/contratos/${cnpj}/${ano}/${seq}`} target="_blank" rel="noopener noreferrer">no PNCP ↗</a>
          <a className="underline underline-offset-2" href={`${PNCP_API}/orgaos/${cnpj}/contratos/${ano}/${seq}`} target="_blank" rel="noopener noreferrer">json ↗</a>
          {compraCnpj && <a className="underline underline-offset-2" href={`https://pncp.gov.br/app/editais/${compraCnpj}/${compraAno}/${compraSeq}`} target="_blank" rel="noopener noreferrer">edital/compra de origem ↗</a>}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
          <KPI label="Valor global" value={brl(k.valorGlobal)} hint={k.valorInicial && k.valorInicial !== k.valorGlobal ? `inicial ${brl(k.valorInicial)}` : undefined} />
          <KPI label="Assinatura" value={dateBR(k.dataAssinatura)} hint={`vigência ${dateBR(k.dataVigenciaInicio)} → ${dateBR(k.dataVigenciaFim)}`} />
          <KPI label="Fornecedor" value={<span className="text-xl">{k.nomeRazaoSocialFornecedor}</span>} hint={k.tipoPessoa === "PJ" ? <Link href={`/empresas/${k.niFornecedor}`} className="underline font-mono">{fmtCNPJ(k.niFornecedor)}</Link> : "pessoa física (CPF mascarado)"} />
          <KPI label="Idade do CNPJ na assinatura" value={emp.data?.data_inicio_atividade ? `${Math.floor((new Date(k.dataAssinatura).getTime() - new Date(emp.data.data_inicio_atividade).getTime()) / 86400000 / 30)} m` : "—"} hint={emp.data ? `aberto em ${dateBR(emp.data.data_inicio_atividade)} · ${emp.data.descricao_situacao_cadastral}` : emp.error ?? ""} />
          <KPI label="Red flags" value={findings.length} tone={findings.some((f) => f.severidade === "alta") ? "stamp" : "verde"} hint={sanc.ok ? `CEIS ${sanc.ceis} · CNEP ${sanc.cnep}` : sanc.motivo === "sem-chave" ? "sanções CEIS/CNEP não consultadas (sem chave do Portal)" : "sanções CEIS/CNEP não consultadas — a fonte falhou"} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-6">
            <Panel kicker="§1" title="Red flags automáticas">
              <Flags findings={findings} />
            </Panel>
            <Panel kicker="§2" title="Itens da compra de origem (preços unitários)" right={compraCnpj ? <Source url={`${PNCP_API}/orgaos/${compraCnpj}/compras/${compraAno}/${compraSeq}/itens`} label="PNCP" /> : undefined}>
              {itens.error && <p className="text-sm text-ink-3">Itens indisponíveis ({itens.error}).</p>}
              {itens.data && !itens.data.length && <p className="text-sm text-ink-3">A compra de origem não tem itens publicados.</p>}
              {itens.data && itens.data.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead><tr><th>#</th><th>Descrição</th><th>Qtd</th><th className="text-right">Unit. estimado</th><th className="text-right">Total</th><th>Situação</th><th>Comparar</th></tr></thead>
                    <tbody>{itens.data.slice(0, 40).map((it) => <tr key={it.numeroItem}><td className="font-mono text-xs">{it.numeroItem}</td><td className="text-xs max-w-md">{it.descricao?.slice(0, 200)}</td><td className="text-xs">{it.quantidade} {it.unidadeMedida}</td><td className="text-right font-mono text-xs">{it.orcamentoSigiloso ? "sigiloso" : brl(it.valorUnitarioEstimado)}</td><td className="text-right font-mono text-xs">{brl(it.valorTotal)}</td><td className="text-xs">{it.situacaoCompraItemNome}</td><td className="text-xs"><Link href={`/precos?q=${encodeURIComponent(it.descricao?.split(/[,;(]/)[0]?.trim().split(/\s+/).slice(0, 3).join(" ") ?? "")}&preco=${it.valorUnitarioEstimado ?? ""}`} className="underline whitespace-nowrap">preço praticado →</Link></td></tr>)}</tbody>
                  </table>
                </div>
              )}
              <p className="mt-2 text-[0.68rem] text-ink-3">Clique em "preço praticado" para comparar o unitário com o que outros órgãos pagaram pelo mesmo padrão (Compras.gov.br). A busca usa as primeiras palavras da descrição — refine o termo se o padrão não bater.</p>
            </Panel>
          </div>
          <div className="space-y-6">
            <Panel kicker="§3" title="Fornecedor (Receita Federal)">
              {emp.error && <p className="text-sm text-ink-3">{emp.error}</p>}
              {emp.data && (
                <ul className="text-sm space-y-1">
                  <li><strong>{emp.data.razao_social}</strong>{emp.data.nome_fantasia ? ` (${emp.data.nome_fantasia})` : ""}</li>
                  <li>Situação: {emp.data.descricao_situacao_cadastral} · Porte: {emp.data.porte} {emp.data.opcao_pelo_mei ? "· MEI" : ""}</li>
                  <li>Abertura: {dateBR(emp.data.data_inicio_atividade)} · Capital social: {brl(emp.data.capital_social)}</li>
                  <li>CNAE: {emp.data.cnae_fiscal_descricao}</li>
                  <li>Sede: {emp.data.municipio}/{emp.data.uf}</li>
                  <li>Sócios: {(emp.data.qsa ?? []).map((s) => s.nome_socio).join("; ") || "—"}</li>
                  <li><Link href={`/empresas/${k.niFornecedor}`} className="underline">Ficha completa da empresa →</Link></li>
                </ul>
              )}
              {!temChavePortal() && <p className="mt-3 text-[0.68rem] text-ink-3">Sanções (CEIS/CNEP) e contratos federais anteriores exigem chave do Portal da Transparência (env PORTAL_TRANSPARENCIA_KEY).</p>}
            </Panel>
            <Panel kicker="§4" title="Dados do contrato">
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                {[
                  ["Nº controle PNCP", k.numeroControlePNCP],
                  ["Nº contrato/empenho", k.numeroContratoEmpenho],
                  ["Processo", String(k.processo ?? "—")],
                  ["Compra de origem", k.numeroControlePncpCompra],
                  ["Parcelas", String(k.numeroParcelas ?? "—")],
                  ["Retificações", String(k.numeroRetificacao ?? 0)],
                  ["Publicado no PNCP", dateBR(k.dataPublicacaoPncp)],
                  ["Atualizado", dateBR(k.dataAtualizacao)],
                  ["Esfera / poder", `${orgao?.esferaId} / ${orgao?.poderId}`],
                  ["Cód. IBGE município", un?.codigoIbge],
                ].map(([a, b]) => (
                  <><dt key={a + "k"} className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3 pt-0.5">{a}</dt><dd key={a + "v"} className="font-mono text-xs break-all">{b}</dd></>
                ))}
              </dl>
              {k.informacaoComplementar ? <p className="mt-3 text-xs text-ink-2">{String(k.informacaoComplementar)}</p> : null}
            </Panel>
            <Panel kicker="§5" title="Contribua">
              <ul className="text-sm space-y-2 text-ink-2">
                <li>→ <a className="underline" href={`https://github.com/steinhauserhzs/monitor-de-gravata/issues/new?template=caso.yml&title=${encodeURIComponent(`[caso] Contrato ${k.numeroControlePNCP} — ${orgao?.razaoSocial}`)}`} target="_blank" rel="noopener noreferrer">Abrir um caso</a> com o que você achou no edital</li>
                <li>→ Este contrato está no seu município? Peça a ata e as propostas via LAI (Fala.BR) e anexe.</li>
              </ul>
              <div className="mt-3 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">coletado {nowBR()}</div>
            </Panel>
            <Notice tone="warn">Sinais ≠ irregularidade. Toda leitura aqui exige o edital, a ata e o contrato assinado. Se você é o órgão ou o fornecedor: <Link href="/sobre#resposta" className="underline">direito de resposta</Link>.</Notice>
          </div>
        </div>
      </div>
    </>
  );
}
