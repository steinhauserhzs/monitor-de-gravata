export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12" aria-busy="true" aria-live="polite">
      <div className="stamp stamp--ink stamp--flat mb-4">consultando fontes oficiais…</div>
      <div className="h-10 w-2/3 bg-paper-2 animate-pulse mb-4" />
      <div className="h-4 w-1/2 bg-paper-2 animate-pulse mb-8" />
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card p-4 h-24 animate-pulse" />
        ))}
      </div>
      <p className="mt-6 text-xs text-ink-3">Câmara, Senado, TSE, PNCP, Receita e Compras.gov.br são consultados ao vivo — a primeira abertura de uma ficha pode levar alguns segundos; as seguintes vêm do cache.</p>
    </div>
  );
}
