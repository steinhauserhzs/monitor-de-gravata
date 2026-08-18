/** Gravata (tie) — símbolo do projeto. */
export function Gravata({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 128" className={className} aria-hidden="true" fill="currentColor">
      {/* nó */}
      <path d="M22 4h20l6 14-16 8-16-8z" />
      {/* corpo */}
      <path d="M18 26h28l8 66-22 32L10 92z" />
      {/* brilho */}
      <path d="M26 30h6l-4 60-6-8z" fill="rgba(255,255,255,0.18)" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Gravata className={compact ? "h-6 w-3 text-stamp" : "h-9 w-5 text-stamp"} />
      <span className="font-display leading-none tracking-wide">
        <span className={compact ? "text-lg" : "text-2xl"}>MONITOR DE GRAVATA</span>
      </span>
    </span>
  );
}
