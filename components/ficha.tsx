import type { ReactNode } from "react";
import type { Finding } from "@/lib/rules/types";
import { Sev } from "./ui";
import { brl } from "@/lib/format";
import type { Noticia } from "@/lib/noticias";

export function KPI({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "stamp" | "verde" | "ink" }) {
  const c = tone === "stamp" ? "text-stamp" : tone === "verde" ? "text-verde" : "";
  return (
    <div className="card p-4">
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">{label}</div>
      <div className={`font-display text-3xl leading-none mt-2 ${c}`}>{value}</div>
      {hint && <div className="mt-1 text-[0.72rem] text-ink-3 leading-snug">{hint}</div>}
    </div>
  );
}

export function Bars({ rows, max, fmt = brl }: { rows: { label: string; sub?: string; value: number; href?: string }[]; max?: number; fmt?: (n: number) => string }) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => (
        <li key={i}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">
              {r.href ? (
                <a href={r.href} className="underline decoration-stamp underline-offset-2">
                  {r.label}
                </a>
              ) : (
                r.label
              )}
              {r.sub && <span className="ml-2 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">{r.sub}</span>}
            </span>
            <span className="font-mono text-xs whitespace-nowrap">{fmt(r.value)}</span>
          </div>
          <div className="h-2 bg-paper-2 mt-1">
            <div className="h-2 bg-ink" style={{ width: `${Math.max(1, (r.value / m) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Flags({ findings, vazio = "Nenhuma red flag automática acionada com os dados disponíveis." }: { findings: Finding[]; vazio?: string }) {
  if (!findings.length)
    return (
      <div className="card p-4 flex items-center gap-3">
        <span className="stamp stamp--verde stamp--flat">sem sinais</span>
        <span className="text-sm text-ink-2">{vazio}</span>
      </div>
    );
  return (
    <ul className="space-y-2">
      {findings.map((f, i) => (
        <li key={i} className={`card p-4 border-l-4 ${f.severidade === "alta" ? "border-stamp" : f.severidade === "media" ? "border-marker" : "border-ink-3"}`}>
          <div className="flex flex-wrap items-center gap-2">
            <Sev level={f.severidade} />
            <span className="font-semibold text-sm">{f.nome}</span>
            <a href={`/radar#${f.regra}`} className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3 underline underline-offset-2">
              regra {f.regra}
            </a>
          </div>
          <p className="mt-1 text-sm text-ink-2">{f.evidencia}</p>
          <div className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">fonte: {f.fonte}</div>
        </li>
      ))}
    </ul>
  );
}

export type TLItem = { data?: string; fim?: string; titulo: string; detalhe?: string; tipo: string; fonte: string; url?: string };

export function Timeline({ items }: { items: TLItem[] }) {
  if (!items.length) return <p className="text-sm text-ink-3">Sem eventos de linha do tempo nas fontes consultadas.</p>;
  return (
    <ol className="relative border-l-2 border-ink ml-2 pl-6 space-y-5">
      {items.map((it, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[1.95rem] top-1 h-3 w-3 bg-stamp border-2 border-paper" />
          <div className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-3">
            {it.data ?? "?"}
            {it.fim ? ` → ${it.fim}` : it.data ? " → atual" : ""} · {it.tipo}
          </div>
          <div className="text-sm font-semibold">{it.titulo}</div>
          {it.detalhe && <div className="text-xs text-ink-2">{it.detalhe}</div>}
          <div className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-3">
            {it.url ? (
              <a href={it.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                {it.fonte}
              </a>
            ) : (
              it.fonte
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function NoticiasList({ noticias, query }: { noticias: Noticia[]; query: string }) {
  return (
    <div>
      {!noticias.length && <p className="text-sm text-ink-3">Nenhuma manchete recente encontrada para “{query}”.</p>}
      <ul className="divide-y divide-linha">
        {noticias.map((n, i) => (
          <li key={i} className="py-2.5">
            <a href={n.url} target="_blank" rel="noopener noreferrer nofollow" className="text-sm hover:underline decoration-stamp underline-offset-2">
              {n.titulo}
            </a>
            <div className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">
              {n.veiculo} · {n.data ? new Date(n.data).toLocaleDateString("pt-BR") : ""}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.68rem] text-ink-3">
        Manchetes agregadas automaticamente por busca de nome (podem incluir homônimos). Só título e link — o conteúdo é do veículo. Fonte: Google Notícias RSS.
      </p>
    </div>
  );
}

export function Panel({ title, kicker, children, id, right }: { title: string; kicker?: string; children: ReactNode; id?: string; right?: ReactNode }) {
  return (
    <section id={id} className="card p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-linha pb-2">
        <div className="flex items-baseline gap-3">
          {kicker && <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-stamp">{kicker}</span>}
          <h2 className="font-display text-xl leading-none">{title}</h2>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}
