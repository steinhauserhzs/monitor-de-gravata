import Link from "next/link";
import { PageHead, Section, Notice, Empty, Sev } from "@/components/ui";
import { listContratos, listContratacoes, searchPNCP, MODALIDADES, type ContratoPNCP, type ContratacaoPNCP } from "@/lib/pncp";
import { safe } from "@/lib/fetcher";
import { runRules } from "@/lib/rules";
import { brl, dateBR, yyyymmdd, daysAgo, nowBR } from "@/lib/format";
import { UFS } from "@/lib/tse";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const metadata = { title: "Radar de contratos" };

export default async function Contratos({ searchParams }: PageProps<"/contratos">) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q ?? "").trim();
  const uf = (Array.isArray(sp.uf) ? sp.uf[0] : sp.uf ?? "").toUpperCase();
  const modo = (Array.isArray(sp.modo) ? sp.modo[0] : sp.modo ?? "contratos") as "contratos" | "dispensas" | "inexigibilidades" | "busca";
  const dias = Math.min(30, Math.max(1, Number(Array.isArray(sp.dias) ? sp.dias[0] : sp.dias) || 2));
  const minValor = Number(Array.isArray(sp.min) ? sp.min[0] : sp.min) || 0;

  const dataInicial = yyyymmdd(daysAgo(dias));
  const dataFinal = yyyymmdd(new Date());

  let contratos: ContratoPNCP[] = [];
  let contratacoes: ContratacaoPNCP[] = [];
  let erro: string | null = null;
  let total = 0;
  let busca: Awaited<ReturnType<typeof searchPNCP>> | null = null;

  if (q) {
    const r = await safe(searchPNCP({ q, uf: uf || undefined, tam: 30 }));
    busca = r.data;
    erro = r.error;
  } else if (modo === "contratos") {
    const r = await safe(listContratos({ dataInicial, dataFinal, tamanhoPagina: 200 }));
    if (r.data) {
      contratos = r.data.data.filter((c) => (!uf || c.unidadeOrgao?.ufSigla === uf) && (c.valorGlobal ?? 0) >= minValor).sort((a, b) => (b.valorGlobal ?? 0) - (a.valorGlobal ?? 0));
      total = r.data.totalRegistros;
    } else erro = r.error;
  } else {
    const modalidade = modo === "dispensas" ? 8 : 9;
    const r = await safe(listContratacoes({ dataInicial, dataFinal, modalidade, uf: uf || undefined, tamanhoPagina: 200 }));
    if (r.data) {
      contratacoes = r.data.data.filter((c) => (c.valorTotalEstimado ?? 0) >= minValor).sort((a, b) => (b.valorTotalEstimado ?? 0) - (a.valorTotalEstimado ?? 0));
      total = r.data.totalRegistros;
    } else erro = r.error;
  }

  const flagsContrato = (c: ContratoPNCP) => runRules("contrato", { contrato: c });
  const flagsContratacao = (c: ContratacaoPNCP) => runRules("contratacao", { contratacao: c });

  return (
    <>
      <PageHead
        kicker="Módulo 03"
        title="Radar de contratos"
        stamp="PNCP ao vivo"
        stampTone="verde"
        lead="Tudo que União, estados e municípios publicam no Portal Nacional de Contratações Públicas — contratos assinados, dispensas e inexigibilidades — com red flags calculadas na hora. Clique num contrato para cruzar com a Receita (idade do CNPJ, capital, sócios) e sanções."
        right={
          <form className="card p-4 grid gap-2 sm:grid-cols-2 min-w-[22rem]">
            <label className="block sm:col-span-2"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Buscar (objeto, órgão, CNPJ/nome do fornecedor)</span><input name="q" defaultValue={q} className="input" placeholder="ex.: merenda escolar, 14126371000129" /></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Modo</span>
              <select name="modo" defaultValue={modo} className="input"><option value="contratos">Contratos assinados</option><option value="dispensas">Dispensas de licitação</option><option value="inexigibilidades">Inexigibilidades</option></select></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">UF</span>
              <select name="uf" defaultValue={uf} className="input"><option value="">Todas</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Últimos dias</span><input name="dias" type="number" min={1} max={30} defaultValue={dias} className="input" /></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Valor mínimo (R$)</span><input name="min" type="number" min={0} step={1000} defaultValue={minValor || ""} className="input" placeholder="0" /></label>
            <button className="btn sm:col-span-2" type="submit">Varrer PNCP</button>
          </form>
        }
      />

      <Section kicker={q ? "Busca" : modo} title={q ? `Resultados para “${q}”` : `${modo === "contratos" ? "Contratos publicados" : modo === "dispensas" ? "Dispensas publicadas" : "Inexigibilidades publicadas"} nos últimos ${dias} dia(s)${uf ? ` · ${uf}` : ""}`}>
        {erro && <Notice tone="warn" title="PNCP">A API do PNCP não respondeu: {erro}. Tente reduzir os dias ou repetir.</Notice>}
        <div className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-3">
          {q ? `${busca?.total ?? 0} resultado(s) no índice do PNCP` : `${total.toLocaleString("pt-BR")} registro(s) no período no PNCP inteiro · exibindo os ${(contratos.length || contratacoes.length)} maiores da 1ª página (200)`} · coletado {nowBR()}
        </div>

        {q && busca && (
          busca.items.length ? (
            <div className="overflow-x-auto card">
              <table className="table">
                <thead><tr><th>Publicado</th><th>Órgão</th><th>Objeto</th><th>Fornecedor</th><th>Modalidade</th><th className="text-right">Valor</th></tr></thead>
                <tbody>
                  {busca.items.map((it) => (
                    <tr key={it.id}>
                      <td className="font-mono text-xs whitespace-nowrap">{dateBR(it.data_publicacao_pncp)}</td>
                      <td className="text-xs">{it.orgao_nome}<div className="text-ink-3">{it.municipio_nome}/{it.uf} · {it.esfera_nome}</div></td>
                      <td className="text-xs max-w-md"><Link href={`/contratos/${it.orgao_cnpj}/${it.ano}/${it.numero_sequencial}`} className="underline decoration-stamp underline-offset-2">{it.description?.slice(0, 180)}</Link></td>
                      <td className="text-xs">{it.nome_fornecedor ?? "—"}{it.cnpj_fornecedor && <div><Link href={`/empresas/${it.cnpj_fornecedor}`} className="font-mono text-[0.62rem] underline">{it.cnpj_fornecedor}</Link></div>}</td>
                      <td className="text-xs">{it.modalidade_licitacao_nome}</td>
                      <td className="text-right font-mono text-xs whitespace-nowrap">{brl(it.valor_global)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty>Nada encontrado no PNCP.</Empty>
        )}

        {!q && modo === "contratos" && (contratos.length ? (
          <div className="overflow-x-auto card">
            <table className="table">
              <thead><tr><th>Assinatura</th><th>Órgão</th><th>Objeto</th><th>Fornecedor</th><th>Categoria</th><th className="text-right">Valor global</th><th>Sinais</th></tr></thead>
              <tbody>
                {contratos.map((c) => {
                  const f = flagsContrato(c);
                  const [cnpj, , rest] = c.numeroControlePNCP.split("-");
                  const [seq, ano] = (rest ?? "").split("/");
                  return (
                    <tr key={c.numeroControlePNCP}>
                      <td className="font-mono text-xs whitespace-nowrap">{dateBR(c.dataAssinatura)}</td>
                      <td className="text-xs">{c.orgaoEntidade?.razaoSocial}<div className="text-ink-3">{c.unidadeOrgao?.municipioNome}/{c.unidadeOrgao?.ufSigla}</div></td>
                      <td className="text-xs max-w-md"><Link href={`/contratos/${cnpj}/${ano}/${Number(seq)}`} className="underline decoration-stamp underline-offset-2">{c.objetoContrato?.slice(0, 160)}</Link></td>
                      <td className="text-xs">{c.nomeRazaoSocialFornecedor}<div><Link href={`/empresas/${c.niFornecedor}`} className="font-mono text-[0.62rem] underline">{c.niFornecedor}</Link></div></td>
                      <td className="text-xs">{c.categoriaProcesso?.nome}</td>
                      <td className="text-right font-mono text-xs whitespace-nowrap">{brl(c.valorGlobal)}</td>
                      <td className="text-xs">{f.length ? <div className="flex flex-wrap gap-1">{f.map((x) => <Sev key={x.regra} level={x.severidade}>{x.nome}</Sev>)}</div> : <span className="text-ink-3">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : !erro && <Empty>Nenhum contrato no filtro.</Empty>)}

        {!q && modo !== "contratos" && (contratacoes.length ? (
          <div className="overflow-x-auto card">
            <table className="table">
              <thead><tr><th>Publicado</th><th>Órgão</th><th>Objeto</th><th>Amparo legal</th><th className="text-right">Valor estimado</th><th>Sinais</th></tr></thead>
              <tbody>
                {contratacoes.map((c) => {
                  const f = flagsContratacao(c);
                  return (
                    <tr key={c.numeroControlePNCP}>
                      <td className="font-mono text-xs whitespace-nowrap">{dateBR(c.dataPublicacaoPncp)}</td>
                      <td className="text-xs">{c.orgaoEntidade?.razaoSocial}<div className="text-ink-3">{c.unidadeOrgao?.municipioNome}/{c.unidadeOrgao?.ufSigla}</div></td>
                      <td className="text-xs max-w-md"><a href={`https://pncp.gov.br/app/editais/${c.orgaoEntidade?.cnpj}/${c.anoCompra}/${c.sequencialCompra}`} target="_blank" rel="noopener noreferrer" className="underline decoration-stamp underline-offset-2">{c.objetoCompra?.slice(0, 160)}</a></td>
                      <td className="text-xs">{c.amparoLegal?.nome}<div className="text-ink-3">{MODALIDADES[c.modalidadeId] ?? c.modalidadeNome}</div></td>
                      <td className="text-right font-mono text-xs whitespace-nowrap">{brl(c.valorTotalEstimado)}</td>
                      <td className="text-xs">{f.length ? <div className="flex flex-wrap gap-1">{f.map((x) => <Sev key={x.regra} level={x.severidade}>{x.nome}</Sev>)}</div> : <span className="text-ink-3">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : !erro && <Empty>Nenhuma contratação no filtro.</Empty>)}
      </Section>

      <Section>
        <div className="grid gap-4 md:grid-cols-3">
          <Notice tone="info" title="O que o radar cobre">Contratos e contratações publicados no PNCP desde 2024 por todos os entes (Lei 14.133). Contratos federais anteriores e por fornecedor: Portal da Transparência (chave). Estaduais antigos: TCEs.</Notice>
          <Notice tone="warn" title="O que não é">Uma red flag é um sinal calculado por regra pública. Não é irregularidade nem acusação. Abra o contrato, leia o edital, cruze com a empresa e — se fizer sentido — <Link href="/contribuir" className="underline">documente um caso</Link>.</Notice>
          <Notice tone="ok" title="Como ajudar">Proponha regras (fracionamento, participante único, sobrepreço vs. Painel de Preços) em <Link href="/radar" className="underline">Motor de red flags</Link>. As mais pedidas precisam de processamento em lote — ajude no repositório.</Notice>
        </div>
      </Section>
    </>
  );
}
