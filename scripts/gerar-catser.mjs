// Gera data/derivados/catser.json — catálogo de SERVIÇOS (CATSER) do Compras.gov.br.
// Uso: node scripts/gerar-catser.mjs
import fs from "node:fs";
const BASE = "https://dadosabertos.compras.gov.br/modulo-servico/6_consultarItemServico";
const out = [];
let pagina = 1, total = null;
while (true) {
  const r = await fetch(`${BASE}?pagina=${pagina}&tamanhoPagina=500`, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`HTTP ${r.status} na página ${pagina}`);
  const j = await r.json();
  total ??= j.totalRegistros;
  for (const s of j.resultado) out.push({ c: s.codigoServico, n: (s.nomeServico || "").trim(), k: s.codigoClasse, kn: s.nomeClasse, g: s.nomeGrupo });
  process.stdout.write(`\rpágina ${pagina}/${j.totalPaginas} (${out.length}/${total})`);
  if (j.paginasRestantes <= 0) break;
  pagina++;
}
out.sort((a, b) => a.n.localeCompare(b.n));
fs.writeFileSync("data/derivados/catser.json", JSON.stringify({ gerado_em: new Date().toISOString().slice(0, 10), fonte: BASE, total: out.length, servicos: out }));
console.log(`\nok: ${out.length} serviços → data/derivados/catser.json`);
