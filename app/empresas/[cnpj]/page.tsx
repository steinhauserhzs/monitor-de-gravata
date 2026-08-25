import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumbs, Notice, Source } from "@/components/ui";
import { KPI, Flags, Panel, NoticiasList } from "@/components/ficha";
import { getEmpresa } from "@/lib/cnpj";
import { searchPNCP } from "@/lib/pncp";
import { sancoesPorCNPJ, contratosFederaisPorCNPJ, temChavePortal } from "@/lib/transparencia";
import { safe } from "@/lib/fetcher";
import { inexistente } from "@/lib/fetcher";
import { FonteIndisponivel } from "@/components/FonteIndisponivel";
import { runRules } from "@/lib/rules";
import { brl, dateBR, fmtCNPJ, onlyDigits, validCNPJ, nowBR } from "@/lib/format";
import { noticiasGoogle } from "@/lib/noticias";
import { cotaRecebidaPorEmpresa } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function generateMetadata({ params }: PageProps<"/empresas/[cnpj]">) {
  const { cnpj } = await params;
  const e = await safe(getEmpresa(cnpj));
  return { title: e.data ? `${e.data.razao_social} — ficha da empresa` : "Empresa" };
}

export default async function FichaEmpresa({ params }: PageProps<"/empresas/[cnpj]">) {
  const { cnpj: raw } = await params;
  const cnpj = onlyDigits(raw);
  if (!validCNPJ(cnpj)) notFound();
  const emp = await safe(getEmpresa(cnpj));
  if (!emp.data) {
    if (inexistente(emp)) notFound();
    return (
      <FonteIndisponivel
        motivo={emp.motivo}
        fonte={emp.fonte}
        detalhe={emp.error}
        oQue="a ficha desta empresa"
        voltarHref="/empresas"
        voltarLabel="Consultar outro CNPJ"
      />
    );
  }
  const e = emp.data;

  const [pncp, editais, sanc, fed, noticias, cota] = await Promise.all([
    safe(searchPNCP({ q: cnpj, tipo: "contrato", tam: 30 })),
    safe(searchPNCP({ q: cnpj, tipo: "edital", tam: 10 })),
    sancoesPorCNPJ(cnpj).catch((e) => ({ ok: false as const, motivo: "falha" as const, erro: String(e) })),
    temChavePortal() ? contratosFederaisPorCNPJ(cnpj).catch(() => null) : Promise.resolve(null),
    noticiasGoogle(`"${e.razao_social}"`, 8),
    cotaRecebidaPorEmpresa(cnpj),
  ]);
  const contratos = (pncp.data?.items ?? []).map((it) => ({ valor: it.valor_global ?? 0, orgao: it.orgao_nome, data: it.data_assinatura ?? it.data_publicacao_pncp, it }));
  const somaPNCP = contratos.reduce((a, c) => a + c.valor, 0);
  const findings = runRules("empresa", { empresa: e, contratos, sancoes: sanc.ok ? { ceis: sanc.ceis, cnep: sanc.cnep } : null });
  const idadeAnos = e.data_inicio_atividade ? ((Date.now() - new Date(e.data_inicio_atividade).getTime()) / (365.25 * 86400000)).toFixed(1) : "—";

  return (
    <>
      <Crumbs items={[{ href: "/empresas", label: "Empresas" }, { label: fmtCNPJ(cnpj) }]} />
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-8 border-b-2 border-ink">
        <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-3">{fmtCNPJ(cnpj)} · {e.natureza_juridica} · {e.porte}{e.opcao_pelo_mei ? " · MEI" : ""}{e.opcao_pelo_simples ? " · Simples" : ""}</div>
        <h1 className="font-display text-3xl md:text-5xl leading-[0.95] mt-1 rise">{e.razao_social}</h1>
        {e.nome_fantasia && <div className="font-serif italic text-xl text-ink-2 mt-1">{e.nome_fantasia}</div>}
        <div className="mt-2 flex flex-wrap gap-2">
          <span className={`stamp stamp--flat ${(e.descricao_situacao_cadastral || "").toUpperCase() === "ATIVA" ? "stamp--verde" : ""}`}>{e.descricao_situacao_cadastral}</span>
          {findings.some((f) => f.severidade === "alta") && <span className="stamp stamp--flat">red flag alta</span>}
          {sanc.ok && sanc.ceis + sanc.cnep > 0 && <span className="stamp stamp--flat">sancionada</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 font-mono text-[0.62rem] uppercase tracking-[0.12em]">
          <a className="underline underline-offset-2" href={`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`} target="_blank" rel="noopener noreferrer">json (BrasilAPI) ↗</a>
          <a className="underline underline-offset-2" href={`https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp?cnpj=${cnpj}`} target="_blank" rel="noopener noreferrer">comprovante Receita ↗</a>
          <a className="underline underline-offset-2" href={`https://pncp.gov.br/app/contratos?q=${cnpj}`} target="_blank" rel="noopener noreferrer">no PNCP ↗</a>
          <a className="underline underline-offset-2" href={`https://portaldatransparencia.gov.br/busca?termo=${cnpj}`} target="_blank" rel="noopener noreferrer">Portal da Transparência ↗</a>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
          <KPI label="Abertura" value={dateBR(e.data_inicio_atividade)} hint={`${idadeAnos} anos`} />
          <KPI label="Capital social" value={brl(e.capital_social)} />
          <KPI label="Contratos no PNCP" value={pncp.data?.total ?? "—"} hint={contratos.length ? `${brl(somaPNCP)} nos ${contratos.length} mais recentes` : pncp.error ? "índice PNCP indisponível" : "nenhum localizado"} />
          <KPI label="Sanções" value={sanc.ok ? sanc.ceis + sanc.cnep : "?"} hint={sanc.ok ? `CEIS ${sanc.ceis} · CNEP ${sanc.cnep}` : sanc.motivo === "sem-chave" ? "não consultado — requer chave do Portal da Transparência" : "não foi possível consultar CEIS/CNEP agora — isto NÃO significa ausência de sanção"} tone={sanc.ok && sanc.ceis + sanc.cnep > 0 ? "stamp" : undefined} />
          <KPI label="Cota parlamentar recebida" value={cota ? brl(Number(cota.valor_total)) : "—"} hint={cota ? `${cota.n_deputados} deputado(s) · ${cota.n_notas} nota(s)` : "nenhuma nota localizada"} tone={cota ? "stamp" : undefined} />
          <KPI label="Red flags" value={findings.length} tone={findings.some((f) => f.severidade === "alta") ? "stamp" : "verde"} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-6">
            <Panel kicker="§1" title="Contratos públicos (índice do PNCP)" right={<Source url={`https://pncp.gov.br/app/contratos?q=${cnpj}`} label="PNCP" />}>
              {pncp.error && <Notice tone="warn">Busca do PNCP indisponível: {pncp.error}</Notice>}
              {pncp.data && !contratos.length && <p className="text-sm text-ink-3">Nenhum contrato indexado no PNCP para este CNPJ (o PNCP cobre contratos publicados a partir de 2024).</p>}
              {contratos.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead><tr><th>Data</th><th>Órgão</th><th>Objeto</th><th className="text-right">Valor</th></tr></thead>
                    <tbody>{contratos.map(({ it }) => <tr key={it.id}><td className="font-mono text-xs whitespace-nowrap">{dateBR(it.data_assinatura ?? it.data_publicacao_pncp)}</td><td className="text-xs">{it.orgao_nome}<div className="text-ink-3">{it.municipio_nome}/{it.uf}</div></td><td className="text-xs max-w-md"><Link href={`/contratos/${it.orgao_cnpj}/${it.ano}/${it.numero_sequencial}`} className="underline decoration-stamp underline-offset-2">{it.description?.slice(0, 160)}</Link></td><td className="text-right font-mono text-xs whitespace-nowrap">{brl(it.valor_global)}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
              {(editais.data?.items.length ?? 0) > 0 && <p className="mt-3 text-xs text-ink-3">Também aparece em {editais.data!.total} edital(is)/ata(s) indexados.</p>}
              {fed && fed.length > 0 && (
                <div className="mt-5">
                  <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-2">Contratos federais (Portal da Transparência)</div>
                  <ul className="text-xs space-y-1">{fed.slice(0, 15).map((c) => <li key={c.id}>{dateBR(c.dataAssinatura)} · {c.unidadeGestora?.nome} · {c.objeto?.slice(0, 120)} · <span className="font-mono">{brl(c.valorFinalCompra ?? c.valorInicialCompra)}</span></li>)}</ul>
                </div>
              )}
            </Panel>
            {cota && (
              <Panel kicker="§1b" title="Dinheiro de cota parlamentar recebido por esta empresa">
                <p className="text-sm text-ink-2 mb-3">
                  Esta empresa aparece {cota.n_notas} vez(es) nas notas da cota parlamentar (CEAP), somando <strong>{brl(Number(cota.valor_total))}</strong> de {cota.n_deputados} deputado(s).
                  Receber de vários gabinetes é legal — e é exatamente o tipo de padrão que vale conferir.
                </p>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead><tr><th>Deputado(a)</th><th>Partido/UF</th><th className="text-right">Valor</th><th>Ficha</th></tr></thead>
                    <tbody>
                      {cota.deputados.slice(0, 20).map((d) => (
                        <tr key={d.id}>
                          <td className="text-xs">{d.nome}</td>
                          <td className="font-mono text-xs">{d.partido}-{d.uf}</td>
                          <td className="text-right font-mono text-xs">{brl(Number(d.valor))}</td>
                          <td className="text-xs"><Link href={`/politicos/deputado/${d.id}`} className="underline">abrir →</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-[0.68rem] text-ink-3">Fonte: arquivo anual oficial da cota parlamentar (Câmara), processado em lote. Ver <Link href="/cruzamentos" className="underline">todos os cruzamentos</Link>.</p>
              </Panel>
            )}
            <Panel kicker="§2" title="Red flags automáticas">
              <Flags findings={findings} />
              {!sanc.ok && (
                <Notice tone="warn" title="Sanções não verificadas">
                  {sanc.motivo === "sem-chave"
                    ? "Este site está sem a chave do Portal da Transparência, então CEIS e CNEP não foram consultados."
                    : "A consulta ao CEIS/CNEP falhou agora."}{" "}
                  As red flags acima foram calculadas <strong>sem</strong> essa informação — a ausência de
                  sanção listada aqui não é atestado de que não existe sanção.{" "}
                  <a className="underline" href={`https://portaldatransparencia.gov.br/busca?termo=${cnpj}`} target="_blank" rel="noopener noreferrer">Conferir no Portal da Transparência ↗</a>
                </Notice>
              )}
            </Panel>
            {sanc.ok && sanc.ceis + sanc.cnep > 0 && (
              <Panel kicker="§3" title="Sanções registradas (CGU)">
                <ul className="text-sm space-y-2">
                  {[...sanc.ceisLista, ...sanc.cnepLista].map((s) => <li key={s.id} className="card p-3"><div className="font-semibold">{s.tipoSancao?.descricaoResumida}</div><div className="text-xs text-ink-2">{s.orgaoSancionador?.nome} · {dateBR(s.dataInicioSancao)} → {dateBR(s.dataFimSancao)} · {s.fundamentacao?.map((f) => f.descricao).join("; ")}</div></li>)}
                </ul>
              </Panel>
            )}
          </div>
          <div className="space-y-6">
            <Panel kicker="§4" title="Quadro societário (QSA)" right={<Source url={`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`} label={e._fonte} />}>
              {!e.qsa?.length && <p className="text-sm text-ink-3">Sem sócios listados (MEI/individual ou dado não disponível).</p>}
              <ul className="text-sm space-y-2">
                {(e.qsa ?? []).map((s, i) => (
                  <li key={i}>
                    <div className="font-semibold">{s.nome_socio}</div>
                    <div className="text-xs text-ink-2">{s.qualificacao_socio} · desde {dateBR(s.data_entrada_sociedade)} · {s.cnpj_cpf_do_socio}{s.faixa_etaria ? ` · ${s.faixa_etaria}` : ""}</div>
                    <a className="font-mono text-[0.6rem] uppercase underline" href={`/buscar?q=${encodeURIComponent(s.nome_socio)}`}>é político/candidato? buscar →</a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[0.68rem] text-ink-3">CPF de sócio vem mascarado da Receita — é assim que deve ficar. Cruzar sócio × servidor/candidato exige nome exato + verificação humana.</p>
            </Panel>
            <Panel kicker="§5" title="Dados cadastrais">
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                {[
                  ["CNAE principal", `${e.cnae_fiscal} · ${e.cnae_fiscal_descricao}`],
                  ["CNAEs secundários", String(e.cnaes_secundarios?.length ?? 0)],
                  ["Sede", `${e.logradouro ?? ""} ${e.numero ?? ""}, ${e.bairro ?? ""} — ${e.municipio}/${e.uf} ${e.cep ?? ""}`],
                  ["Situação desde", dateBR(e.data_situacao_cadastral)],
                  ["Contato", [e.ddd_telefone_1, e.email].filter(Boolean).join(" · ") || "—"],
                ].map(([a, b]) => <><dt key={a + "k"} className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3 pt-0.5">{a}</dt><dd key={a + "v"} className="text-xs">{b}</dd></>)}
              </dl>
            </Panel>
            <Panel kicker="§6" title="Na mídia">
              <NoticiasList noticias={noticias} query={e.razao_social} />
            </Panel>
            <Panel kicker="§7" title="Contribua">
              <ul className="text-sm space-y-2 text-ink-2">
                <li>→ <a className="underline" href={`https://github.com/steinhauserhzs/monitor-de-gravata/issues/new?template=caso.yml&title=${encodeURIComponent(`[caso] ${e.razao_social} (${fmtCNPJ(cnpj)})`)}`} target="_blank" rel="noopener noreferrer">Abrir um caso</a></li>
                <li>→ É doadora de campanha? Cruze com o <Link href="/candidatos" className="underline">Manual do Candidato</Link>.</li>
                <li>→ <Link className="underline" href="/sobre#resposta">Direito de resposta</Link> (empresa)</li>
              </ul>
              <div className="mt-3 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">coletado {nowBR()}</div>
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
