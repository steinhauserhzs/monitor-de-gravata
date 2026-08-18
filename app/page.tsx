import Link from "next/link";
import { Gravata } from "@/components/Logo";
import { loadApis, loadRedFlags, loadCasos } from "@/lib/data";
import { implementedRuleIds } from "@/lib/rules";
import { Section } from "@/components/ui";
import { MapaBrasil } from "@/components/MapaBrasil";

export const revalidate = 3600;

const MODULOS = [
  {
    href: "/politicos",
    n: "01",
    titulo: "Ficha 360 do político",
    texto: "Deputados e senadores: gastos de cota nota a nota, presença, votações, produtividade, comissões, linha do tempo, notícias e red flags.",
    tag: "Câmara · Senado · Wikidata",
  },
  {
    href: "/candidatos",
    n: "02",
    titulo: "Manual do Candidato 2026",
    texto: "Todo candidato registrado no TSE por UF e cargo: bens declarados, evolução patrimonial, doadores, fornecedores de campanha, processos, certidões.",
    tag: "TSE DivulgaCand",
  },
  {
    href: "/contratos",
    n: "03",
    titulo: "Radar de contratos",
    texto: "Contratos, dispensas e licitações de União, estados e 5.570 municípios publicados no PNCP, com red flags calculadas em tempo real.",
    tag: "PNCP · Receita · CGU",
  },
  {
    href: "/empresas",
    n: "04",
    titulo: "Ficha da empresa",
    texto: "CNPJ, sócios, idade, capital, situação cadastral, contratos públicos que venceu e sanções (CEIS/CNEP).",
    tag: "Receita Federal · PNCP · CGU",
  },
  {
    href: "/precos",
    n: "07",
    titulo: "Comparador de preços",
    texto: "Esse notebook de R$ 10 mil custa R$ 4 mil em outros órgãos? Compare com os preços realmente pagos (Compras.gov.br) e receba a classificação de sobrepreço.",
    tag: "Compras.gov.br · CATMAT",
  },
  {
    href: "/radar",
    n: "05",
    titulo: "Motor de red flags",
    texto: "Regras públicas, versionadas e auditáveis. Cada sinal tem fórmula, fonte e severidade. A comunidade propõe, revisa e implementa.",
    tag: "OCP · Serenata · OPS · TCU · CGU",
  },
  {
    href: "/casos",
    n: "06",
    titulo: "Casos da comunidade",
    texto: "Hipóteses documentadas com fontes primárias, revisão por pares, ciclo de vida e direito de resposta. Tudo no git.",
    tag: "GitHub PRs · revisão dupla",
  },
];

export default function Home() {
  const apis = loadApis();
  const flags = loadRedFlags();
  const casos = loadCasos();
  const impl = implementedRuleIds();
  const nImpl = flags.filter((f) => impl.has(f.id)).length;

  return (
    <>
      {/* HERO */}
      <section className="ink-block relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-16 opacity-[0.07] rotate-12">
          <Gravata className="h-[38rem] w-[19rem]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="flex flex-wrap items-center gap-3 rise">
            <span className="stamp stamp--flat">Open source</span>
            <span className="stamp stamp--flat">Sem partido</span>
            <span className="stamp stamp--flat">Fontes primárias</span>
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-paper/60">Eleições em 04/10/2026</span>
          </div>
          <h1 className="font-display mt-6 text-[3.2rem] leading-[0.9] sm:text-7xl md:text-[7rem] rise rise-1">
            MONITOR
            <br />
            DE GRAVATA
          </h1>
          <p className="font-serif italic text-3xl md:text-5xl text-marker mt-3 rise rise-2">o pesadelo de Brasília</p>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-paper/85 rise rise-3">
            Um cérebro vivo, alimentado pela comunidade, que liga <span className="marker text-ink">contratos</span>,{" "}
            <span className="marker text-ink">políticos</span>, <span className="marker text-ink">empresas</span> e{" "}
            <span className="marker text-ink">campanhas</span> usando só dados públicos — e aponta, com regra e fonte, o que
            merece um olhar humano.
          </p>
          <form action="/buscar" className="mt-10 flex max-w-2xl flex-col gap-2 sm:flex-row rise rise-4">
            <input
              name="q"
              className="input !border-paper !bg-paper text-ink"
              placeholder="Nome de político, candidato, CNPJ ou objeto de contrato…"
              aria-label="Buscar"
            />
            <button className="btn btn--stamp whitespace-nowrap" type="submit">
              Investigar →
            </button>
          </form>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-paper/60 rise rise-4">
            <span>{apis.length} APIs catalogadas</span>
            <span>{flags.length} red flags · {nImpl} automatizadas</span>
            <span>{casos.length} caso(s) na base</span>
          </div>
        </div>
      </section>

      {/* MAPA */}
      <Section kicker="Manual do candidato" title="Quem quer o seu voto em 2026">
        <div className="card p-6 md:p-8">
          <MapaBrasil ano={2026} cargo={6} />
        </div>
      </Section>

      {/* MANIFESTO CURTO */}
      <Section>
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
          <div className="prose-mg">
            <h2 className="!mt-0">Por que existe</h2>
            <p>
              O Brasil publica mais dado público do que qualquer cidadão consegue ler: milhões de notas da cota parlamentar,
              contratos de 5.570 prefeituras no PNCP, bens e doações de cada candidato no TSE, processos no DataJud. O problema
              nunca foi falta de dado. É que ele está espalhado, sem cruzamento e sem gente olhando.
            </p>
            <p>
              O Monitor de Gravata é a camada que <strong>cruza</strong> e <strong>convida</strong>: regras abertas calculam sinais
              (red flags), a comunidade documenta hipóteses com fonte, revisa em par e mantém tudo em um repositório público —
              onde cada mudança tem autor, data e motivo.
            </p>
            <blockquote>
              Nada aqui é acusação. Todo dado tem fonte oficial e data. Toda hipótese é marcada como hipótese. Ninguém é culpado
              antes do trânsito em julgado — e mesmo assim, o que fazemos é apontar onde vale a pena perguntar.
            </blockquote>
          </div>
          <div className="card--dark card p-6 self-start">
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-marker">Como o cérebro vive</div>
            <ol className="mt-4 space-y-4 text-sm">
              {[
                ["Dado oficial entra automático", "APIs públicas consultadas ao vivo (Câmara, Senado, TSE, PNCP, Receita, CGU)."],
                ["Regras calculam sinais", "Red flags como código, com fórmula pública e severidade. Nada de opinião."],
                ["Comunidade documenta", "Casos com fontes primárias, abertos por PR, revisados por 2 pessoas."],
                ["Quem é citado responde", "Direito de resposta em 72h, registrado publicamente no mesmo caso."],
                ["Tudo fica no git", "Histórico imutável: quem mudou o quê, quando e por quê. Backups espelhados."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="font-display text-2xl text-marker leading-none">{i + 1}</span>
                  <div>
                    <div className="font-semibold">{t}</div>
                    <div className="text-paper/70">{d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {/* MÓDULOS */}
      <Section kicker="Módulos" title="O que já dá para fazer hoje">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MODULOS.map((m) => (
            <Link key={m.href} href={m.href} className="card group p-6 hover:-translate-y-0.5 transition-transform">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-4xl text-stamp">{m.n}</span>
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">{m.tag}</span>
              </div>
              <h3 className="font-display text-2xl mt-3 leading-none group-hover:underline decoration-stamp underline-offset-4">
                {m.titulo}
              </h3>
              <p className="mt-3 text-sm text-ink-2 leading-relaxed">{m.texto}</p>
              <div className="mt-4 font-mono text-[0.65rem] uppercase tracking-[0.16em]">Abrir →</div>
            </Link>
          ))}
        </div>
      </Section>

      {/* CHAMADA CONTRIBUIR */}
      <Section>
        <div className="border-2 border-ink p-6 md:p-10 grid gap-8 md:grid-cols-[1fr_auto] items-center ruled">
          <div>
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-stamp">Você é o monitor</div>
            <h2 className="font-display text-3xl md:text-5xl leading-[0.95] mt-2">
              Dev, jornalista, contador, servidor, estudante, cidadão com raiva boa.
            </h2>
            <p className="mt-4 max-w-2xl text-ink-2">
              Adicione uma API que falta, proponha uma red flag, escreva um caso com fontes, audite uma regra, traduza um
              edital em português claro. Tudo por pull request — sem cadastro, sem dono, sem anúncio.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/contribuir" className="btn">
              Como contribuir
            </Link>
            <a
              href="https://github.com/steinhauserhzs/monitor-de-gravata"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost"
            >
              Repositório ↗
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
