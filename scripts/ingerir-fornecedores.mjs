/**
 * Ingere fornecedores de contratos públicos (PNCP) agregados por CNPJ.
 * Junto com a cota parlamentar, habilita o cruzamento "empresa que recebe cota de deputado
 * TAMBÉM tem contrato público" — impossível de calcular a cada requisição.
 *
 * Fonte: https://pncp.gov.br/api/consulta/v1/contratos (Lei 14.133).
 * Uso: node scripts/ingerir-fornecedores.mjs [dias]   (padrão: 180)
 */
import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

const dias = Number(process.argv[2]) || 180;
const dbUrl =
  process.env.DATABASE_URL ||
  (fs.existsSync(".env.local") &&
    fs.readFileSync(".env.local", "utf8").split("\n").find((l) => l.startsWith("DATABASE_URL"))?.split("=").slice(1).join("=").replace(/^"|"$/g, "").trim());
if (!dbUrl) { console.error("DATABASE_URL ausente."); process.exit(1); }
const sql = neon(dbUrl);

const ymd = (d) => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
const fim = new Date();
const BASE = "https://pncp.gov.br/api/consulta/v1/contratos";
const TAM = 50; // o PNCP devolve 400 acima disso

const agregado = new Map();
let lidos = 0;

/** O PNCP limita a janela; varremos em blocos de 30 dias, página a página. */
for (let bloco = 0; bloco * 30 < dias; bloco++) {
  const dFim = new Date(fim.getTime() - bloco * 30 * 86400000);
  const dIni = new Date(fim.getTime() - Math.min((bloco + 1) * 30, dias) * 86400000);
  let pagina = 1;
  while (pagina <= 40) {
    const u = `${BASE}?dataInicial=${ymd(dIni)}&dataFinal=${ymd(dFim)}&pagina=${pagina}&tamanhoPagina=${TAM}`;
    let j;
    try {
      const r = await fetch(u, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 MonitorDeGravata" }, signal: AbortSignal.timeout(45000) });
      if (!r.ok) break;
      j = await r.json();
    } catch { break; }
    const dados = j?.data ?? [];
    if (!dados.length) break;
    for (const c of dados) {
      const cnpj = String(c.niFornecedor ?? "").replace(/\D/g, "");
      if (cnpj.length !== 14) continue; // pessoa física fica de fora (CPF é mascarado)
      const a = agregado.get(cnpj) ?? { razao: c.nomeRazaoSocialFornecedor ?? "", n: 0, valor: 0, ufs: new Set(), orgaos: new Set() };
      a.n++;
      a.valor += Number(c.valorGlobal ?? c.valorInicial ?? 0);
      if (c.unidadeOrgao?.ufSigla) a.ufs.add(c.unidadeOrgao.ufSigla);
      if (c.orgaoEntidade?.razaoSocial) a.orgaos.add(c.orgaoEntidade.razaoSocial);
      agregado.set(cnpj, a);
    }
    lidos += dados.length;
    process.stdout.write(`\r  bloco ${bloco + 1} pág ${pagina} · ${lidos.toLocaleString("pt-BR")} contratos · ${agregado.size.toLocaleString("pt-BR")} fornecedores`);
    if ((j.paginasRestantes ?? 0) <= 0) break;
    pagina++;
  }
}
console.log(`\n${agregado.size.toLocaleString("pt-BR")} fornecedores em ${lidos.toLocaleString("pt-BR")} contratos — gravando…`);

const hoje = new Date().toISOString().slice(0, 10);
const linhas = [...agregado.entries()].map(([cnpj, a]) => [
  cnpj, a.razao, a.n, Math.round(a.valor * 100) / 100, [...a.ufs], [...a.orgaos].slice(0, 20), BASE, hoje,
]);

await sql.query("truncate fornecedor_contratos");
const LOTE = 300;
for (let i = 0; i < linhas.length; i += LOTE) {
  const lote = linhas.slice(i, i + LOTE);
  const vals = lote.map((_, j) => `($${j * 8 + 1},$${j * 8 + 2},$${j * 8 + 3},$${j * 8 + 4},$${j * 8 + 5},$${j * 8 + 6},$${j * 8 + 7},$${j * 8 + 8})`).join(",");
  await sql.query(
    `insert into fornecedor_contratos (cnpj,razao_social,n_contratos,valor_total,ufs,orgaos,fonte_url,coletado_em) values ${vals}
     on conflict (cnpj) do update set razao_social=excluded.razao_social, n_contratos=excluded.n_contratos, valor_total=excluded.valor_total, ufs=excluded.ufs, orgaos=excluded.orgaos, coletado_em=excluded.coletado_em`,
    lote.flat(),
  );
  process.stdout.write(`\r  ${Math.min(i + LOTE, linhas.length)}/${linhas.length}`);
}

// cruzamento materializado: fornecedor público que também recebe cota parlamentar
console.log("\ncruzando com a cota parlamentar…");
const cruz = await sql.query(`
  select f.cnpj, f.razao_social, f.n_contratos, f.valor_total,
         count(distinct c.id_parlamentar)::int as n_deputados,
         sum(c.valor)::numeric as valor_cota
    from fornecedor_contratos f
    join cota_parlamentar c on c.fornecedor_documento = f.cnpj
   group by f.cnpj, f.razao_social, f.n_contratos, f.valor_total
   order by valor_cota desc
   limit 500`);
console.log(`  ${cruz.length} empresa(s) recebem cota parlamentar E têm contrato público.`);
cruz.slice(0, 5).forEach((r) => console.log(`   ${r.razao_social} — cota R$ ${Number(r.valor_cota).toLocaleString("pt-BR")} de ${r.n_deputados} dep. · ${r.n_contratos} contrato(s) R$ ${Number(r.valor_total).toLocaleString("pt-BR")}`));

await sql.query(
  `insert into derivado_meta (chave,gerado_em,fonte_url,linhas,observacao) values ($1, now(), $2, $3, $4)
   on conflict (chave) do update set gerado_em=now(), fonte_url=excluded.fonte_url, linhas=excluded.linhas, observacao=excluded.observacao`,
  ["fornecedor_contratos:pncp", BASE, linhas.length, `contratos publicados nos últimos ${dias} dias`],
);
console.log("ok.");
