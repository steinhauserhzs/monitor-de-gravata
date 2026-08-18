import { getJSON } from "./fetcher";

/**
 * Wikidata — linha do tempo (cargos ocupados P39, partidos P102, data de nascimento P569) e ids externos
 * (P4029 id Câmara, P8318 id Senado?, P4034 id TSE?). Uso: enriquecer a Ficha 360 com histórico
 * anterior ao mandato atual. Tudo com link para a fonte (Wikidata é editável — tratar como secundária).
 */
const WD = "https://www.wikidata.org/w/api.php";

export type WdHit = { id: string; label: string; description?: string };

export async function wdBuscar(nome: string, limit = 5): Promise<WdHit[]> {
  const r = await getJSON<{ search: { id: string; label: string; description?: string }[] }>(
    `${WD}?action=wbsearchentities&search=${encodeURIComponent(nome)}&language=pt&uselang=pt&format=json&limit=${limit}`,
    { revalidate: 86400 },
  );
  return (r.search ?? [])
    .filter((s) => /pol[ií]tic|deput|senador|governador|prefeit|vereador|minist/i.test(s.description ?? ""))
    .map((s) => ({ id: s.id, label: s.label, description: s.description }));
}

type Claim = {
  mainsnak: { datavalue?: { value: { id?: string; time?: string } } };
  qualifiers?: Record<string, { datavalue?: { value: { time?: string; id?: string } } }[]>;
};

export type EventoTimeline = { inicio?: string; fim?: string; tipo: "cargo" | "partido"; titulo: string; detalhe?: string; fonte: string; url: string };

const wdTime = (t?: string) => (t ? t.replace(/^\+/, "").slice(0, 10).replace(/-00/g, "-01") : undefined);

export async function wdTimeline(qid: string): Promise<EventoTimeline[]> {
  const r = await getJSON<{ claims: Record<string, Claim[]> }>(`${WD}?action=wbgetclaims&entity=${qid}&format=json`, {
    revalidate: 86400,
  });
  const claims = r.claims ?? {};
  const cargos = claims.P39 ?? [];
  const partidos = claims.P102 ?? [];
  const ids = new Set<string>();
  const rows: { tipo: "cargo" | "partido"; item?: string; inicio?: string; fim?: string; distrito?: string; legislatura?: string }[] = [];
  for (const c of cargos) {
    const item = c.mainsnak.datavalue?.value.id;
    if (!item) continue;
    ids.add(item);
    const q = c.qualifiers ?? {};
    const distrito = q.P768?.[0]?.datavalue?.value.id;
    const leg = q.P2937?.[0]?.datavalue?.value.id;
    if (distrito) ids.add(distrito);
    if (leg) ids.add(leg);
    rows.push({ tipo: "cargo", item, inicio: wdTime(q.P580?.[0]?.datavalue?.value.time), fim: wdTime(q.P582?.[0]?.datavalue?.value.time), distrito, legislatura: leg });
  }
  for (const c of partidos) {
    const item = c.mainsnak.datavalue?.value.id;
    if (!item) continue;
    ids.add(item);
    const q = c.qualifiers ?? {};
    rows.push({ tipo: "partido", item, inicio: wdTime(q.P580?.[0]?.datavalue?.value.time), fim: wdTime(q.P582?.[0]?.datavalue?.value.time) });
  }
  if (!ids.size) return [];
  const labels: Record<string, string> = {};
  const idArr = [...ids];
  for (let i = 0; i < idArr.length; i += 50) {
    const chunk = idArr.slice(i, i + 50);
    const lr = await getJSON<{ entities: Record<string, { labels?: Record<string, { value: string }> }> }>(
      `${WD}?action=wbgetentities&ids=${chunk.join("|")}&props=labels&languages=pt|pt-br|en&format=json`,
      { revalidate: 86400 },
    );
    for (const [id, e] of Object.entries(lr.entities ?? {})) labels[id] = e.labels?.pt?.value ?? e.labels?.["pt-br"]?.value ?? e.labels?.en?.value ?? id;
  }
  return rows
    .map((r) => ({
      inicio: r.inicio,
      fim: r.fim,
      tipo: r.tipo,
      titulo: labels[r.item!] ?? r.item!,
      detalhe: [r.distrito && labels[r.distrito], r.legislatura && labels[r.legislatura]].filter(Boolean).join(" · ") || undefined,
      fonte: "Wikidata",
      url: `https://www.wikidata.org/wiki/${qid}`,
    }))
    .sort((a, b) => (a.inicio ?? "0000").localeCompare(b.inicio ?? "0000"));
}
