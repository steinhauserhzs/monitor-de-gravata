import Link from "next/link";
import { Wordmark } from "./Logo";

const NAV = [
  { href: "/politicos", label: "Políticos" },
  { href: "/candidatos", label: "Candidatos 2026" },
  { href: "/contratos", label: "Contratos" },
  { href: "/empresas", label: "Empresas" },
  { href: "/precos", label: "Preços" },
  { href: "/cruzamentos", label: "Cruzamentos" },
  { href: "/radar", label: "Red flags" },
  { href: "/casos", label: "Casos" },
  { href: "/apis", label: "APIs" },
  { href: "/contribuir", label: "Contribuir" },
];

export function Header() {
  return (
    <header className="ink-block sticky top-0 z-40 border-b border-paper/15">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 hover:opacity-90" aria-label="Monitor de Gravata — início">
          <Wordmark compact />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="shrink-0 whitespace-nowrap font-mono text-[0.68rem] uppercase tracking-[0.14em] px-2.5 py-2 hover:bg-paper hover:text-ink transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href="https://github.com/steinhauserhzs/monitor-de-gravata"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--ghost !py-2 !px-3 !text-[0.65rem]"
          >
            GitHub ↗
          </a>
        </div>
      </div>
      <nav
        className="flex gap-1 overflow-x-auto overscroll-x-contain px-3 pb-2 lg:hidden [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
        aria-label="Principal (mobile)"
      >
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="shrink-0 whitespace-nowrap font-mono text-[0.62rem] uppercase tracking-[0.14em] px-3 py-2 border border-paper/30"
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
