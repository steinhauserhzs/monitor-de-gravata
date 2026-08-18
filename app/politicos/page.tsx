import Link from "next/link";
import { PageHead, Section, Notice, Empty } from "@/components/ui";
import { listDeputados } from "@/lib/camara";
import { listSenadores } from "@/lib/senado";
import { safe } from "@/lib/fetcher";
import { UFS } from "@/lib/tse";

export const revalidate = 3600;
export const metadata = { title: "Ficha 360 do político" };

const norm = (s: string) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type Pessoa = { id: string; nome: string; partido: string; uf: string; foto: string; cargo: "Deputado(a) federal" | "Senador(a)"; href: string };

export default async function Politicos({ searchParams }: PageProps<"/politicos">) {
  const sp = await searchParams;
  const uf = (Array.isArray(sp.uf) ? sp.uf[0] : sp.uf ?? "").toUpperCase();
  const nome = (Array.isArray(sp.nome) ? sp.nome[0] : sp.nome ?? "").trim();
  const partido = (Array.isArray(sp.partido) ? sp.partido[0] : sp.partido ?? "").trim().toUpperCase();
  const letra = (Array.isArray(sp.letra) ? sp.letra[0] : sp.letra ?? "").trim().toUpperCase().slice(0, 1);
  const casa = (Array.isArray(sp.casa) ? sp.casa[0] : sp.casa ?? "todos") as "todos" | "camara" | "senado";

  const [deps, sens] = await Promise.all([
    casa !== "senado" ? safe(listDeputados({ uf: uf || undefined })) : Promise.resolve({ data: [], error: null }),
    casa !== "camara" ? safe(listSenadores()) : Promise.resolve({ data: [], error: null }),
  ]);

  const pessoas: Pessoa[] = [
    ...(deps.data ?? []).map((d) => ({ id: String(d.id), nome: d.nome, partido: d.siglaPartido, uf: d.siglaUf, foto: d.urlFoto, cargo: "Deputado(a) federal" as const, href: `/politicos/deputado/${d.id}` })),
    ...(sens.data ?? []).map((s) => ({ id: s.CodigoParlamentar, nome: s.NomeParlamentar, partido: s.SiglaPartidoParlamentar ?? "", uf: s.UfParlamentar ?? "", foto: s.UrlFotoParlamentar ?? "", cargo: "Senador(a)" as const, href: `/politicos/senador/${s.CodigoParlamentar}` })),
  ];

  const universo = pessoas.filter((p) => !uf || p.uf === uf);
  const partidosDisponiveis = [...new Set(universo.map((p) => p.partido).filter(Boolean))].sort();
  const filtrados = universo.filter(
    (p) =>
      (!nome || norm(p.nome).includes(norm(nome))) &&
      (!partido || p.partido === partido) &&
      (!letra || norm(p.nome).startsWith(letra)),
  );
  const deputados = filtrados.filter((p) => p.cargo === "Deputado(a) federal");
  const senadores = filtrados.filter((p) => p.cargo === "Senador(a)");
  const letrasComGente = new Set(universo.map((p) => norm(p.nome)[0]));

  const qs = (extra: Record<string, string>) => {
    const u = new URLSearchParams();
    const atual: Record<string, string> = { uf, nome, partido, letra, casa: casa === "todos" ? "" : casa, ...extra };
    for (const [k, v] of Object.entries(atual)) if (v) u.set(k, v);
    return `/politicos${u.toString() ? `?${u}` : ""}`;
  };

  return (
    <>
      <PageHead
        kicker="Módulo 01"
        title="Ficha 360 do político"
        stamp="ao vivo"
        stampTone="verde"
        lead={`${pessoas.length} parlamentares em exercício (513 deputados federais + 81 senadores). Clique em qualquer um para a ficha completa: gastos nota a nota, presença, votações, produtividade, comissões, linha do tempo, notícias e red flags calculadas na hora.`}
        right={
          <form className="card p-4 grid gap-2 sm:grid-cols-2 w-full sm:min-w-[22rem]">
            <label className="block sm:col-span-2"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Nome</span><input name="nome" defaultValue={nome} className="input" placeholder="sobrenome basta" /></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Estado</span>
              <select name="uf" defaultValue={uf} className="input"><option value="">Todos</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Cargo</span>
              <select name="casa" defaultValue={casa} className="input"><option value="todos">Todos</option><option value="camara">Deputado federal</option><option value="senado">Senador</option></select></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Partido</span><input name="partido" defaultValue={partido} className="input" placeholder="PT, PL, NOVO…" /></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Inicial</span><input name="letra" defaultValue={letra} maxLength={1} className="input" placeholder="A" /></label>
            <button className="btn sm:col-span-2" type="submit">Filtrar</button>
          </form>
        }
      />

      <Section>
        {/* filtros rápidos clicáveis */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1">
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mr-1 w-14">Inicial</span>
            <Link href={qs({ letra: "" })} className={`px-2 py-1 border border-linha font-mono text-[0.62rem] ${!letra ? "bg-ink text-paper" : "hover:bg-paper-2"}`}>todas</Link>
            {LETRAS.map((l) => (
              <Link
                key={l}
                href={letrasComGente.has(l) ? qs({ letra: l === letra ? "" : l }) : qs({})}
                aria-disabled={!letrasComGente.has(l)}
                className={`px-2 py-1 border border-linha font-mono text-[0.62rem] ${l === letra ? "bg-ink text-paper" : letrasComGente.has(l) ? "hover:bg-paper-2" : "opacity-30 pointer-events-none"}`}
              >
                {l}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mr-1 w-14">Partido</span>
            <Link href={qs({ partido: "" })} className={`px-2 py-1 border border-linha font-mono text-[0.62rem] ${!partido ? "bg-ink text-paper" : "hover:bg-paper-2"}`}>todos</Link>
            {partidosDisponiveis.map((p) => (
              <Link key={p} href={qs({ partido: p === partido ? "" : p })} className={`px-2 py-1 border border-linha font-mono text-[0.62rem] ${p === partido ? "bg-ink text-paper" : "hover:bg-paper-2"}`}>{p}</Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mr-1 w-14">Estado</span>
            <Link href={qs({ uf: "" })} className={`px-2 py-1 border border-linha font-mono text-[0.62rem] ${!uf ? "bg-ink text-paper" : "hover:bg-paper-2"}`}>todos</Link>
            {UFS.map((u) => (
              <Link key={u} href={qs({ uf: u === uf ? "" : u })} className={`px-2 py-1 border border-linha font-mono text-[0.62rem] ${u === uf ? "bg-ink text-paper" : "hover:bg-paper-2"}`}>{u}</Link>
            ))}
          </div>
          {(nome || partido || letra || uf || casa !== "todos") && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-3">{filtrados.length} resultado(s) de {universo.length}</span>
              <Link href="/politicos" className="btn btn--ghost !py-1 !px-2 !text-[0.6rem]">limpar filtros ✕</Link>
            </div>
          )}
        </div>
      </Section>

      {deps.error && <Section><Notice tone="warn" title="Câmara dos Deputados">API não respondeu: {deps.error}</Notice></Section>}
      {sens.error && <Section><Notice tone="warn" title="Senado Federal">API não respondeu: {sens.error}</Notice></Section>}
      {!filtrados.length && !deps.error && <Section><Empty>Nenhum parlamentar com esses filtros. <Link href="/politicos" className="underline">Limpar</Link> ou procure em <Link href="/candidatos" className="underline">Candidatos 2026</Link>.</Empty></Section>}

      {senadores.length > 0 && (
        <Section kicker="Senado" title={`Senadores (${senadores.length})`}>
          <ListaPessoas pessoas={senadores} />
        </Section>
      )}
      {deputados.length > 0 && (
        <Section kicker="Câmara" title={`Deputados federais (${deputados.length})`}>
          <ListaPessoas pessoas={deputados} />
        </Section>
      )}

      <Section>
        <Notice tone="info" title="Cobertura">
          Hoje: os 513 deputados federais e os 81 senadores em exercício, ao vivo. Governadores, prefeitos, vereadores e deputados estaduais entram pela ficha de{" "}
          <Link href="/candidatos" className="underline">candidato (TSE)</Link>; assembleias e câmaras municipais com API (SAPL) estão no roadmap — veja{" "}
          <Link href="/apis" className="underline">o catálogo</Link> e ajude a conectar a sua.
        </Notice>
      </Section>
    </>
  );
}

function ListaPessoas({ pessoas }: { pessoas: Pessoa[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {pessoas.map((p) => (
        <Link key={p.cargo + p.id} href={p.href} className="card flex items-center gap-3 p-2.5 hover:-translate-y-0.5 transition-transform">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.foto} alt="" loading="lazy" className="h-12 w-10 object-cover grayscale contrast-125 bg-paper-2" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{p.nome}</div>
            <div className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">{p.partido}-{p.uf}</div>
            <div className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-3">{p.cargo}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
