import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <div className="stamp stamp--flat mb-4">404 · sem registro</div>
      <h1 className="font-display text-5xl md:text-7xl leading-[0.9]">Esta página não existe</h1>
      <p className="mt-4 text-ink-2">
        O endereço pode ter mudado, o dado pode ter saído da fonte oficial, ou o identificador está errado.
        Nada aqui é inventado — quando não temos o dado, dizemos que não temos.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn">Início</Link>
        <Link href="/politicos" className="btn btn--ghost">Políticos</Link>
        <Link href="/candidatos" className="btn btn--ghost">Candidatos 2026</Link>
        <Link href="/contratos" className="btn btn--ghost">Contratos</Link>
        <Link href="/buscar?q=" className="btn btn--ghost">Buscar</Link>
      </div>
      <p className="mt-8 text-xs text-ink-3">
        Achou um link quebrado dentro do site?{" "}
        <a className="underline" href="https://github.com/steinhauserhzs/monitor-de-gravata/issues/new?template=api-quebrada.yml" target="_blank" rel="noopener noreferrer">Avise em 30 segundos</a>.
      </p>
    </div>
  );
}
