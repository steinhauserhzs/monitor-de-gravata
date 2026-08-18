import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHead, Section, Empty, Notice } from "@/components/ui";
import { listDeputados } from "@/lib/camara";
import { listSenadores } from "@/lib/senado";
import { searchPNCP } from "@/lib/pncp";
import { listCandidatos, ELEICOES, CARGOS, UFS, fotoCandidato } from "@/lib/tse";
import { safe } from "@/lib/fetcher";
import { onlyDigits, validCNPJ, brl, dateBR } from "@/lib/format";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const metadata = { title: "Busca" };

const norm = (s: string) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default async function Buscar({ searchParams }: PageProps<"/buscar">) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q ?? "").trim();
  const uf = (Array.isArray(sp.uf) ? sp.uf[0] : sp.uf ?? "").toUpperCase();
  const partido = (Array.isArray(sp.partido) ? sp.partido[0] : sp.partido ?? "").trim().toUpperCase();
  const cargo = Number(Array.isArray(sp.cargo) ? sp.cargo[0] : sp.cargo) || 0;
  const ano = Number(Array.isArray(sp.ano) ? sp.ano[0] : sp.ano) || 2026;
  const onde = (Array.isArray(sp.onde) ? sp.onde[0] : sp.onde ?? "tudo") as "tudo" | "candidatos" | "politicos" | "contratos";
  if (!q && !partido && !uf) redirect("/");

  const digits = onlyDigits(q);
  if (digits.length === 14 && validCNPJ(digits)) redirect(`/empresas/${digits}`);
  const numeroUrna = /^\d{2,5}$/.test(digits) ? digits : "";

  const buscarPoliticos = onde === "tudo" || onde === "politicos";
  const buscarCandidatos = (onde === "tudo" || onde === "candidatos") && (Boolean(q) || Boolean(partido)) && Boolean(uf || cargo === 1);
  const buscarContratos = (onde === "tudo" || onde === "contratos") && Boolean(q) && !numeroUrna;

  const cargosBusca = cargo ? [cargo] : [6, 7, 5, 3, 1];
  const [deps, sens, pncp, ...candLists] = await Promise.all([
    buscarPoliticos && q ? safe(listDeputados({ nome: q, uf: uf || undefined, partido: partido || undefined })) : Promise.resolve({ data: [], error: null }),
    buscarPoliticos ? safe(listSenadores()) : Promise.resolve({ data: [], error: null }),
    buscarContratos ? safe(searchPNCP({ q, uf: uf || undefined, tam: 10 })) : Promise.resolve({ data: null, error: null }),
    ...(buscarCandidatos ? cargosBusca.map((c) => safe(listCandidatos(ano, c === 1 ? "BR" : uf, c))) : []),
  ]);

  const senadores = (sens.data ?? []).filter(
    (s) => (!q || norm(s.NomeParlamentar + " " + s.NomeCompletoParlamentar).includes(norm(q))) && (!uf || s.UfParlamentar === uf) && (!partido || s.SiglaPartidoParlamentar === partido),
  );

  const candidatos = candLists.flatMap((l, i) =>
    (l.data ?? [])
      .filter((c) => {
        const okNome = !q || numeroUrna ? true : norm(c.nomeUrna + " " + c.nomeCompleto).includes(norm(q));
        const okNumero = !numeroUrna || String(c.numero).startsWith(numeroUrna);
        const okPartido = !partido || c.partido?.sigla === partido;
        return okNome && okNumero && okPartido;
      })
      .slice(0, 60)
      .map((c) => ({ c, cargo: cargosBusca[i] })),
  );

  const partidos = [...new Set([...(deps.data ?? []).map((d) => d.siglaPartido), ...senadores.map((s) => s.SiglaPartidoParlamentar ?? "")].filter(Boolean))].sort();

  return (
    <>
      <PageHead
        kicker="Busca"
        title={q ? <>Resultados para <span className="marker">{q}</span></> : <>Busca filtrada</>}
        lead="Procure por nome, número de urna, partido, CNPJ ou objeto de contrato. Combine com estado e cargo para achar exatamente quem representa você."
        right={
          <form className="card p-4 grid gap-2 sm:grid-cols-2 w-full sm:min-w-[24rem]">
            <label className="block sm:col-span-2"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Nome, número de urna, CNPJ ou objeto</span><input name="q" defaultValue={q} className="input" placeholder="ex.: 2222 · Maria · 00.000.000/0001-91 · merenda" /></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Estado</span><select name="uf" defaultValue={uf} className="input"><option value="">Todos</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Partido</span><input name="partido" defaultValue={partido} className="input" placeholder="PT, PL, NOVO…" /></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Cargo (candidatos)</span><select name="cargo" defaultValue={cargo || ""} className="input"><option value="">Todos</option>{[1, 3, 5, 6, 7, 8].map((c) => <option key={c} value={c}>{CARGOS[c]}</option>)}</select></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Onde buscar</span><select name="onde" defaultValue={onde} className="input"><option value="tudo">Tudo</option><option value="candidatos">Candidatos</option><option value="politicos">Em exercício</option><option value="contratos">Contratos</option></select></label>
            <input type="hidden" name="ano" value={ano} />
            <button className="btn sm:col-span-2" type="submit">Buscar</button>
          </form>
        }
      />

      {buscarCandidatos && (
        <Section kicker={`Candidatos ${ano}`} title={`${candidatos.length} candidato(s)${uf ? ` · ${uf}` : ""}${partido ? ` · ${partido}` : ""}${numeroUrna ? ` · número ${numeroUrna}…` : ""}`}>
          {!candidatos.length && <Empty>Nenhum candidato com esses filtros. Dica: número de urna precisa de estado; para presidente, escolha o cargo.</Empty>}
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {candidatos.map(({ c, cargo: cg }) => (
              <Link key={`${cg}-${c.id}`} href={`/candidatos/${ano}/${cg === 1 ? "BR" : uf}/${c.id}`} className="card flex items-center gap-3 p-2.5 hover:-translate-y-0.5 transition-transform">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.fotoUrl || fotoCandidato(ELEICOES[ano].id, c.id, cg === 1 ? "BR" : uf)} alt="" loading="lazy" className="h-12 w-10 object-cover grayscale contrast-125 bg-paper-2" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{c.nomeUrna}</div>
                  <div className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">{c.numero} · {c.partido?.sigla} · {CARGOS[cg]}</div>
                  <div className="font-mono text-[0.58rem] uppercase text-ink-3">{c.descricaoSituacao}</div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
      {!buscarCandidatos && (onde === "tudo" || onde === "candidatos") && (
        <Section kicker={`Candidatos ${ano}`} title="Escolha um estado">
          <Notice tone="info">Para buscar candidatos por nome, número de urna ou partido, selecione o <strong>estado</strong> no filtro (ou o cargo Presidente). O TSE publica as listas por UF e cargo.</Notice>
        </Section>
      )}

      {buscarPoliticos && (
        <Section kicker="Em exercício" title={`Deputados e senadores (${(deps.data?.length ?? 0) + senadores.length})`}>
          {deps.error && <Notice tone="warn" title="Câmara">API não respondeu: {deps.error}</Notice>}
          {partidos.length > 1 && <div className="mb-3 flex flex-wrap gap-1">{partidos.map((p) => <Link key={p} href={`/buscar?q=${encodeURIComponent(q)}&uf=${uf}&partido=${p}&onde=politicos`} className="tab">{p}</Link>)}</div>}
          {!deps.data?.length && !senadores.length && <Empty>Nenhum parlamentar em exercício com esses filtros.</Empty>}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(deps.data ?? []).map((d) => (
              <Link key={d.id} href={`/politicos/deputado/${d.id}`} className="card flex items-center gap-3 p-3 hover:-translate-y-0.5 transition-transform">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.urlFoto} alt="" loading="lazy" className="h-14 w-11 object-cover grayscale" />
                <div>
                  <div className="font-semibold leading-tight">{d.nome}</div>
                  <div className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-3">Dep. federal · {d.siglaPartido}-{d.siglaUf}</div>
                </div>
              </Link>
            ))}
            {senadores.map((s) => (
              <Link key={s.CodigoParlamentar} href={`/politicos/senador/${s.CodigoParlamentar}`} className="card flex items-center gap-3 p-3 hover:-translate-y-0.5 transition-transform">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.UrlFotoParlamentar} alt="" loading="lazy" className="h-14 w-11 object-cover grayscale" />
                <div>
                  <div className="font-semibold leading-tight">{s.NomeParlamentar}</div>
                  <div className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-3">Senador · {s.SiglaPartidoParlamentar}-{s.UfParlamentar}</div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {buscarContratos && (
        <Section kicker="Contratos" title="No PNCP (objeto, órgão ou fornecedor)">
          {pncp.error && <Notice tone="warn" title="PNCP">A busca do PNCP não respondeu: {pncp.error}</Notice>}
          {pncp.data && !pncp.data.items.length && <Empty>Nada no PNCP para esse termo.</Empty>}
          {pncp.data?.items.length ? (
            <div className="overflow-x-auto card">
              <table className="table">
                <thead><tr><th>Data</th><th>Órgão</th><th>Objeto</th><th>Fornecedor</th><th className="text-right">Valor</th></tr></thead>
                <tbody>
                  {pncp.data.items.map((it) => (
                    <tr key={it.id}>
                      <td className="font-mono text-xs whitespace-nowrap">{dateBR(it.data_publicacao_pncp)}</td>
                      <td className="text-xs">{it.orgao_nome}<div className="text-ink-3">{it.municipio_nome}/{it.uf}</div></td>
                      <td className="text-xs max-w-md"><Link href={`/contratos/${it.orgao_cnpj}/${it.ano}/${it.numero_sequencial}`} className="underline decoration-stamp underline-offset-2">{it.description?.slice(0, 160)}</Link></td>
                      <td className="text-xs">{it.nome_fornecedor ?? "—"}</td>
                      <td className="text-right font-mono text-xs whitespace-nowrap">{brl(it.valor_global)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <p className="mt-3 text-xs text-ink-3">Mais filtros em <Link href={`/contratos?q=${encodeURIComponent(q)}`} className="underline">Radar de contratos</Link>.</p>
        </Section>
      )}
    </>
  );
}
