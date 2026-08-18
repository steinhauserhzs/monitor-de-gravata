import Link from "next/link";
import { PageHead, Section, Notice } from "@/components/ui";
import { loadApis, type ApiEntry } from "@/lib/data";
import { temChavePortal } from "@/lib/transparencia";
import { temChaveFactCheck } from "@/lib/checagens";

export const revalidate = 3600;
export const metadata = { title: "Catálogo de APIs públicas do Brasil" };

const ESFERAS: Record<string, string> = {
  federal: "Federal (Executivo e órgãos)",
  legislativo: "Legislativo",
  eleitoral: "Eleitoral (TSE/TREs)",
  judiciario: "Judiciário e MP",
  controle: "Tribunais de Contas e controle",
  estadual: "Estados",
  municipal: "Municípios",
  economico: "Econômico e estatístico",
  civil: "Sociedade civil e agregadores",
};
const ORDEM = ["federal", "legislativo", "eleitoral", "judiciario", "controle", "estadual", "municipal", "economico", "civil"];

export default async function Apis({ searchParams }: PageProps<"/apis">) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q ?? "").toLowerCase().trim();
  const auth = (Array.isArray(sp.auth) ? sp.auth[0] : sp.auth ?? "").trim();
  const esf = (Array.isArray(sp.esfera) ? sp.esfera[0] : sp.esfera ?? "").trim();
  const all = loadApis();
  const apis = all.filter((a) => (!q || JSON.stringify(a).toLowerCase().includes(q)) && (!auth || a.auth === auth) && (!esf || a.esfera === esf));
  const grupos = new Map<string, ApiEntry[]>();
  for (const a of apis) grupos.set(a.esfera, [...(grupos.get(a.esfera) ?? []), a]);
  const cont = (s: string) => all.filter((a) => a.esfera === s).length;
  /** Chaves configuradas NESTE servidor — o status_verificado registra o teste do catálogo, não o estado do app. */
  const chaveConfigurada: Record<string, boolean> = {
    "portal-transparencia-federal": temChavePortal(),
    "portal-transparencia-api-dados": temChavePortal(),
    "google-factcheck-tools-api": temChaveFactCheck(),
  };
  const ok = all.filter((a) => /ok/.test(a.status_verificado ?? "")).length;
  const semChave = all.filter((a) => a.auth === "nenhuma").length;

  return (
    <>
      <PageHead
        kicker="Base viva"
        title="Catálogo de APIs públicas do Brasil"
        stamp={`${all.length} fontes`}
        stampTone="azul"
        lead={`Toda fonte de dado público que o Monitor conhece: ${semChave} sem chave, ${ok} testadas com sucesso. Cada entrada é um JSON em data/apis/ — adicionar uma API nova é um pull request de 30 linhas.`}
        right={
          <form className="card p-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto] items-end min-w-[20rem]">
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Buscar</span><input name="q" defaultValue={q} className="input" placeholder="contratos, TSE, CNPJ…" /></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Esfera</span>
              <select name="esfera" defaultValue={esf} className="input"><option value="">Todas</option>{ORDEM.map((e) => <option key={e} value={e}>{ESFERAS[e]} ({cont(e)})</option>)}</select></label>
            <label className="block"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">Auth</span>
              <select name="auth" defaultValue={auth} className="input"><option value="">Qualquer</option><option value="nenhuma">Sem chave</option><option value="chave-gratuita">Chave gratuita</option><option value="token">Token</option><option value="bulk-download">Só download</option></select></label>
            <button className="btn" type="submit">Filtrar</button>
          </form>
        }
      />
      <Section>
        <Notice tone="ok" title="O que significa o status">
          O <strong>status</strong> à direita é o resultado do último teste do catálogo, feito <em>sem</em> chave — por isso APIs pagas de cadastro
          aparecem como “401 sem chave (esperado)”. Quando o Monitor tem a chave configurada, a entrada ganha o selo{" "}
          <span className="stamp stamp--flat stamp--verde">chave ativa neste site</span> e os painéis que dependem dela funcionam de verdade.
        </Notice>
        <div className="h-4" />
        <Notice tone="info" title="Como esta lista cresce">
          Pesquisadores humanos e agentes testam cada endpoint com <code>curl</code> e registram o status real com data. Se um endpoint quebrar, abra issue "API quebrada"; se faltar uma (a Câmara Municipal da sua cidade, o TCE do seu estado), abra "nova API" com o JSON preenchido.{" "}
          <a className="underline" href="https://github.com/steinhauserhzs/monitor-de-gravata/tree/main/data/apis" target="_blank" rel="noopener noreferrer">Ver os arquivos ↗</a>
        </Notice>
      </Section>
      {ORDEM.filter((e) => grupos.has(e)).map((e) => (
        <Section key={e} kicker={ESFERAS[e]} title={`${grupos.get(e)!.length} fonte(s)`}>
          <div className="space-y-3">
            {grupos.get(e)!.map((a) => (
              <details key={a.id} id={a.id} className="card scroll-mt-24">
                <summary className="cursor-pointer p-4 flex flex-wrap items-center gap-3">
                  <span className={`stamp stamp--flat ${a.auth === "nenhuma" ? "stamp--verde" : a.auth === "chave-gratuita" ? "stamp--azul" : "stamp--ink"}`}>{a.auth}</span>
                  <span className="font-display text-lg leading-none">{a.nome}</span>
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">{a.orgao}{a.uf && a.uf !== "BR" ? ` · ${a.uf}` : ""}</span>
                  {chaveConfigurada[a.id] && <span className="stamp stamp--flat stamp--verde">chave ativa neste site</span>}
                  <span className={`ml-auto font-mono text-[0.6rem] uppercase tracking-[0.12em] ${/ok/.test(a.status_verificado ?? "") ? "text-verde" : /falhou/.test(a.status_verificado ?? "") ? "text-stamp" : "text-ink-3"}`}>{a.status_verificado ?? "não testado"}</span>
                </summary>
                <div className="px-4 pb-4 grid gap-4 md:grid-cols-[1fr_1fr]">
                  <div className="text-sm space-y-2">
                    <div><span className="font-mono text-[0.6rem] uppercase text-ink-3">Base</span><div className="font-mono text-xs break-all">{a.base_url}</div></div>
                    {a.docs_url && <div><span className="font-mono text-[0.6rem] uppercase text-ink-3">Docs</span><div><a href={a.docs_url} className="underline text-xs break-all" target="_blank" rel="noopener noreferrer">{a.docs_url}</a></div></div>}
                    <div><span className="font-mono text-[0.6rem] uppercase text-ink-3">Para que serve (anticorrupção)</span><p className="text-ink-2">{a.utilidade_anticorrupcao}</p></div>
                    {a.auth_como && <div><span className="font-mono text-[0.6rem] uppercase text-ink-3">Como autenticar</span><p className="text-ink-2 text-xs">{a.auth_como}</p></div>}
                    <div className="flex flex-wrap gap-1">{a.categorias?.map((c) => <span key={c} className="tab">{c}</span>)}</div>
                    <div className="font-mono text-[0.6rem] uppercase text-ink-3">formato: {a.formato?.join(", ")} · cors: {a.cors ?? "?"} · rate: {a.rate_limit ?? "?"}</div>
                    {a.notas && <p className="text-xs text-ink-3">{a.notas}</p>}
                  </div>
                  <div>
                    <div className="font-mono text-[0.6rem] uppercase text-ink-3 mb-1">Endpoints-chave</div>
                    <ul className="text-xs space-y-1.5">{a.endpoints_chave?.map((ep, i) => <li key={i}><span className="font-mono">{ep.metodo ?? "GET"} {ep.path}</span><div className="text-ink-2">{ep.descricao}</div></li>)}</ul>
                    <div className="mt-3 font-mono text-[0.58rem] uppercase text-ink-3">arquivo: data/apis/{a._arquivo} · id {a.id}</div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </Section>
      ))}
      {!apis.length && <Section><Notice tone="warn">Nada com esse filtro. <Link href="/apis" className="underline">Limpar</Link>.</Notice></Section>}
    </>
  );
}
