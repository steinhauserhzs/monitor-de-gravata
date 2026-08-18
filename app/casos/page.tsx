import Link from "next/link";
import { PageHead, Section, Notice, Empty } from "@/components/ui";
import { loadCasos } from "@/lib/data";

export const revalidate = 600;
export const metadata = { title: "Casos da comunidade" };

const STATUS: Record<string, { label: string; tone: string }> = {
  rascunho: { label: "rascunho", tone: "stamp--ink" },
  "em-revisao": { label: "em revisão", tone: "stamp--azul" },
  publicado: { label: "publicado", tone: "stamp--verde" },
  contestado: { label: "contestado", tone: "" },
  corrigido: { label: "corrigido", tone: "stamp--azul" },
  arquivado: { label: "arquivado", tone: "stamp--ink" },
};

export default function Casos() {
  const casos = loadCasos();
  return (
    <>
      <PageHead
        kicker="Módulo 06"
        title="Casos da comunidade"
        stamp={`${casos.length} na base`}
        stampTone="azul"
        lead="Um caso é uma hipótese documentada com fontes primárias, aberta por pull request, revisada por duas pessoas e com direito de resposta registrado no próprio arquivo. Nada aqui é acusação; é o começo de uma pergunta com método."
        right={
          <div className="flex flex-col gap-2">
            <a className="btn" href="https://github.com/steinhauserhzs/monitor-de-gravata/issues/new?template=caso.yml" target="_blank" rel="noopener noreferrer">Abrir um caso (issue)</a>
            <a className="btn btn--ghost" href="https://github.com/steinhauserhzs/monitor-de-gravata/tree/main/data/casos" target="_blank" rel="noopener noreferrer">Ver no repositório ↗</a>
          </div>
        }
      />
      <Section>
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div>
            {!casos.length && <Empty>Ainda não há casos. Seja o primeiro — comece pelo modelo.</Empty>}
            <ul className="space-y-3">
              {casos.map((c) => (
                <li key={c.slug} className="card p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`stamp stamp--flat ${STATUS[c.status]?.tone ?? ""}`}>{STATUS[c.status]?.label ?? c.status}</span>
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">{c.tipo}{c.uf ? ` · ${c.uf}` : ""} · {c.criado_em}</span>
                  </div>
                  <h2 className="font-display text-2xl mt-2 leading-tight"><Link href={`/casos/${c.slug}`} className="hover:underline decoration-stamp underline-offset-4">{c.titulo}</Link></h2>
                  <p className="mt-2 text-sm text-ink-2">{c.resumo}</p>
                  <div className="mt-2 flex flex-wrap gap-2 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">
                    <span>{c.fontes.length} fonte(s)</span>
                    {c.regras?.map((r) => <Link key={r} href={`/radar#${r}`} className="underline">{r}</Link>)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <Notice tone="info" title="Ciclo de vida">
              <ol className="list-decimal pl-4 space-y-1">
                <li><strong>rascunho</strong> — arquivo em <code>data/casos/</code> num PR</li>
                <li><strong>em revisão</strong> — 2 revisores checam cada fonte</li>
                <li><strong>publicado</strong> — entra no site; citados são notificados</li>
                <li><strong>contestado</strong> — resposta anexada em até 72h, visível</li>
                <li><strong>corrigido / arquivado</strong> — com histórico no git</li>
              </ol>
            </Notice>
            <Notice tone="warn" title="O que nunca entra">Dado vazado ou não-público, CPF completo, endereço residencial, familiares que não sejam agentes públicos, juízo de valor, adjetivos. Ver <Link href="/sobre#editorial" className="underline">política editorial</Link>.</Notice>
            <Notice tone="ok" title="Formato">Frontmatter YAML (título, status, tipo, fontes com URL e data de coleta, regras acionadas) + corpo em Markdown com as 5 seções: fato, cruzamento, red flags, o que não sabemos, próximo passo.</Notice>
          </div>
        </div>
      </Section>
    </>
  );
}
