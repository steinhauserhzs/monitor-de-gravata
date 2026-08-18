import Link from "next/link";
import { PageHead, Section, Notice, Empty } from "@/components/ui";
import { listDeputados } from "@/lib/camara";
import { listSenadores } from "@/lib/senado";
import { safe } from "@/lib/fetcher";
import { UFS } from "@/lib/tse";

export const revalidate = 3600;

export const metadata = { title: "Ficha 360 do político" };

export default async function Politicos({ searchParams }: PageProps<"/politicos">) {
  const sp = await searchParams;
  const uf = (Array.isArray(sp.uf) ? sp.uf[0] : sp.uf ?? "").toUpperCase();
  const nome = (Array.isArray(sp.nome) ? sp.nome[0] : sp.nome ?? "").trim();
  const casa = (Array.isArray(sp.casa) ? sp.casa[0] : sp.casa ?? "todos") as "todos" | "camara" | "senado";

  const [deps, sens] = await Promise.all([
    casa !== "senado" ? safe(listDeputados({ uf: uf || undefined, nome: nome || undefined })) : Promise.resolve({ data: [], error: null }),
    casa !== "camara" ? safe(listSenadores()) : Promise.resolve({ data: [], error: null }),
  ]);
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const senadores = (sens.data ?? []).filter((s) => (!uf || s.UfParlamentar === uf) && (!nome || norm(s.NomeParlamentar + " " + s.NomeCompletoParlamentar).includes(norm(nome))));

  return (
    <>
      <PageHead
        kicker="Módulo 01"
        title="Ficha 360 do político"
        stamp="ao vivo"
        stampTone="verde"
        lead="513 deputados federais e 81 senadores em exercício. Clique em qualquer um para a ficha completa: gastos nota a nota, presença, votações, produtividade, comissões, linha do tempo, notícias e red flags calculadas na hora."
        right={
          <form className="card p-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto] items-end min-w-[20rem]">
            <label className="block">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Nome</span>
              <input name="nome" defaultValue={nome} className="input" placeholder="sobrenome basta" />
            </label>
            <label className="block">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">UF</span>
              <select name="uf" defaultValue={uf} className="input">
                <option value="">Todas</option>
                {UFS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Casa</span>
              <select name="casa" defaultValue={casa} className="input">
                <option value="todos">Ambas</option>
                <option value="camara">Câmara</option>
                <option value="senado">Senado</option>
              </select>
            </label>
            <button className="btn" type="submit">Filtrar</button>
          </form>
        }
      />

      {casa !== "senado" && (
        <Section kicker="Câmara" title={`Deputados federais${uf ? ` · ${uf}` : ""} (${deps.data?.length ?? 0})`}>
          {deps.error && <Notice tone="warn" title="Câmara dos Deputados">API não respondeu: {deps.error}</Notice>}
          {deps.data && !deps.data.length && <Empty>Nenhum deputado com esse filtro.</Empty>}
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {(deps.data ?? []).map((d) => (
              <Link key={d.id} href={`/politicos/deputado/${d.id}`} className="card flex items-center gap-3 p-2.5 hover:-translate-y-0.5 transition-transform">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.urlFoto} alt="" loading="lazy" className="h-12 w-10 object-cover grayscale contrast-125" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{d.nome}</div>
                  <div className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">{d.siglaPartido}-{d.siglaUf}</div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {casa !== "camara" && (
        <Section kicker="Senado" title={`Senadores${uf ? ` · ${uf}` : ""} (${senadores.length})`}>
          {sens.error && <Notice tone="warn" title="Senado Federal">API não respondeu: {sens.error}</Notice>}
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {senadores.map((s) => (
              <Link key={s.CodigoParlamentar} href={`/politicos/senador/${s.CodigoParlamentar}`} className="card flex items-center gap-3 p-2.5 hover:-translate-y-0.5 transition-transform">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.UrlFotoParlamentar} alt="" loading="lazy" className="h-12 w-10 object-cover grayscale contrast-125" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{s.NomeParlamentar}</div>
                  <div className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">{s.SiglaPartidoParlamentar}-{s.UfParlamentar}</div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section>
        <Notice tone="info" title="Cobertura">
          Hoje: Câmara e Senado ao vivo. Governadores, prefeitos, vereadores e deputados estaduais entram pela ficha de{" "}
          <Link href="/candidatos" className="underline">candidato (TSE)</Link>; assembleias e câmaras municipais com API (SAPL) estão no roadmap — veja{" "}
          <Link href="/apis" className="underline">o catálogo</Link> e ajude a conectar a sua.
        </Notice>
      </Section>
    </>
  );
}
