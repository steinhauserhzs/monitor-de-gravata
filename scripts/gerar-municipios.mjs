/** Gera data/derivados/municipios-tse.json — código TSE de cada município (necessário para
 *  listar prefeitos e vereadores, que o TSE organiza por município e não por UF).
 *  Uso: node scripts/gerar-municipios.mjs */
import fs from "node:fs";
const ID_2024 = 2045202024;
const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
const out = [];
for (const uf of UFS) {
  try {
    const r = await fetch(`https://divulgacandcontas.tse.jus.br/divulga/rest/v1/eleicao/buscar/${uf}/${ID_2024}/municipios`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(40000) });
    if (!r.ok) { console.log(`  ${uf}: HTTP ${r.status}`); continue; }
    const j = await r.json();
    const lista = j.municipios ?? j ?? [];
    for (const m of lista) out.push({ uf, c: String(m.codigo ?? m.cdMunicipio ?? m.id), n: (m.nome ?? m.nmMunicipio ?? "").trim() });
    process.stdout.write(`\r  ${uf}: ${lista.length} municípios (total ${out.length})`);
  } catch (e) { console.log(`  ${uf}: ${String(e).slice(0, 60)}`); }
}
fs.writeFileSync("data/derivados/municipios-tse.json", JSON.stringify({ gerado_em: new Date().toISOString().slice(0, 10), fonte: "https://divulgacandcontas.tse.jus.br/divulga/rest/v1/eleicao/buscar/{UF}/{idEleicao}/municipios", total: out.length, municipios: out }));
console.log(`\nok: ${out.length} municípios → data/derivados/municipios-tse.json`);
