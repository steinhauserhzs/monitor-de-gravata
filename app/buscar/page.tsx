import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHead, Section, Empty, Notice } from "@/components/ui";
import { listDeputados } from "@/lib/camara";
import { listSenadores } from "@/lib/senado";
import { searchPNCP } from "@/lib/pncp";
import { safe } from "@/lib/fetcher";
import { onlyDigits, validCNPJ, brl, dateBR } from "@/lib/format";

export const dynamic = "force-dynamic";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default async function Buscar({ searchParams }: PageProps<"/buscar">) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q ?? "").trim();
  if (!q) redirect("/");

  const digits = onlyDigits(q);
  if (digits.length === 14 && validCNPJ(digits)) redirect(`/empresas/${digits}`);

  const [deps, sens, pncp] = await Promise.all([
    safe(listDeputados({ nome: q })),
    safe(listSenadores()),
    safe(searchPNCP({ q, tam: 10 })),
  ]);
  const senadores = (sens.data ?? []).filter((s) => norm(s.NomeParlamentar + " " + s.NomeCompletoParlamentar).includes(norm(q)));

  return (
    <>
      <PageHead kicker="Busca" title={<>Resultados para <span className="marker">{q}</span></>} />
      <Section kicker="Políticos" title="Deputados e senadores">
        {deps.error && <Notice tone="warn" title="Câmara">A API da Câmara não respondeu: {deps.error}</Notice>}
        {!deps.data?.length && !senadores.length && !deps.error && <Empty>Nenhum parlamentar em exercício com esse nome. Tente só o sobrenome, ou procure em <Link href="/candidatos" className="underline">Candidatos 2026</Link>.</Empty>}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(deps.data ?? []).map((d) => (
            <Link key={d.id} href={`/politicos/deputado/${d.id}`} className="card flex items-center gap-3 p-3 hover:-translate-y-0.5 transition-transform">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.urlFoto} alt="" className="h-14 w-11 object-cover grayscale" />
              <div>
                <div className="font-semibold leading-tight">{d.nome}</div>
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-3">Dep. federal · {d.siglaPartido}-{d.siglaUf}</div>
              </div>
            </Link>
          ))}
          {senadores.map((s) => (
            <Link key={s.CodigoParlamentar} href={`/politicos/senador/${s.CodigoParlamentar}`} className="card flex items-center gap-3 p-3 hover:-translate-y-0.5 transition-transform">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.UrlFotoParlamentar} alt="" className="h-14 w-11 object-cover grayscale" />
              <div>
                <div className="font-semibold leading-tight">{s.NomeParlamentar}</div>
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-3">Senador · {s.SiglaPartidoParlamentar}-{s.UfParlamentar}</div>
              </div>
            </Link>
          ))}
        </div>
      </Section>
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
    </>
  );
}
