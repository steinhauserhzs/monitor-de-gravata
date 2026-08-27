/**
 * Gera o índice de BENS declarados a partir do zip oficial de dados abertos
 * do TSE (bem_candidato_<ano>.zip) — mesma lógica do gerar-candidatos-do-zip.
 *
 * Com este índice, a ficha do candidato mostra os bens (tabela + total + a
 * evolução patrimonial entre eleições) mesmo com o DivulgaCand ao vivo
 * bloqueado. Uma nuance importante do arquivo oficial: quando o índice de um
 * ano EXISTE e o candidato não tem linha nele, isso é um fato ("declarou zero
 * bens") — diferente de "não conseguimos consultar". O site trata os dois
 * casos de formas diferentes de propósito.
 *
 * COMO USAR
 *   1. Baixe no SEU navegador:
 *      https://cdn.tse.jus.br/estatistica/sead/odsele/bem_candidato/bem_candidato_<ano>.zip
 *   2. node scripts/gerar-bens-do-zip.mjs ~/Downloads/bem_candidato_2026.zip
 *
 * Saída: data/derivados/bens-<ano>/<uf>.json → { sq: [[tipo, descrição, valor], …] }.
 * Se data/derivados/candidatos-<ano>/ existir, só os candidatos indexados são
 * mantidos (descarta vices/suplentes, que têm bens no zip mas não têm ficha).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const zipPath = process.argv[2];
if (!zipPath || !fs.existsSync(zipPath)) {
  console.error("Uso: node scripts/gerar-bens-do-zip.mjs <caminho do bem_candidato_<ano>.zip>");
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "bem-cand-"));
execFileSync("unzip", ["-o", "-q", zipPath, "-d", tmp]);
const csvs = fs.readdirSync(tmp).filter((f) => f.toLowerCase().endsWith(".csv"));
const brasil = csvs.find((f) => /BRASIL/i.test(f));
const fontes = brasil ? [brasil] : csvs;
if (!fontes.length) { console.error("Nenhum CSV dentro do zip."); process.exit(1); }

function* linhasCSV(texto) {
  let campo = "", linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (aspas) {
      if (ch === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else aspas = false; }
      else campo += ch;
    } else if (ch === '"') aspas = true;
    else if (ch === ";") { linha.push(campo); campo = ""; }
    else if (ch === "\n") { linha.push(campo.replace(/\r$/, "")); yield linha; campo = ""; linha = []; }
    else campo += ch;
  }
  if (campo.length || linha.length) { linha.push(campo.replace(/\r$/, "")); yield linha; }
}
const limpo = (v) => { const t = (v ?? "").trim(); return /^#(NULO|NE)#?$/.test(t) || t === "-1" || t === "-3" ? "" : t; };
// "1.234.567,89" → 1234567.89
const valorBR = (v) => Number(limpo(v).replace(/\./g, "").replace(",", ".")) || 0;

const porUF = new Map(); // uf -> Map(sq -> [{ord, tipo, desc, valor}])
let anoDetectado = 0, geradoPeloTSE = "", totalLinhas = 0;

for (const nome of fontes) {
  const texto = fs.readFileSync(path.join(tmp, nome)).toString("latin1");
  let idx = null;
  for (const linha of linhasCSV(texto)) {
    if (!idx) {
      const cab = linha.map((c) => c.replace(/^"|"$/g, "").trim().toUpperCase());
      idx = Object.fromEntries(cab.map((c, i) => [c, i]));
      for (const obrig of ["SG_UF", "SQ_CANDIDATO", "DS_BEM_CANDIDATO", "VR_BEM_CANDIDATO"]) {
        if (!(obrig in idx)) { console.error(`Coluna ${obrig} ausente em ${nome} — o layout do TSE mudou?`); process.exit(1); }
      }
      continue;
    }
    totalLinhas++;
    const v = (col) => limpo(linha[idx[col]]);
    anoDetectado ||= Number(v("ANO_ELEICAO"));
    geradoPeloTSE ||= v("DT_GERACAO");
    const uf = v("SG_UF");
    const sq = v("SQ_CANDIDATO");
    if (!uf || !sq) continue;
    if (!porUF.has(uf)) porUF.set(uf, new Map());
    const m = porUF.get(uf);
    if (!m.has(sq)) m.set(sq, []);
    m.get(sq).push({
      ord: Number(v("NR_ORDEM_BEM_CANDIDATO")) || m.get(sq).length + 1,
      tipo: v("DS_TIPO_BEM_CANDIDATO"),
      desc: v("DS_BEM_CANDIDATO"),
      valor: valorBR(linha[idx["VR_BEM_CANDIDATO"]]),
    });
  }
}
fs.rmSync(tmp, { recursive: true, force: true });
if (!anoDetectado) { console.error("ANO_ELEICAO não encontrado."); process.exit(1); }

// mantém só quem tem ficha no índice de candidatos (fora vices/suplentes)
const dirCand = path.join("data", "derivados", `candidatos-${anoDetectado}`);
let conhecidos = null;
if (fs.existsSync(dirCand)) {
  conhecidos = new Set();
  for (const f of fs.readdirSync(dirCand)) {
    for (const c of JSON.parse(fs.readFileSync(path.join(dirCand, f), "utf8")).candidatos) conhecidos.add(String(c.i));
  }
}

const DIR = path.join("data", "derivados", `bens-${anoDetectado}`);
fs.mkdirSync(DIR, { recursive: true });
let totalCand = 0, totalBens = 0, descartados = 0;
for (const [uf, m] of [...porUF.entries()].sort()) {
  const bens = {};
  for (const [sq, lista] of m) {
    if (conhecidos && !conhecidos.has(sq)) { descartados++; continue; }
    lista.sort((a, b) => a.ord - b.ord);
    bens[sq] = lista.map((b) => [b.tipo, b.desc, b.valor]);
    totalCand++; totalBens += lista.length;
  }
  if (!Object.keys(bens).length) continue;
  fs.writeFileSync(
    path.join(DIR, `${uf}.json`),
    JSON.stringify({
      ano: anoDetectado, uf,
      fonte: `https://dadosabertos.tse.jus.br/dataset/candidatos-${anoDetectado} (bem_candidato, CC-BY)`,
      coletado_em: new Date().toISOString().slice(0, 10),
      gerado_pelo_tse_em: geradoPeloTSE || null,
      bens,
    }),
  );
}
console.log(`ok: ${totalBens} bens de ${totalCand} candidatos (${totalLinhas} linhas; ${descartados} de vices/suplentes descartados) → ${DIR}/`);
console.log(`zip gerado pelo TSE em: ${geradoPeloTSE || "(não informado)"}`);
