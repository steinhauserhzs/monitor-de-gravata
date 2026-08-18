/**
 * Ingere as notas da cota parlamentar (CEAP) no Postgres — é o que torna possível o cruzamento
 * "esta empresa recebeu dinheiro de cota de N deputados", impossível de fazer a cada requisição.
 *
 * Fonte oficial: https://www.camara.leg.br/cotas/Ano-<ano>.json.zip (arquivo publicado pela Câmara).
 * Cada linha guarda fonte_url e coletado_em — o banco é índice derivado, nunca fonte da verdade.
 *
 * Uso: node scripts/ingerir-cota.mjs [ano]
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { neon } from "@neondatabase/serverless";

const ano = Number(process.argv[2]) || new Date().getFullYear();
const url = `https://www.camara.leg.br/cotas/Ano-${ano}.json.zip`;

const dbUrl =
  process.env.DATABASE_URL ||
  (fs.existsSync(".env.local") &&
    fs.readFileSync(".env.local", "utf8").split("\n").find((l) => l.startsWith("DATABASE_URL"))?.split("=").slice(1).join("=").replace(/^"|"$/g, "").trim());
if (!dbUrl) { console.error("DATABASE_URL ausente."); process.exit(1); }
const sql = neon(dbUrl);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cota-"));
const zip = path.join(tmp, "c.zip");
console.log(`baixando ${url} …`);
const res = await fetch(url);
if (!res.ok) { console.error(`HTTP ${res.status}`); process.exit(1); }
fs.writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
execFileSync("unzip", ["-o", "-q", zip, "-d", tmp]);
const arq = fs.readdirSync(tmp).find((f) => f.endsWith(".json"));
const linhas = (JSON.parse(fs.readFileSync(path.join(tmp, arq), "utf8")).dados ?? []);
console.log(`${linhas.length.toLocaleString("pt-BR")} notas`);

// mapa nome+UF → id da API v2 (o arquivo de cotas usa outro id)
const apiJson = await (await fetch("https://dadosabertos.camara.leg.br/api/v2/deputados?itens=513&ordem=ASC&ordenarPor=nome", { headers: { Accept: "application/json" } })).json();
const chave = (n, uf) => `${(n || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim()}|${uf}`;
const mapa = new Map((apiJson.dados ?? []).map((d) => [chave(d.nome, d.siglaUf), String(d.id)]));

const hoje = new Date().toISOString().slice(0, 10);
const registros = [];
for (const l of linhas) {
  const idApi = mapa.get(chave(l.nomeParlamentar, l.siglaUF));
  if (!idApi) continue;
  registros.push([
    "camara", idApi, l.nomeParlamentar ?? "", l.siglaUF ?? null, l.siglaPartido ?? null,
    Number(l.ano ?? ano), Number(l.mes ?? 0), l.descricao ?? "Outros",
    String(l.cnpjCPF ?? "").replace(/\D/g, "") || null, l.fornecedor ?? null,
    Number(l.valorLiquido ?? 0), url, hoje,
  ]);
}
console.log(`${registros.length.toLocaleString("pt-BR")} notas com deputado identificado — gravando…`);

await sql.query(`delete from cota_parlamentar where casa = 'camara' and ano = ${ano}`);
const LOTE = 500;
for (let i = 0; i < registros.length; i += LOTE) {
  const lote = registros.slice(i, i + LOTE);
  const valores = lote.map((_, j) => `($${j * 13 + 1},$${j * 13 + 2},$${j * 13 + 3},$${j * 13 + 4},$${j * 13 + 5},$${j * 13 + 6},$${j * 13 + 7},$${j * 13 + 8},$${j * 13 + 9},$${j * 13 + 10},$${j * 13 + 11},$${j * 13 + 12},$${j * 13 + 13})`).join(",");
  await sql.query(
    `insert into cota_parlamentar (casa,id_parlamentar,nome,uf,partido,ano,mes,tipo,fornecedor_documento,fornecedor_nome,valor,fonte_url,coletado_em) values ${valores}`,
    lote.flat(),
  );
  process.stdout.write(`\r  ${Math.min(i + LOTE, registros.length)}/${registros.length}`);
}
await sql.query(
  `insert into derivado_meta (chave,gerado_em,fonte_url,linhas,observacao) values ($1, now(), $2, $3, $4)
   on conflict (chave) do update set gerado_em = now(), fonte_url = excluded.fonte_url, linhas = excluded.linhas, observacao = excluded.observacao`,
  [`cota_parlamentar:camara:${ano}`, url, registros.length, "arquivo anual oficial da Câmara; deputados casados por nome+UF com a API v2"],
);
console.log(`\nok: ${registros.length} notas de ${ano} no banco.`);
