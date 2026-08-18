/**
 * Gera data/derivados/ceap-<ano>.json a partir do arquivo oficial anual da Câmara
 * (https://www.camara.leg.br/cotas/Ano-<ano>.json.zip) — fallback para quando a API
 * /deputados/{id}/despesas está fora do ar (aconteceu em 17-18/08/2026).
 * Guarda agregados por deputado (total, por tipo, por mês, top fornecedores, maior nota).
 * Uso: node scripts/gerar-ceap.mjs [ano]
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import os from "node:os";

const ano = Number(process.argv[2]) || new Date().getFullYear();
const url = `https://www.camara.leg.br/cotas/Ano-${ano}.json.zip`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ceap-"));
const zip = path.join(tmp, "ceap.zip");

console.log(`baixando ${url} …`);
const res = await fetch(url);
if (!res.ok) { console.error(`falhou: HTTP ${res.status}`); process.exit(1); }
fs.writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
console.log(`ok (${(fs.statSync(zip).size / 1e6).toFixed(1)} MB) — descompactando`);
execFileSync("unzip", ["-o", "-q", zip, "-d", tmp]);
const jsonFile = fs.readdirSync(tmp).find((f) => f.endsWith(".json"));
if (!jsonFile) { console.error("nenhum .json no zip"); process.exit(1); }

const bruto = JSON.parse(fs.readFileSync(path.join(tmp, jsonFile), "utf8"));
const linhas = bruto.dados ?? bruto;
console.log(`${linhas.length.toLocaleString("pt-BR")} notas`);

const porDep = new Map();
for (const l of linhas) {
  const id = String(l.numeroDeputadoID ?? l.idDeputado ?? l.numeroCarteiraParlamentar ?? "");
  if (!id) continue;
  const v = Number(l.valorLiquido ?? l.vlrLiquido ?? 0);
  const d = porDep.get(id) ?? { nome: l.nomeParlamentar ?? l.txNomeParlamentar ?? "", uf: l.siglaUF ?? l.sgUF ?? "", partido: l.siglaPartido ?? l.sgPartido ?? "", total: 0, qtd: 0, porTipo: {}, porMes: {}, forn: {}, maior: null };
  d.total += v; d.qtd++;
  const tipo = l.descricao ?? l.txtDescricao ?? "Outros";
  d.porTipo[tipo] = (d.porTipo[tipo] ?? 0) + v;
  const mes = Number(l.mes ?? l.numMes ?? 0);
  d.porMes[mes] = (d.porMes[mes] ?? 0) + v;
  const cnpj = String(l.cnpjCPF ?? l.txtCNPJCPF ?? "").replace(/\D/g, "");
  const nomeF = l.fornecedor ?? l.txtFornecedor ?? "—";
  const k = cnpj || nomeF;
  const f = d.forn[k] ?? { fornecedor: nomeF, cnpj, total: 0, qtd: 0 };
  f.total += v; f.qtd++; d.forn[k] = f;
  if (!d.maior || v > d.maior.valorLiquido) d.maior = { valorLiquido: v, nomeFornecedor: nomeF, cnpjCpfFornecedor: cnpj, tipoDespesa: tipo, dataDocumento: l.dataEmissao ?? l.datEmissao ?? "" };
  porDep.set(id, d);
}

// o arquivo de cotas usa numeroDeputadoID (id interno), não o id da API v2 → casamos por nome + UF
console.log("casando com a API v2 (/deputados) …");
const apiRes = await fetch("https://dadosabertos.camara.leg.br/api/v2/deputados?itens=513&ordem=ASC&ordenarPor=nome", { headers: { Accept: "application/json" } });
const apiJson = await apiRes.json();
const chave = (n, uf) => `${(n || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim()}|${uf}`;
const mapaApi = new Map((apiJson.dados ?? []).map((d) => [chave(d.nome, d.siglaUf), String(d.id)]));

const saida = { ano, gerado_em: new Date().toISOString().slice(0, 10), fonte: url, deputados: {}, semIdApi: 0 };
for (const [id, d] of porDep) {
  const idApi = mapaApi.get(chave(d.nome, d.uf));
  if (!idApi) { saida.semIdApi++; continue; }
  saida.deputados[idApi] = {
    nome: d.nome, uf: d.uf, partido: d.partido, total: Math.round(d.total * 100) / 100, qtd: d.qtd,
    porTipo: Object.entries(d.porTipo).map(([tipo, total]) => ({ tipo, total: Math.round(total * 100) / 100 })).sort((a, b) => b.total - a.total),
    porMes: Object.entries(d.porMes).map(([mes, total]) => ({ mes: Number(mes), total: Math.round(total * 100) / 100 })).sort((a, b) => a.mes - b.mes),
    porFornecedor: Object.values(d.forn).map((f) => ({ ...f, total: Math.round(f.total * 100) / 100 })).sort((a, b) => b.total - a.total).slice(0, 15),
    maiorNota: d.maior,
  };
}
const out = `data/derivados/ceap-${ano}.json`;
fs.writeFileSync(out, JSON.stringify(saida));
console.log(`ok: ${Object.keys(saida.deputados).length} deputados casados com a API v2 (${saida.semIdApi} sem correspondência — lideranças e ex-deputados) → ${out} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
