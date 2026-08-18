import Link from "next/link";
import { Gravata } from "@/components/Logo";
import { loadApis, loadRedFlags, loadCasos } from "@/lib/data";
import { implementedRuleIds } from "@/lib/rules";
import { Section } from "@/components/ui";
import { MapaBrasil } from "@/components/MapaBrasil";
import { loadPDMs, loadServicos } from "@/lib/precos";
import { loadEleitos } from "@/lib/eleitos";

export const revalidate = 3600;

const MODULOS = [
  {
    href: "/politicos",
    n: "01",
    titulo: "Quem decide seu dinheiro",
    texto: "Do Planalto ao vereador da sua rua. Gastos de verba pública nota a nota, presença, como votou, o que propôs e com quem se relaciona.",
    tag: "Câmara · Senado · TSE",
    cta: "Ver quem representa você",
  },
  {
    href: "/candidatos",
    n: "02",
    titulo: "Antes de votar, confira",
    texto: "Cada candidato de 2026: patrimônio declarado eleição após eleição, quem bancou a campanha, processos, e o que fez quando já teve poder.",
    tag: "TSE DivulgaCand",
    cta: "Abrir o manual do candidato",
  },
  {
    href: "/contratos",
    n: "03",
    titulo: "Para onde o dinheiro vai",
    texto: "Contratos, dispensas e licitações da União, dos estados e dos 5.570 municípios — com sinais objetivos de risco calculados na hora.",
    tag: "PNCP · Receita · CGU",
    cta: "Abrir o radar",
  },
  {
    href: "/precos",
    n: "04",
    titulo: "Pagaram caro?",
    texto: "Compare o preço de qualquer compra pública com o que outros órgãos pagaram pelo mesmo item, na mesma quantidade. Material e serviço.",
    tag: "Compras.gov.br",
    cta: "Comparar preços",
  },
  {
    href: "/empresas",
    n: "05",
    titulo: "Quem recebe",
    texto: "Digite um CNPJ: sócios, idade, capital, contratos que venceu, sanções — e quanto essa empresa já recebeu de cota parlamentar.",
    tag: "Receita · PNCP · CGU",
    cta: "Investigar um CNPJ",
  },
  {
    href: "/radar",
    n: "06",
    titulo: "As regras do jogo",
    texto: "Cada sinal de alerta é uma regra pública, com fórmula, fonte e severidade. Você pode ler, contestar e propor a sua.",
    tag: "OCP · Serenata · TCU · CGU",
    cta: "Ver as regras",
  },
];

const FATOS = [
  "5.570 municípios publicam contratos no mesmo lugar desde 2024 — quase ninguém lê",
  "Cada nota da cota parlamentar traz o CNPJ de quem recebeu",
  "O patrimônio declarado de todo candidato é público",
  "O preço que cada órgão pagou por um item está publicado — dá para comparar",
  "Empresa punida não pode contratar, e a lista é pública",
  "Emenda parlamentar tem autor, destino e valor pago",
  "Quem fiscaliza um contrato de R$ 50 mil na sua cidade? Talvez ninguém",
];

export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const cargoMapa = Number(Array.isArray(sp.cargo) ? sp.cargo[0] : sp.cargo) || 6;
  const apis = loadApis();
  const flags = loadRedFlags();
  const casos = loadCasos();
  const impl = implementedRuleIds();
  const nImpl = flags.filter((f) => impl.has(f.id)).length;
  const itens = loadPDMs().length + loadServicos().length;
  const eleitos = loadEleitos()?.eleitos.length ?? 0;

  return (
    <>
      {/* HERO */}
      <section className="ink-block vivo relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-16 opacity-[0.07] rotate-12">
          <Gravata className="h-[38rem] w-[19rem]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-16 md:pt-24 md:pb-20">
          <div className="flex flex-wrap items-center gap-3 rise">
            <span className="stamp stamp--flat">Open source</span>
            <span className="stamp stamp--flat">Sem partido</span>
            <span className="stamp stamp--flat">Só fonte oficial</span>
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-paper/60">Eleições em 04/10/2026</span>
          </div>
          <h1 className="font-display mt-6 text-[3.2rem] leading-[0.9] sm:text-7xl md:text-[7rem] rise rise-1">
            MONITOR
            <br />
            DE GRAVATA
          </h1>
          <p className="font-serif italic text-3xl md:text-5xl text-marker mt-3 rise rise-2">o pesadelo de Brasília</p>

          <p className="mt-8 max-w-3xl text-lg md:text-xl leading-relaxed text-paper/90 rise rise-3">
            O dinheiro é seu. As contas são públicas. <span className="marker-anim text-ink">O que falta é gente olhando.</span>
            <br className="hidden md:block" />
            Aqui você abre a ficha de quem te representa, vê para onde o dinheiro foi e confere o que pagaram — em minutos, sem ser especialista.
          </p>

          <form action="/buscar" className="mt-10 flex max-w-2xl flex-col gap-2 sm:flex-row rise rise-4">
            <input name="q" className="input !border-paper !bg-paper text-ink" placeholder="Um nome, um número de urna, um CNPJ…" aria-label="Buscar" />
            <button className="btn btn--stamp whitespace-nowrap" type="submit">Começar →</button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 rise rise-4">
            {[["/politicos", "quem me representa"], ["/candidatos", "candidatos 2026"], ["/precos", "pagaram caro?"], ["/contratos", "contratos de hoje"]].map(([h, t]) => (
              <Link key={h} href={h} className="font-mono text-[0.62rem] uppercase tracking-[0.14em] px-3 py-1.5 border border-paper/40 hover:bg-paper hover:text-ink transition-colors">
                {t}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-paper/15 py-2 overflow-hidden">
          <div className="ticker gap-8 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-paper/60">
            {[...FATOS, ...FATOS].map((f, i) => (
              <span key={i} className="whitespace-nowrap"><span className="text-stamp">▸</span> {f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* NÚMEROS */}
      <Section>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-5 cascata">
          {[
            [String(apis.length), "fontes públicas conectadas"],
            [eleitos.toLocaleString("pt-BR"), "eleitos com ficha aberta"],
            [itens.toLocaleString("pt-BR"), "itens de compra comparáveis"],
            [`${nImpl}/${flags.length}`, "sinais de risco automatizados"],
            [String(casos.length), "casos documentados pela comunidade"],
          ].map(([v, l]) => (
            <div key={l} className="card card--hover p-4">
              <div className="font-display text-3xl md:text-4xl leading-none pulso">{v}</div>
              <div className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-3">{l}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* MAPA */}
      <Section id="mapa" kicker="Comece pelo seu estado" title="Quem quer o seu voto em 2026">
        <div className="card p-6 md:p-8">
          <MapaBrasil ano={2026} cargo={cargoMapa} />
        </div>
      </Section>

      {/* PROVOCAÇÃO */}
      <Section>
        <div className="grid gap-8 md:grid-cols-[1.15fr_1fr]">
          <div className="prose-mg">
            <h2 className="!mt-0">Você paga a conta. Já leu a fatura?</h2>
            <p>
              Todo mês, uma parte do que você ganha vira imposto — e vira contrato, obra, merenda, remédio, diária de viagem,
              aluguel de escritório político. Tudo isso é publicado. O problema é que está espalhado em dezenas de sistemas,
              num formato que ninguém tem tempo de ler.
            </p>
            <p>
              <strong>Indignação sem dado vira briga de torcida.</strong> Dado sem gente olhando vira arquivo morto.
              O Monitor junta as duas pontas: pega o que já é público, cruza, calcula sinais objetivos e coloca na sua mão
              com o link da fonte — para você conferir, discordar e cobrar.
            </p>
            <blockquote>
              Não dizemos quem é honesto ou corrupto. Dizemos o que está registrado, quando foi registrado e onde conferir.
              A conclusão é sua — e a pergunta que você faz depois é o que muda alguma coisa.
            </blockquote>
            <p className="text-sm text-ink-3">
              Sem partido, sem dono, sem anúncio, sem dinheiro de campanha. Se um dia isso mudar, estará escrito aqui.
            </p>
          </div>

          <div className="card--dark card p-6 self-start">
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-marker">Como funciona por dentro</div>
            <ol className="mt-4 space-y-4 text-sm cascata">
              {[
                ["O dado oficial entra sozinho", "APIs de Câmara, Senado, TSE, PNCP, Receita, CGU e Compras.gov.br, consultadas na hora."],
                ["As regras calculam os sinais", "Fórmula pública, severidade e fonte. Nenhuma exceção por nome ou partido."],
                ["Você e a comunidade documentam", "Casos com fonte primária, revisados por duas pessoas antes de publicar."],
                ["Quem é citado responde", "Direito de resposta em 72h, no mesmo lugar, com o mesmo destaque."],
                ["Nada some", "Tudo versionado no git: quem mudou, quando e por quê."],
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
      <Section kicker="Por onde começar" title="Escolha o que quer descobrir hoje">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 cascata">
          {MODULOS.map((m) => (
            <Link key={m.href} href={m.href} className="card card--hover group p-6 flex flex-col">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-4xl text-stamp">{m.n}</span>
                <span className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-ink-3">{m.tag}</span>
              </div>
              <h3 className="font-display text-2xl mt-3 leading-none group-hover:underline decoration-stamp underline-offset-4">{m.titulo}</h3>
              <p className="mt-3 text-sm text-ink-2 leading-relaxed flex-1">{m.texto}</p>
              <div className="mt-4 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-stamp">{m.cta} →</div>
            </Link>
          ))}
        </div>
      </Section>

      {/* CHAMADA */}
      <Section>
        <div className="border-2 border-ink p-6 md:p-10 grid gap-8 md:grid-cols-[1fr_auto] items-center ruled">
          <div>
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-stamp">Ninguém vai fazer isso por você</div>
            <h2 className="font-display text-3xl md:text-5xl leading-[0.95] mt-2">
              Uma hora do seu mês pode virar a fiscalização que a sua cidade nunca teve.
            </h2>
            <p className="mt-4 max-w-2xl text-ink-2">
              Dá para ajudar sem saber programar: conferir um contrato da sua cidade, conectar a fonte de dados da sua câmara municipal,
              propor uma regra de risco, revisar um caso. Cada contribuição fica registrada — com o seu nome ou com o anonimato que você preferir.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/contribuir" className="btn">Quero ajudar</Link>
            <a href="https://github.com/steinhauserhzs/monitor-de-gravata" target="_blank" rel="noopener noreferrer" className="btn btn--ghost">Ver o código ↗</a>
          </div>
        </div>
      </Section>
    </>
  );
}
