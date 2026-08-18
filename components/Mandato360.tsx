import Link from "next/link";
import type { Mandato360 as M } from "@/lib/mandato";
import { KPI, Bars, Panel } from "./ficha";
import { brl, dateBR, pct } from "@/lib/format";

/**
 * "O que ele(a) fez com o poder que já teve" — só aparece quando o candidato exerce
 * mandato hoje na Câmara ou no Senado. Tudo com fonte; nada de juízo de valor.
 */
export function Mandato360Painel({ m }: { m: M }) {
  const totalVotos = m.votos.length;
  const emendasTotal = (m.emendas ?? []).reduce((a, e) => a + e.empenhado, 0);
  const emendasPago = (m.emendas ?? []).reduce((a, e) => a + e.pago, 0);
  const verbaTotal = (m.cota?.total ?? 0) + emendasPago;

  return (
    <Panel
      kicker="§0"
      title={`O que já fez com o mandato — ${m.casa === "camara" ? "Câmara dos Deputados" : "Senado Federal"}`}
      right={
        <div className="flex items-center gap-2">
          {m.confianca === "provavel" && <span className="stamp stamp--flat stamp--azul">vínculo provável</span>}
          <Link href={m.urlFicha} className="font-mono text-[0.6rem] uppercase tracking-[0.12em] underline">ficha completa →</Link>
        </div>
      }
    >
      {m.confianca === "provavel" && (
        <p className="mb-3 text-xs text-ink-2 border-l-4 border-marker pl-3">
          Casamos este candidato com o parlamentar <strong>{m.nome} ({m.partido}-{m.uf})</strong> pelo nome. Nomes podem coincidir — confira na{" "}
          <a href={m.urlOficial} target="_blank" rel="noopener noreferrer" className="underline">página oficial</a> antes de concluir.
        </p>
      )}

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-5">
        <KPI label="Votou a favor" value={m.totalFavor} hint={totalVotos ? `de ${totalVotos} votações nominais localizadas (varredura de ~9 meses)` : "nenhuma votação nominal nas mais recentes — a maioria é simbólica"} tone="verde" />
        <KPI label="Votou contra" value={m.totalContra} hint={totalVotos ? pct(m.totalContra / totalVotos) + " das localizadas" : "—"} tone="stamp" />
        <KPI label="Verba pública usada" value={verbaTotal ? brl(verbaTotal) : "—"} hint={verbaTotal ? `cota ${m.cota?.ano ?? ""}: ${brl(m.cota?.total ?? 0)}${emendasPago ? ` · emendas pagas: ${brl(emendasPago)}` : ""}` : "cota do ano ainda não publicada e/ou sem emendas localizadas"} />
        <KPI label="Presença no plenário" value={m.presenca ? pct(m.presenca.presentes / Math.max(1, m.presenca.total)) : "—"} hint={m.presenca ? `${m.presenca.presentes}/${m.presenca.total} sessões deliberativas` : "indisponível nesta casa"} />
      </div>

      {m.temas.length > 0 && (
        <div className="mb-5">
          <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-2">Pautas que apresenta (temas das proposições de autoria)</div>
          <div className="flex flex-wrap gap-2">
            {m.temas.map((t) => (
              <span key={t.tema} className="tab">{t.tema} · {t.n}</span>
            ))}
          </div>
          <p className="mt-1 text-[0.68rem] text-ink-3">Temas classificados pela própria Câmara/Senado nas proposições que o parlamentar assinou — mede o que ele(a) propõe, não o que promete.</p>
        </div>
      )}

      {m.votos.length > 0 && (
        <div className="mb-5">
          <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-2">Como votou (votações nominais mais recentes)</div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Data</th><th>Matéria / objeto</th><th>Voto</th><th>Orientação do partido</th><th>Resultado</th></tr></thead>
              <tbody>
                {m.votos.slice(0, 15).map((v, i) => (
                  <tr key={i}>
                    <td className="font-mono text-xs whitespace-nowrap">{dateBR(v.data)}</td>
                    <td className="text-xs max-w-lg">
                      {v.materia && <span className="font-mono">{v.materia} — </span>}
                      {v.url ? <a href={v.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{(v.descricao || "").slice(0, 170)}</a> : (v.descricao || "").slice(0, 170)}
                    </td>
                    <td className="text-xs whitespace-nowrap">
                      <span className={`sev ${v.posicao === "a favor" ? "sev--ok" : v.posicao === "contra" ? "sev--alta" : "sev--baixa"}`}>{v.voto}</span>
                    </td>
                    <td className="font-mono text-xs">{v.orientacaoPartido ?? "—"}{v.seguiuPartido === false && <span className="ml-1 text-stamp">(divergiu)</span>}</td>
                    <td className="text-xs">{v.resultado ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(m.emendas?.length ?? 0) > 0 && (
        <div className="mb-5">
          <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-2">Emendas parlamentares (dinheiro público que direcionou)</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {m.emendas!.map((e) => (
              <span key={e.ano} className="tab">{e.ano} · {e.n} emenda(s) · empenhado {brl(e.empenhado)} · pago {brl(e.pago)}</span>
            ))}
          </div>
          {(m.emendasDestinos?.length ?? 0) > 0 && <Bars rows={m.emendasDestinos!.map((d) => ({ label: `${d.destino} · ${d.funcao}`, sub: String(d.ano), value: d.empenhado }))} />}
          <p className="mt-1 text-[0.68rem] text-ink-3">Total empenhado localizado: {brl(emendasTotal)}. Emenda empenhada ≠ paga ≠ obra entregue — o Portal permite seguir cada pagamento.</p>
        </div>
      )}

      {m.proposicoes.length > 0 && (
        <details>
          <summary className="cursor-pointer font-mono text-[0.65rem] uppercase tracking-[0.16em]">Últimas proposições de autoria</summary>
          <ul className="mt-2 space-y-1.5 text-sm">
            {m.proposicoes.map((p) => (
              <li key={p.id}>
                <a href={`https://www.camara.leg.br/propostas-legislativas/${p.id}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs underline underline-offset-2">{p.siglaTipo} {p.numero}/{p.ano}</a>{" "}
                <span className="text-ink-2">{(p.ementa || "").slice(0, 160)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="mt-4 text-[0.68rem] text-ink-3">
        Amostra: as votações <strong>nominais</strong> mais recentes do Plenário (a maioria das votações é simbólica e não registra voto individual).
        Não é o histórico completo do mandato — para isso, veja a <Link href={m.urlFicha} className="underline">ficha completa</Link> e o portal oficial.
      </p>
      <div className="mt-2 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-3">fontes: {m.fontes.join(" · ")}</div>
    </Panel>
  );
}
