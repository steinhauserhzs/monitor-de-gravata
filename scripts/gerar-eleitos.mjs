/**
 * Gera data/derivados/eleitos-<ano>.json — quem FOI ELEITO em cada cargo, direto do TSE.
 * Permite mostrar presidente, governadores, senadores e deputados estaduais/federais
 * na lista de políticos, não só quem tem mandato federal com API própria.
 * Uso: node scripts/gerar-eleitos.mjs [ano]
 */
import fs from "node:fs";

const ano = Number(process.argv[2]) || 2022;
const ELEICOES = { 2022: 2040602022, 2018: 2022802018, 2024: 2045202024, 2020: 2030402020 };
const idEleicao = ELEICOES[ano];
const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
const CARGOS = { 1: "Presidente", 3: "Governador", 5: "Senador", 6: "Deputado Federal", 7: "Deputado Estadual", 8: "Deputado Distrital" };
const ELEITO = /^eleito/i;

const out = [];
const busca = async (uf, cargo) => {
  try {
    const r = await fetch(`https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/listar/${ano}/${uf}/${idEleicao}/${cargo}/candidatos`, {
      headers: { Accept: "application/json" }, signal: AbortSignal.timeout(45000),
    });
    if (!r.ok) return [];
    const j = await r.json();
    return (j.candidatos ?? []).filter((c) => ELEITO.test(c.descricaoTotalizacao ?? "")).map((c) => ({
      id: c.id, nome: c.nomeUrna, nomeCompleto: c.nomeCompleto, partido: c.partido?.sigla ?? "", uf,
      cargo: CARGOS[cargo], cargoCod: cargo, numero: c.numero, situacao: c.descricaoTotalizacao,
      foto: c.fotoUrl || `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/${idEleicao}/${c.id}/${uf}`,
    }));
  } catch { return []; }
};

// presidente é nacional (UF = BR)
out.push(...(await busca("BR", 1)));
for (const cargo of [3, 5, 6, 7, 8]) {
  const lotes = [];
  for (let i = 0; i < UFS.length; i += 6) lotes.push(UFS.slice(i, i + 6));
  for (const lote of lotes) {
    const res = await Promise.all(lote.map((uf) => busca(uf, cargo)));
    out.push(...res.flat());
    process.stdout.write(`\r  cargo ${CARGOS[cargo]}: ${out.filter((o) => o.cargoCod === cargo).length} eleito(s)`);
  }
  console.log("");
}
fs.writeFileSync(`data/derivados/eleitos-${ano}.json`, JSON.stringify({ ano, gerado_em: new Date().toISOString().slice(0, 10), fonte: "https://divulgacandcontas.tse.jus.br/divulga/rest/v1", total: out.length, eleitos: out }));
console.log(`ok: ${out.length} eleitos → data/derivados/eleitos-${ano}.json`);
