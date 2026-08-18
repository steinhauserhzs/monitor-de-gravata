import Link from "next/link";
import { PageHead, Section, Sev, Notice } from "@/components/ui";
import { loadRedFlags } from "@/lib/data";
import { implementedRuleIds } from "@/lib/rules";

export const revalidate = 3600;
export const metadata = { title: "Motor de red flags" };

const CATS: Record<string, string> = {
  contratacao: "Contratação pública",
  parlamentar: "Parlamentar",
  eleitoral: "Eleitoral",
  empresa: "Empresa",
  servidor: "Servidor",
  obra: "Obra",
  municipal: "Municipal",
};

export default function Radar() {
  const flags = loadRedFlags();
  const impl = implementedRuleIds();
  const porCat = new Map<string, typeof flags>();
  for (const f of flags) porCat.set(f.categoria, [...(porCat.get(f.categoria) ?? []), f]);
  const nImpl = flags.filter((f) => impl.has(f.id)).length;

  return (
    <>
      <PageHead
        kicker="Módulo 05"
        title="Motor de red flags"
        stamp={`${nImpl}/${flags.length} automatizadas`}
        stampTone="azul"
        lead="Uma red flag é uma regra pública, versionada e auditável: dado de entrada, fórmula, severidade, fonte metodológica. O motor roda as regras implementadas em código sobre dados oficiais ao vivo. As não implementadas são o backlog aberto da comunidade."
        right={
          <div className="flex flex-col gap-2">
            <a className="btn" href="https://github.com/steinhauserhzs/monitor-de-gravata/issues/new?template=red-flag.yml" target="_blank" rel="noopener noreferrer">Propor uma regra</a>
            <a className="btn btn--ghost" href="https://github.com/steinhauserhzs/monitor-de-gravata/blob/main/lib/rules/index.ts" target="_blank" rel="noopener noreferrer">Ver o código das regras ↗</a>
          </div>
        }
      />
      <Section>
        <div className="grid gap-4 md:grid-cols-3">
          <Notice tone="info" title="Princípio 1 — fato, não juízo">Toda regra devolve uma frase com número e fonte ("X recebeu 62% da cota"). Nunca "X é corrupto". Isso é design jurídico, não estilo.</Notice>
          <Notice tone="info" title="Princípio 2 — mesma régua para todos">A regra roda igual para qualquer partido, órgão ou empresa. Não há lista de exceções por nome. Quem quiser mudar um limiar, abre PR e justifica.</Notice>
          <Notice tone="info" title="Princípio 3 — sinal exige gente">Red flag alta significa "olhe agora", não "culpado". A conclusão vem de um humano, no <Link href="/casos" className="underline">caso</Link>, com edital, ata e direito de resposta.</Notice>
        </div>
      </Section>
      {[...porCat.entries()].map(([cat, list]) => (
        <Section key={cat} kicker={CATS[cat] ?? cat} title={`${list.length} regra(s)`}>
          <div className="grid gap-3 md:grid-cols-2">
            {list.map((f) => (
              <article key={f.id} id={f.id} className={`card p-4 border-l-4 ${f.severidade === "alta" ? "border-stamp" : f.severidade === "media" ? "border-marker" : "border-ink-3"} scroll-mt-24`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Sev level={f.severidade} />
                  {impl.has(f.id) ? <span className="stamp stamp--flat stamp--verde">automatizada</span> : <span className="stamp stamp--flat stamp--ink">backlog</span>}
                  <span className="font-mono text-[0.6rem] text-ink-3">{f.id}</span>
                </div>
                <h3 className="font-display text-xl mt-2 leading-tight">{f.nome}</h3>
                <p className="mt-1 text-sm text-ink-2">{f.descricao}</p>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
                  <dt className="font-mono uppercase tracking-[0.12em] text-ink-3">Lógica</dt><dd className="font-mono">{f.logica ?? "—"}</dd>
                  <dt className="font-mono uppercase tracking-[0.12em] text-ink-3">Dados</dt><dd>{(f.dados_necessarios ?? []).join(", ") || "—"}</dd>
                  <dt className="font-mono uppercase tracking-[0.12em] text-ink-3">APIs</dt><dd>{(f.apis ?? []).map((a) => <Link key={a} href={`/apis#${a}`} className="underline mr-2">{a}</Link>)}</dd>
                  <dt className="font-mono uppercase tracking-[0.12em] text-ink-3">Fonte</dt><dd>{f.fonte}</dd>
                </dl>
              </article>
            ))}
          </div>
        </Section>
      ))}
    </>
  );
}
