import Link from "next/link";
import type { MotivoFalha } from "@/lib/fetcher";

const TEXTO: Record<MotivoFalha, { selo: string; titulo: string; explica: string }> = {
  bloqueado: {
    selo: "Fonte bloqueou a consulta",
    titulo: "Não conseguimos consultar a fonte oficial agora",
    explica:
      "O órgão limitou consultas automatizadas neste momento (bloqueio de borda ou limite de requisições). O registro pode existir normalmente — só não conseguimos verificar.",
  },
  instavel: {
    selo: "Fonte instável",
    titulo: "A fonte oficial respondeu com erro",
    explica:
      "O sistema do órgão devolveu um erro em vez dos dados. Isso costuma ser temporário. O registro pode existir normalmente — só não conseguimos verificar.",
  },
  timeout: {
    selo: "Fonte não respondeu",
    titulo: "A fonte oficial demorou demais para responder",
    explica:
      "A consulta passou do tempo limite. O registro pode existir normalmente — só não conseguimos verificar agora.",
  },
  "nao-encontrado": {
    selo: "Sem registro",
    titulo: "A fonte oficial não tem esse registro",
    explica: "Consultamos a base oficial e ela respondeu que esse identificador não existe.",
  },
};

/**
 * Página de falha de CONSULTA — não é 404.
 *
 * Regra do projeto: nunca afirmar o que a fonte não garante. "A fonte caiu"
 * é diferente de "isso não existe", e o leitor precisa ver essa diferença.
 */
export function FonteIndisponivel({
  motivo,
  fonte,
  detalhe,
  oQue,
  voltarHref,
  voltarLabel,
  siteOficial,
}: {
  motivo: MotivoFalha;
  fonte: string;
  detalhe?: string | null;
  /** o que se tentou abrir, ex.: "a ficha deste deputado" */
  oQue: string;
  voltarHref: string;
  voltarLabel: string;
  siteOficial?: { href: string; label: string };
}) {
  const t = TEXTO[motivo];
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:py-24">
      <div className="stamp stamp--flat">{t.selo}</div>
      <h1 className="font-display mt-5 text-4xl leading-[0.95] sm:text-5xl md:text-6xl">{t.titulo}</h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-2">
        Tentamos abrir {oQue} consultando <strong>{fonte}</strong>. {t.explica}
      </p>

      <div className="card mt-8 border-l-4 border-marker p-4">
        <div className="font-mono text-[0.65rem] uppercase tracking-[0.16em]">O que isso não significa</div>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">
          Isto <strong>não</strong> é uma afirmação de que o registro não existe, nem qualquer juízo sobre
          quem você procurou. É só o que aconteceu com a consulta.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href={voltarHref} className="btn btn--stamp">
          {voltarLabel}
        </Link>
        <Link href="/buscar" className="btn btn--ghost">
          Buscar outra coisa
        </Link>
        {siteOficial && (
          <a href={siteOficial.href} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
            {siteOficial.label} ↗
          </a>
        )}
      </div>

      <p className="mt-8 font-mono text-[0.62rem] uppercase leading-relaxed tracking-[0.12em] text-ink-3">
        Recarregar a página costuma resolver — consultamos a fonte ao vivo.
      </p>
      {detalhe && (
        <details className="mt-4">
          <summary className="cursor-pointer font-mono text-[0.62rem] uppercase tracking-[0.12em] text-ink-3">
            Detalhe técnico
          </summary>
          <p className="quebra mt-2 font-mono text-[0.68rem] leading-relaxed text-ink-3">{detalhe}</p>
        </details>
      )}
    </div>
  );
}
