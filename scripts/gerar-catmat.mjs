// Gera data/derivados/catmat-pdm.json — índice de PDMs (Padrão Descritivo de Material) do CATMAT
// Fonte: https://dadosabertos.compras.gov.br/modulo-material/3_consultarPdmMaterial (Compras.gov.br, MGI)
// Uso: node scripts/gerar-catmat.mjs
import fs from "node:fs";
const BASE = "https://dadosabertos.compras.gov.br/modulo-material/3_consultarPdmMaterial";
const out = [];
let pagina = 1, total = null;
while (true) {
  const r = await fetch(`${BASE}?pagina=${pagina}&tamanhoPagina=500&statusPdm=true`, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`HTTP ${r.status} na página ${pagina}`);
  const j = await r.json();
  total ??= j.totalRegistros;
  for (const p of j.resultado) out.push({ c: p.codigoPdm, n: p.nomePdm.replace(/^"|"$/g, "").trim(), k: p.codigoClasse, kn: p.nomeClasse, g: p.nomeGrupo });
  process.stdout.write(`\rpágina ${pagina}/${j.totalPaginas} (${out.length}/${total})`);
  if (j.paginasRestantes <= 0) break;
  pagina++;
}
out.sort((a, b) => a.n.localeCompare(b.n));
fs.writeFileSync("data/derivados/catmat-pdm.json", JSON.stringify({ gerado_em: new Date().toISOString().slice(0, 10), fonte: BASE, total: out.length, pdms: out }));
console.log(`\nok: ${out.length} PDMs → data/derivados/catmat-pdm.json`);
