import Link from "next/link";
import { PageHead, Section, Notice, Empty, AvisoFonte } from "@/components/ui";
import { listDeputados } from "@/lib/camara";
import { listSenadores } from "@/lib/senado";
import { safe } from "@/lib/fetcher";
import { UFS } from "@/lib/tse";
import { eleitosPorCargo, buscarMunicipio, municipioPorCodigo, eleitosDoMunicipio, loadEleitos } from "@/lib/eleitos";

export const revalidate = 3600;
export const metadata = { title: "Quem manda no seu dinheiro" };

const norm = (s: string) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const POR_SECAO = 30;

type Pessoa = {
  chave: string;
  nome: string;
  partido: string;
  uf: string;
  foto: string;
  cargo: string;
  href: string;
  fonte: "camara" | "senado" | "tse";
};

export default async function Politicos({ searchParams }: PageProps<"/politicos">) {
  const sp = await searchParams;
  const uf = (Array.isArray(sp.uf) ? sp.uf[0] : sp.uf ?? "").toUpperCase();
  const nome = (Array.isArray(sp.nome) ? sp.nome[0] : sp.nome ?? "").trim();
  const partido = (Array.isArray(sp.partido) ? sp.partido[0] : sp.partido ?? "").trim().toUpperCase();
  const letra = (Array.isArray(sp.letra) ? sp.letra[0] : sp.letra ?? "").trim().toUpperCase().slice(0, 1);
  const cargo = (Array.isArray(sp.cargo) ? sp.cargo[0] : sp.cargo ?? "").trim();
  const municipio = (Array.isArray(sp.municipio) ? sp.municipio[0] : sp.municipio ?? "").trim();
  const buscaMun = (Array.isArray(sp.m) ? sp.m[0] : sp.m ?? "").trim();
  const verTudo = (Array.isArray(sp.tudo) ? sp.tudo[0] : sp.tudo ?? "") === "1";

  const [deps, sens] = await Promise.all([safe(listDeputados({ uf: uf || undefined })), safe(listSenadores())]);
  const base = loadEleitos();

  const federais: Pessoa[] = (deps.data ?? []).map((d) => ({
    chave: `dep-${d.id}`, nome: d.nome, partido: d.siglaPartido, uf: d.siglaUf, foto: d.urlFoto,
    cargo: "Deputado(a) federal", href: `/politicos/deputado/${d.id}`, fonte: "camara",
  }));
  const senadores: Pessoa[] = (sens.data ?? []).map((s) => ({
    chave: `sen-${s.CodigoParlamentar}`, nome: s.NomeParlamentar, partido: s.SiglaPartidoParlamentar ?? "", uf: s.UfParlamentar ?? "",
    foto: s.UrlFotoParlamentar ?? "", cargo: "Senador(a)", href: `/politicos/senador/${s.CodigoParlamentar}`, fonte: "senado",
  }));
  const doTSE = (cod: number, rotulo: string): Pessoa[] =>
    eleitosPorCargo(cod).map((e) => ({
      chave: `tse-${e.id}`, nome: e.nome, partido: e.partido, uf: e.uf, foto: e.foto, cargo: rotulo,
      href: `/candidatos/2022/${cod === 1 ? "BR" : e.uf}/${e.id}`, fonte: "tse",
    }));

  const secoes: { id: string; titulo: string; subtitulo: string; pessoas: Pessoa[] }[] = [
    { id: "presidente", titulo: "Presidência da República", subtitulo: "eleito na votação de 2022 · fonte TSE", pessoas: doTSE(1, "Presidente") },
    { id: "governador", titulo: "Governadores", subtitulo: "27 eleitos na votação de 2022 · fonte TSE", pessoas: doTSE(3, "Governador(a)") },
    { id: "senador", titulo: "Senadores", subtitulo: "81 em exercício · fonte Senado (ficha completa)", pessoas: senadores },
    { id: "federal", titulo: "Deputados federais", subtitulo: "513 em exercício · fonte Câmara (ficha completa)", pessoas: federais },
    { id: "estadual", titulo: "Deputados estaduais e distritais", subtitulo: `${eleitosPorCargo(7).length + eleitosPorCargo(8).length} eleitos em 2022 · fonte TSE`, pessoas: [...doTSE(7, "Deputado(a) estadual"), ...doTSE(8, "Deputado(a) distrital")] },
  ];

  const aplicar = (lista: Pessoa[]) =>
    lista.filter(
      (p) =>
        (!uf || p.uf === uf) &&
        (!nome || norm(p.nome).includes(norm(nome))) &&
        (!partido || p.partido === partido) &&
        (!letra || norm(p.nome).startsWith(letra)),
    );

  const visiveis = secoes
    .map((s) => ({ ...s, todos: aplicar(s.pessoas) }))
    .filter((s) => (!cargo || cargo === s.id) && s.todos.length > 0);

  const universo = secoes.flatMap((s) => s.pessoas);
  const partidosDisponiveis = [...new Set(universo.filter((p) => !uf || p.uf === uf).map((p) => p.partido).filter(Boolean))].sort();
  const totalFiltrado = visiveis.reduce((a, s) => a + s.todos.length, 0);

  /* prefeitos e vereadores: por município */
  const mun = municipio ? municipioPorCodigo(municipio) : null;
  const sugestoes = !mun && (buscaMun || uf) ? buscarMunicipio(buscaMun, uf || undefined, 60) : [];
  const [prefeitos, vereadores] = mun
    ? await Promise.all([safe(eleitosDoMunicipio(mun.c, 11)), safe(eleitosDoMunicipio(mun.c, 13))])
    : [{ data: null, error: null }, { data: null, error: null }];

  const qs = (extra: Record<string, string>) => {
    const u = new URLSearchParams();
    const atual: Record<string, string> = { uf, nome, partido, letra, cargo, municipio, m: buscaMun, ...extra };
    for (const [k, v] of Object.entries(atual)) if (v) u.set(k, v);
    return `/politicos${u.toString() ? `?${u}` : ""}`;
  };

  return (
    <>
      <PageHead
        kicker="Módulo 01"
        title={<>Quem decide onde<br />vai o seu dinheiro</>}
        stamp="ao vivo"
        stampTone="verde"
        lead="Do Planalto à câmara da sua cidade. Abra a ficha de qualquer um: quanto gastou de verba pública, como votou, quem financiou, o que propôs, quem são os sócios das empresas que recebem por fora. Sem opinião — só o registro oficial, com a data em que foi consultado."
        right={
          <form className="card p-4 grid gap-2 sm:grid-cols-2 w-full sm:min-w-[22rem]">
            <label className="block sm:col-span-2"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Nome</span><input name="nome" defaultValue={nome} className="input" placeholder="sobrenome basta" /></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Estado</span>
              <select name="uf" defaultValue={uf} className="input"><option value="">Todos</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Cargo</span>
              <select name="cargo" defaultValue={cargo} className="input">
                <option value="">Todos</option>
                <option value="presidente">Presidente</option>
                <option value="governador">Governador</option>
                <option value="senador">Senador</option>
                <option value="federal">Deputado federal</option>
                <option value="estadual">Dep. estadual/distrital</option>
              </select></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Partido</span><input name="partido" defaultValue={partido} className="input" placeholder="sigla" /></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Inicial</span><input name="letra" defaultValue={letra} maxLength={1} className="input" placeholder="A" /></label>
            <button className="btn sm:col-span-2" type="submit">Filtrar</button>
          </form>
        }
      />

      <Section>
        <div className="space-y-3">
          <FiltroLinha rotulo="Cargo">
            <Chip href={qs({ cargo: "", tudo: "" })} ativo={!cargo}>todos</Chip>
            {secoes.map((s) => (
              <Chip key={s.id} href={qs({ cargo: s.id === cargo ? "" : s.id, tudo: "" })} ativo={cargo === s.id}>{s.titulo}</Chip>
            ))}
            <Chip href="#municipais" ativo={false}>prefeitos e vereadores ↓</Chip>
          </FiltroLinha>
          <FiltroLinha rotulo="Inicial">
            <Chip href={qs({ letra: "" })} ativo={!letra}>todas</Chip>
            {LETRAS.map((l) => <Chip key={l} href={qs({ letra: l === letra ? "" : l })} ativo={l === letra}>{l}</Chip>)}
          </FiltroLinha>
          <FiltroLinha rotulo="Partido">
            <Chip href={qs({ partido: "" })} ativo={!partido}>todos</Chip>
            {partidosDisponiveis.map((p) => <Chip key={p} href={qs({ partido: p === partido ? "" : p })} ativo={p === partido}>{p}</Chip>)}
          </FiltroLinha>
          <FiltroLinha rotulo="Estado">
            <Chip href={qs({ uf: "" })} ativo={!uf}>todos</Chip>
            {UFS.map((u) => <Chip key={u} href={qs({ uf: u === uf ? "" : u })} ativo={u === uf}>{u}</Chip>)}
          </FiltroLinha>
          {(nome || partido || letra || uf || cargo) && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-3">{totalFiltrado} pessoa(s) no filtro</span>
              <Link href="/politicos" className="btn btn--ghost !py-1 !px-2 !text-[0.6rem]">limpar ✕</Link>
            </div>
          )}
        </div>
      </Section>

      {deps.error && <Section><AvisoFonte fonte="Câmara dos Deputados" resultado={deps} oQue="a lista de deputados federais" /></Section>}
      {!visiveis.length && <Section><Empty>Ninguém com esses filtros. <Link href="/politicos" className="underline">Limpar</Link>.</Empty></Section>}

      {visiveis.map((s) => {
        const mostrar = verTudo && cargo === s.id ? s.todos : s.todos.slice(0, POR_SECAO);
        return (
          <Section key={s.id} id={s.id} kicker={s.subtitulo} title={`${s.titulo} (${s.todos.length})`}>
            <Grade pessoas={mostrar} />
            {s.todos.length > mostrar.length && (
              <div className="mt-4">
                <Link href={qs({ cargo: s.id, tudo: "1" })} className="btn btn--ghost">
                  Ver os {s.todos.length} — {s.titulo.toLowerCase()} →
                </Link>
              </div>
            )}
          </Section>
        );
      })}

      <Section id="municipais" kicker="Onde a conta chega primeiro" title="Prefeitos e vereadores">
        <p className="mb-4 max-w-3xl text-ink-2">
          É na prefeitura que se compra a merenda, o remédio do posto e o asfalto da sua rua — e é onde menos gente está olhando.
          O TSE organiza esses eleitos por município: escolha o seu.
        </p>
        <form className="card p-4 grid gap-2 sm:grid-cols-[auto_1fr_auto] items-end mb-4">
          <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Estado</span>
            <select name="uf" defaultValue={uf} className="input"><option value="">—</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select></label>
          <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Município</span><input name="m" defaultValue={buscaMun} className="input" placeholder="digite o nome da sua cidade" /></label>
          <button className="btn" type="submit">Procurar</button>
        </form>

        {sugestoes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {sugestoes.map((m) => (
              <Link key={m.uf + m.c} href={qs({ municipio: m.c, m: "" })} className="px-2 py-1 border border-linha font-mono text-[0.62rem] hover:bg-ink hover:text-paper">
                {m.n}/{m.uf}
              </Link>
            ))}
          </div>
        )}

        {mun && (
          <>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="tab">{mun.n}/{mun.uf}</span>
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-3">eleitos em 2024 · fonte TSE</span>
              <Link href={qs({ municipio: "" })} className="font-mono text-[0.6rem] uppercase underline">trocar cidade ✕</Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-stamp mb-2">Prefeito(a)</div>
                <Grade pessoas={(prefeitos.data ?? []).map((c) => ({ chave: `pref-${c.id}`, nome: c.nomeUrna, partido: c.partido?.sigla ?? "", uf: mun.uf, foto: c.fotoUrl ?? "", cargo: "Prefeito(a)", href: `/candidatos/2024/${mun.c}/${c.id}`, fonte: "tse" as const }))} />
                {!prefeitos.data?.length && <p className="text-sm text-ink-3">Sem prefeito eleito localizado para este município em 2024.</p>}
              </div>
              <div>
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-stamp mb-2">Vereadores ({vereadores.data?.length ?? 0}) — {POR_SECAO} primeiros</div>
                <Grade pessoas={(vereadores.data ?? []).slice(0, POR_SECAO).map((c) => ({ chave: `ver-${c.id}`, nome: c.nomeUrna, partido: c.partido?.sigla ?? "", uf: mun.uf, foto: c.fotoUrl ?? "", cargo: "Vereador(a)", href: `/candidatos/2024/${mun.c}/${c.id}`, fonte: "tse" as const }))} />
                {!vereadores.data?.length && <p className="text-sm text-ink-3">Sem vereadores localizados para este município em 2024.</p>}
              </div>
            </div>
          </>
        )}
        {!mun && !sugestoes.length && <p className="text-sm text-ink-3">Escolha o estado e digite o nome da cidade acima.</p>}
      </Section>

      <Section>
        <Notice tone="warn" title="Eleito em 2022 ≠ quem ocupa o cargo hoje">
          As listas de presidente, governadores e deputados estaduais mostram <strong>quem foi eleito na votação de 2022</strong>, como registrado pelo TSE.
          Quem renunciou, morreu, foi cassado, assumiu outro cargo ou foi substituído por suplente <strong>continua aparecendo aqui</strong> — o TSE registra a eleição, não a ocupação atual.
          Deputados federais e senadores, esses sim, vêm das APIs da Câmara e do Senado e refletem quem está em exercício agora.
        </Notice>
        <div className="h-4" />
        <Notice tone="info" title="De onde vem cada nome">
          Deputados federais e senadores vêm das APIs da Câmara e do Senado, ao vivo — por isso têm ficha completa (gastos, votações, presença).
          Presidente, governadores e deputados estaduais vêm dos <strong>eleitos de 2022</strong> no TSE{base ? ` (índice gerado em ${base.gerado_em})` : ""};
          prefeitos e vereadores, dos eleitos de 2024. Assembleias e câmaras municipais que publicam dados abertos entram na ficha completa conforme a comunidade conecta —{" "}
          <Link href="/contribuir" className="underline">conecte a da sua cidade</Link>.
        </Notice>
      </Section>
    </>
  );
}

function FiltroLinha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mr-1 w-16 shrink-0">{rotulo}</span>
      {children}
    </div>
  );
}

function Chip({ href, ativo, children }: { href: string; ativo: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`px-2 py-1 border border-linha font-mono text-[0.62rem] ${ativo ? "bg-ink text-paper" : "hover:bg-paper-2"}`}>
      {children}
    </Link>
  );
}

function Grade({ pessoas }: { pessoas: Pessoa[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {pessoas.map((p) => (
        <Link key={p.chave} href={p.href} className="card flex items-center gap-3 p-2.5 hover:-translate-y-0.5 transition-transform">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.foto} alt="" loading="lazy" className="h-12 w-10 object-cover grayscale contrast-125 bg-paper-2" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{p.nome}</div>
            <div className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">{p.partido}{p.uf ? `-${p.uf}` : ""}</div>
            <div className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-3">
              {p.cargo}
              {p.fonte !== "tse" && <span className="text-verde"> · ficha completa</span>}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
