import Link from "next/link";
import { PageHead, Section, Notice, Empty } from "@/components/ui";
import { listCandidatos, ELEICOES, CARGOS, UFS, fotoCandidato } from "@/lib/tse";
import { safe } from "@/lib/fetcher";

export const revalidate = 3600;
export const metadata = { title: "Manual do Candidato 2026" };

export default async function Candidatos({ searchParams }: PageProps<"/candidatos">) {
  const sp = await searchParams;
  const ano = Number(Array.isArray(sp.ano) ? sp.ano[0] : sp.ano) || 2026;
  const uf = (Array.isArray(sp.uf) ? sp.uf[0] : sp.uf ?? "").toUpperCase();
  const cargo = Number(Array.isArray(sp.cargo) ? sp.cargo[0] : sp.cargo) || 0;
  const nome = (Array.isArray(sp.nome) ? sp.nome[0] : sp.nome ?? "").trim().toLowerCase();
  const partido = (Array.isArray(sp.partido) ? sp.partido[0] : sp.partido ?? "").trim().toUpperCase();
  const numero = (Array.isArray(sp.numero) ? sp.numero[0] : sp.numero ?? "").replace(/\D/g, "");
  const situacao = (Array.isArray(sp.situacao) ? sp.situacao[0] : sp.situacao ?? "").trim();
  const el = ELEICOES[ano];
  const cargosDisponiveis = el?.abrangencia === "M" ? [11, 13] : [1, 3, 5, 6, 7, 8];
  const ufEfetiva = cargo === 1 ? "BR" : uf;

  const pagina = Math.max(1, Number(Array.isArray(sp.pagina) ? sp.pagina[0] : sp.pagina) || 1);
  const POR_PAGINA = 240;
  const lista = uf && cargo ? await safe(listCandidatos(ano, ufEfetiva, cargo)) : { data: null, error: null };
  const base = lista.data ?? [];
  const partidosDisponiveis = [...new Set(base.map((c) => c.partido?.sigla).filter(Boolean))].sort();
  const situacoesDisponiveis = [...new Set(base.map((c) => c.descricaoSituacao).filter(Boolean))].sort();
  const todos = base.filter(
    (c) =>
      (!nome || (c.nomeUrna + " " + c.nomeCompleto).toLowerCase().includes(nome)) &&
      (!partido || c.partido?.sigla === partido) &&
      (!numero || String(c.numero).startsWith(numero)) &&
      (!situacao || c.descricaoSituacao === situacao),
  );
  const totalPaginas = Math.max(1, Math.ceil(todos.length / POR_PAGINA));
  const cands = todos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const porSituacao = new Map<string, number>();
  for (const c of todos) porSituacao.set(c.descricaoSituacao, (porSituacao.get(c.descricaoSituacao) ?? 0) + 1);
  const qs = (extra: Record<string, string | number>) => {
    const u = new URLSearchParams({ ano: String(ano), uf, cargo: String(cargo) });
    if (nome) u.set("nome", nome);
    if (partido) u.set("partido", partido);
    if (numero) u.set("numero", numero);
    if (situacao) u.set("situacao", situacao);
    for (const [k, v] of Object.entries(extra)) v === "" ? u.delete(k) : u.set(k, String(v));
    return `/candidatos?${u}`;
  };
  const linkPagina = (p: number) => qs({ pagina: p });

  return (
    <>
      <PageHead
        kicker="Módulo 02"
        title="Manual do Candidato 2026"
        stamp="TSE ao vivo"
        stampTone="verde"
        lead="Todo candidato registrado na Justiça Eleitoral, por estado e cargo: situação da candidatura, bens declarados, evolução patrimonial, doadores, fornecedores de campanha, processos e certidões. Registro encerrou em 15/08/2026; contas de campanha aparecem a partir de setembro."
        right={
          <form className="card p-4 grid gap-2 sm:grid-cols-[auto_auto_1fr_1fr_auto] items-end w-full sm:min-w-[22rem]">
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Eleição</span>
              <select name="ano" defaultValue={ano} className="input">{Object.keys(ELEICOES).sort((a, b) => Number(b) - Number(a)).map((a) => <option key={a} value={a}>{a}</option>)}</select></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">UF</span>
              <select name="uf" defaultValue={uf} className="input"><option value="">—</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Cargo</span>
              <select name="cargo" defaultValue={cargo || ""} className="input"><option value="">—</option>{cargosDisponiveis.map((c) => <option key={c} value={c}>{CARGOS[c]}</option>)}</select></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Nome</span><input name="nome" defaultValue={nome} className="input" placeholder="opcional" /></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Nº de urna</span><input name="numero" defaultValue={numero} className="input" placeholder="ex.: 2222" inputMode="numeric" /></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Partido</span><input name="partido" defaultValue={partido} className="input" placeholder="PT, PL…" /></label>
            <button className="btn" type="submit">Listar</button>
          </form>
        }
      />

      {cargo && !uf && cargo !== 1 ? (
        <Section kicker="Falta o estado" title={`${CARGOS[cargo] ?? "Cargo"} — escolha um estado`}>
          <Notice tone="info">O TSE publica as listas de candidatos por <strong>estado</strong>. Escolha abaixo (ou no formulário) para ver {CARGOS[cargo] ?? "os candidatos"}:</Notice>
          <div className="mt-4 grid gap-2 grid-cols-4 sm:grid-cols-7 md:grid-cols-9">
            {UFS.map((u) => (
              <Link key={u} href={`/candidatos?ano=${ano}&uf=${u}&cargo=${cargo}`} className="btn btn--ghost justify-center !py-2 !px-2 !text-[0.65rem]">{u}</Link>
            ))}
          </div>
        </Section>
      ) : !uf || !cargo ? (
        <Section>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Passo 1", "Escolha eleição, UF e cargo", "Presidente usa UF = BR automaticamente. Para 2024/2020 (municipais) os cargos são prefeito e vereador — a UF filtra o estado; a lista vem por município."],
              ["Passo 2", "Abra a ficha do candidato", "Bens item a item, total declarado, evolução desde eleições anteriores (mesmo nome), situação, número, coligação, processos e certidões."],
              ["Passo 3", "Compare e pergunte", "Red flags objetivas (salto patrimonial, sem bens, processo de cassação, 100% fundo) viram perguntas para o candidato — não sentenças."],
            ].map(([k, t, d]) => (
              <div key={k} className="card p-5">
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-stamp">{k}</div>
                <div className="font-display text-xl mt-1">{t}</div>
                <p className="mt-2 text-sm text-ink-2">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-3 md:grid-cols-6">
            {["SP", "RJ", "MG", "BA", "RS", "PR"].map((u) => (
              <Link key={u} href={`/candidatos?ano=2026&uf=${u}&cargo=6`} className="btn btn--ghost justify-center">Dep. federais · {u}</Link>
            ))}
          </div>
        </Section>
      ) : (
        <Section kicker={`${el?.nome ?? ano}`} title={`${CARGOS[cargo] ?? `Cargo ${cargo}`} · ${ufEfetiva} (${todos.length})`}>
          {lista.error && <Notice tone="warn" title="TSE">O DivulgaCand não respondeu: {lista.error}</Notice>}
          {el?.abrangencia === "M" && !todos.length && (
            <Notice tone="warn" title="Eleição municipal: listagem por município">
              Para prefeito e vereador o TSE organiza os candidatos <strong>por município</strong>, não por estado — a consulta por UF volta vazia.
              A busca por município ainda não está implementada aqui (
              <a className="underline" href="https://github.com/steinhauserhzs/monitor-de-gravata/issues" target="_blank" rel="noopener noreferrer">issue aberta</a>
              ). Enquanto isso, consulte no{" "}
              <a className="underline" href={`https://divulgacandcontas.tse.jus.br/divulga/#/municipios/${el.id}/${uf}`} target="_blank" rel="noopener noreferrer">DivulgaCand oficial ↗</a>.
            </Notice>
          )}
          <div className="mb-4 flex flex-wrap gap-2">
            {[...porSituacao.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <Link key={k} href={qs({ situacao: situacao === k ? "" : k, pagina: 1 })} className={`tab ${situacao === k ? "!bg-ink !text-paper" : ""}`}>{k} · {v}</Link>
            ))}
          </div>
          {(partidosDisponiveis.length > 1 || partido || numero || situacao) && (
            <div className="mb-4 flex flex-wrap items-center gap-1">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mr-1">Partido:</span>
              {partido && <Link href={qs({ partido: "", pagina: 1 })} className="btn btn--ghost !py-1 !px-2 !text-[0.6rem]">limpar ✕</Link>}
              {partidosDisponiveis.slice(0, 40).map((p) => (
                <Link key={p} href={qs({ partido: p === partido ? "" : p!, pagina: 1 })} className={`px-2 py-1 border border-linha font-mono text-[0.6rem] ${p === partido ? "bg-ink text-paper" : "hover:bg-paper-2"}`}>{p}</Link>
              ))}
              {situacoesDisponiveis.length > 1 && situacao && <Link href={qs({ situacao: "", pagina: 1 })} className="btn btn--ghost !py-1 !px-2 !text-[0.6rem] ml-2">situação: {situacao} ✕</Link>}
            </div>
          )}
          {lista.data && !todos.length && <Empty>Nenhum candidato para esse filtro.</Empty>}
          {totalPaginas > 1 && (
            <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.12em]">
              <span className="text-ink-3">Página {pagina} de {totalPaginas} · {POR_PAGINA} por página</span>
              {pagina > 1 && <Link className="btn btn--ghost !py-1.5 !px-3" href={linkPagina(pagina - 1)}>← anterior</Link>}
              {pagina < totalPaginas && <Link className="btn btn--ghost !py-1.5 !px-3" href={linkPagina(pagina + 1)}>próxima →</Link>}
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {cands.map((c) => (
              <Link key={c.id} href={`/candidatos/${ano}/${ufEfetiva}/${c.id}`} className="card flex items-center gap-3 p-2.5 hover:-translate-y-0.5 transition-transform">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.fotoUrl || fotoCandidato(el.id, c.id, ufEfetiva)} alt="" loading="lazy" className="h-12 w-10 object-cover grayscale contrast-125 bg-paper-2" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{c.nomeUrna}</div>
                  <div className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">{c.numero} · {c.partido?.sigla} · {c.descricaoSituacao}</div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
