import Link from "next/link";
import type { ReactNode } from "react";

export function PageHead({
  kicker,
  title,
  lead,
  stamp,
  stampTone,
  right,
}: {
  kicker?: string;
  title: ReactNode;
  lead?: ReactNode;
  stamp?: string;
  stampTone?: "stamp" | "verde" | "azul" | "ink";
  right?: ReactNode;
}) {
  return (
    <div className="border-b-2 border-ink">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-10 pb-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          {kicker && (
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-3 mb-2">{kicker}</div>
          )}
          <h1 className="font-display text-4xl leading-[0.95] md:text-6xl rise">
            {title}
            {stamp && (
              <span className={`stamp ml-3 align-middle stamp-in ${stampTone ? `stamp--${stampTone}` : ""}`}>
                {stamp}
              </span>
            )}
          </h1>
          {lead && <p className="mt-4 max-w-2xl text-base text-ink-2 leading-relaxed rise rise-1">{lead}</p>}
        </div>
        {right && <div className="rise rise-2">{right}</div>}
      </div>
    </div>
  );
}

export function Section({
  title,
  kicker,
  children,
  id,
  className = "",
}: {
  title?: ReactNode;
  kicker?: string;
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={`mx-auto max-w-7xl px-4 py-10 ${className}`}>
      {(title || kicker) && (
        <div className="mb-6 flex items-baseline gap-4">
          {kicker && <span className="tab">{kicker}</span>}
          {title && <h2 className="font-display text-2xl md:text-3xl leading-none">{title}</h2>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-3">{label}</div>
      <div className="font-display text-3xl leading-none mt-2">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-3">{hint}</div>}
    </div>
  );
}

export function Sev({ level, children }: { level: "alta" | "media" | "baixa" | "ok"; children?: ReactNode }) {
  return <span className={`sev sev--${level}`}>{children ?? level}</span>;
}

export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warn" | "error" | "ok";
  title?: string;
  children: ReactNode;
}) {
  const color =
    tone === "error" ? "border-stamp" : tone === "warn" ? "border-marker" : tone === "ok" ? "border-verde" : "border-azul";
  return (
    <div className={`card border-l-4 ${color} p-4 text-sm`}>
      {title && <div className="font-mono text-[0.65rem] uppercase tracking-[0.16em] mb-1">{title}</div>}
      <div className="text-ink-2 leading-relaxed">{children}</div>
    </div>
  );
}

export function Source({ url, label, at }: { url: string; label: string; at?: string }) {
  return (
    <div className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-ink-3">
      Fonte:{" "}
      <a href={url} target="_blank" rel="noopener noreferrer" className="underline decoration-stamp underline-offset-2">
        {label}
      </a>
      {at && <> · coletado {at}</>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="card p-8 text-center">
      <div className="stamp stamp--ink stamp--flat mb-3">sem dados</div>
      <p className="text-sm text-ink-2">{children}</p>
    </div>
  );
}

export function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Você está em" className="mx-auto max-w-7xl px-4 pt-6 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-3">
      {items.map((it, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-2">/</span>}
          {it.href ? (
            <Link href={it.href} className="hover:underline">
              {it.label}
            </Link>
          ) : (
            <span className="text-ink">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
