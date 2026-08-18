import Link from "next/link";
import { PageHead, Section, Notice, Empty } from "@/components/ui";
import { KPI, Panel } from "@/components/ficha";
import { empresasCotaEContrato, topFornecedoresCota, metaDerivados, temBanco } from "@/lib/db";
import { brl, fmtCNPJ } from "@/lib/format";

export const revalidate = 3600;
export const metadata = { title: "Cruzamentos" };

export default async function Cruzamentos() {
  if (!temBanco()) {
    return (
      <>
        <PageHead kicker="Módulo 07" title="Cruzamentos" lead="Esta página depende do índice derivado (Postgres) alimentado pelos jobs em lote." />
        <Section>
          <Notice tone="warn" title="Índice não configurado">
            Defina <code className="font-mono">DATABASE_URL</code> e rode <code className="font-mono">npm run db:migrar &amp;&amp; npm run db:cota &amp;&amp; npm run db:fornecedores</code>.
          </Notice>
        </Section>
      </>
    );
  }

  const [cruz, topCota, meta] = await Promise.all([empresasCotaEContrato(60), topFornecedoresCota(30), metaDerivados()]);
  const totalCota = topCota.reduce((a, r) => a + Number(r.valor), 0);

  return (
    <>
      <PageHead
        kicker="Módulo 07"
        title={<>O que só aparece<br />quando você cruza</>}
        stamp="índice derivado"
        stampTone="azul"
        lead="Uma nota de cota parlamentar sozinha não diz nada. Um contrato público sozinho também não. Juntos, mostram quem recebe dinheiro do gabinete e do caixa público ao mesmo tempo. Isso não é irregular — é o começo de uma pergunta legítima."
      />

      <Section>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 cascata">
          <KPI label="Empresas nas duas pontas" value={cruz.length} hint="recebem cota parlamentar E têm contrato público" tone={cruz.length ? "stamp" : undefined} />
          <KPI label="Maiores recebedores de cota" value={topCota.length} hint="ranking por valor recebido" />
          <KPI label="Soma no ranking de cota" value={brl(totalCota)} hint="apenas os listados abaixo" />
          <KPI label="Índices no banco" value={meta.length} hint={meta.map((m) => m.chave.split(":")[0]).join(" · ") || "—"} />
        </div>
      </Section>

      <Section kicker="Cruzamento 1" title="Recebem do gabinete e do contrato público">
        {!cruz.length && <Empty>Nenhuma empresa nas duas bases ainda — rode a ingestão de fornecedores com uma janela maior (<code className="font-mono">npm run db:fornecedores 365</code>).</Empty>}
        {cruz.length > 0 && (
          <div className="overflow-x-auto card">
            <table className="table">
              <thead>
                <tr><th>Empresa</th><th>CNPJ</th><th className="text-right">Cota recebida</th><th className="text-right">Deputados</th><th className="text-right">Contratos</th><th className="text-right">Valor em contratos</th></tr>
              </thead>
              <tbody>
                {cruz.map((c) => (
                  <tr key={c.cnpj}>
                    <td className="text-xs"><Link href={`/empresas/${c.cnpj}`} className="underline decoration-stamp underline-offset-2">{c.razao_social}</Link></td>
                    <td className="font-mono text-xs">{fmtCNPJ(c.cnpj)}</td>
                    <td className="text-right font-mono text-xs font-bold">{brl(Number(c.valor_cota))}</td>
                    <td className="text-right font-mono text-xs">{c.n_deputados}</td>
                    <td className="text-right font-mono text-xs">{c.n_contratos}</td>
                    <td className="text-right font-mono text-xs">{brl(Number(c.valor_total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Notice tone="warn" title="Leia com cuidado">
          Uma empresa pode legitimamente vender para gabinetes e para órgãos — companhias aéreas, postos de combustível, gráficas e operadoras
          aparecem naturalmente nas duas listas. O sinal fica interessante quando a empresa é pequena, recente, ou concentra recursos de poucos gabinetes.
          Abra a ficha e confira antes de concluir qualquer coisa.
        </Notice>
      </Section>

      <Section kicker="Cruzamento 2" title="Quem mais recebe da cota parlamentar">
        <Panel kicker="ranking" title="Empresas por valor recebido (ano corrente)">
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>#</th><th>Empresa</th><th>CNPJ</th><th className="text-right">Deputados</th><th className="text-right">Notas</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {topCota.map((r, i) => (
                  <tr key={r.cnpj}>
                    <td className="font-mono text-xs">{i + 1}</td>
                    <td className="text-xs">{r.nome}</td>
                    <td className="font-mono text-xs"><Link href={`/empresas/${r.cnpj}`} className="underline">{fmtCNPJ(r.cnpj)}</Link></td>
                    <td className="text-right font-mono text-xs">{r.n_deputados}</td>
                    <td className="text-right font-mono text-xs">{r.n_notas}</td>
                    <td className="text-right font-mono text-xs font-bold">{brl(Number(r.valor))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[0.68rem] text-ink-3">
            Ranking por valor, sem juízo: liderar a lista não significa irregularidade. Significa que muito dinheiro público passa por ali —
            e que vale a pena entender por quê.
          </p>
        </Panel>
      </Section>

      <Section kicker="Procedência" title="De onde vêm estes índices">
        <div className="grid gap-3 md:grid-cols-2">
          {meta.map((m) => (
            <div key={m.chave} className="card p-4">
              <div className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-stamp">{m.chave}</div>
              <div className="mt-1 text-sm">{m.linhas.toLocaleString("pt-BR")} linha(s)</div>
              <div className="text-xs text-ink-2">{m.observacao}</div>
              <a href={m.fonte_url} target="_blank" rel="noopener noreferrer" className="font-mono text-[0.6rem] uppercase underline break-all">{m.fonte_url}</a>
              <div className="font-mono text-[0.58rem] uppercase text-ink-3 mt-1">gerado em {new Date(m.gerado_em).toLocaleString("pt-BR")}</div>
            </div>
          ))}
        </div>
        <Notice tone="info" title="Por que isso precisa de banco">
          Cruzar 91 mil notas de cota com milhares de contratos não cabe numa requisição de página. Esses índices são gerados por jobs em lote a partir
          das fontes oficiais e guardam a URL de origem e a data de coleta. O banco é um <strong>índice derivado</strong> — se ele sumir, o site continua
          funcionando com as APIs ao vivo.
        </Notice>
      </Section>
    </>
  );
}
