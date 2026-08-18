import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Crumbs, Notice } from "@/components/ui";
import { loadCaso, loadCasos } from "@/lib/data";

export const revalidate = 600;

export function generateStaticParams() {
  return loadCasos().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/casos/[slug]">) {
  const { slug } = await params;
  const c = loadCaso(slug);
  return { title: c ? c.titulo : "Caso" };
}

export default async function CasoPage({ params }: PageProps<"/casos/[slug]">) {
  const { slug } = await params;
  const c = loadCaso(slug);
  if (!c) notFound();
  return (
    <>
      <Crumbs items={[{ href: "/casos", label: "Casos" }, { label: c.titulo }]} />
      <div className="mx-auto max-w-4xl px-4 pt-6 pb-8 border-b-2 border-ink">
        <div className="flex flex-wrap items-center gap-2">
          <span className="stamp stamp--flat stamp--azul">{c.status}</span>
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-3">{c.tipo}{c.uf ? ` · ${c.uf}` : ""} · criado {c.criado_em}{c.atualizado_em ? ` · atualizado ${c.atualizado_em}` : ""}</span>
        </div>
        <h1 className="font-display text-3xl md:text-5xl leading-[0.95] mt-2 rise">{c.titulo}</h1>
        <p className="mt-3 text-ink-2">{c.resumo}</p>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-8 grid gap-8 md:grid-cols-[1fr_16rem]">
        <article className="prose-mg">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.corpo}</ReactMarkdown>
        </article>
        <aside className="space-y-4">
          <div className="card p-4">
            <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-2">Fontes ({c.fontes.length})</div>
            <ul className="text-xs space-y-2">
              {c.fontes.map((f, i) => <li key={i}><a href={f.url} target="_blank" rel="noopener noreferrer" className="underline decoration-stamp underline-offset-2">{f.titulo || f.url}</a>{f.coletado_em && <div className="text-ink-3">coletado {f.coletado_em}</div>}</li>)}
            </ul>
          </div>
          {c.regras?.length ? (
            <div className="card p-4">
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-2">Red flags citadas</div>
              <ul className="text-xs space-y-1">{c.regras.map((r) => <li key={r}><Link href={`/radar#${r}`} className="underline">{r}</Link></li>)}</ul>
            </div>
          ) : null}
          <div className="card p-4 text-xs">
            <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-2">Autoria e revisão</div>
            <div>Autores: {c.autores?.join(", ") || "—"}</div>
            <div>Revisores: {c.revisores?.join(", ") || "—"}</div>
            <a className="underline block mt-2" href={`https://github.com/steinhauserhzs/monitor-de-gravata/commits/main/data/casos/${c.slug}.md`} target="_blank" rel="noopener noreferrer">histórico no git ↗</a>
            <a className="underline block mt-1" href={`https://github.com/steinhauserhzs/monitor-de-gravata/edit/main/data/casos/${c.slug}.md`} target="_blank" rel="noopener noreferrer">propor correção ↗</a>
          </div>
          <Notice tone="warn" title="Direito de resposta">Citado neste caso? <Link href="/sobre#resposta" className="underline">Responda</Link> — a resposta é anexada aqui em até 72h.</Notice>
        </aside>
      </div>
    </>
  );
}
