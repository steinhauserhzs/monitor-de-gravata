/**
 * Gera o índice local de candidatos a partir do ZIP OFICIAL de dados abertos
 * do TSE (consulta_cand_<ano>.zip) — sem tocar na API do DivulgaCand.
 *
 * POR QUE ESTE CAMINHO
 * O DivulgaCand fica atrás de um WAF que bloqueia consultas automatizadas
 * (100% de 403 a partir da Vercel; bloqueio após ~15 requisições de máquina
 * comum). O portal de dados abertos publica o MESMO conteúdo em um único
 * arquivo, sob licença aberta — 1 download no navegador substitui 136
 * chamadas de API. É o caminho previsto pelo próprio TSE para uso em lote.
 *
 * COMO USAR
 *   1. Baixe no SEU navegador (o WAF aceita navegador normalmente):
 *      https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip
 *      (página do conjunto: https://dadosabertos.tse.jus.br/dataset/candidatos-2026)
 *   2. node scripts/gerar-candidatos-do-zip.mjs ~/Downloads/consulta_cand_2026.zip
 *
 * Saída: data/derivados/candidatos-<ano>/<cargo>-<uf>.json — mesmo formato do
 * gerar-candidatos.mjs (a listagem lê esses arquivos; a ficha segue ao vivo).
 * O índice é DERIVADO, nunca fonte da verdade: cada arquivo carrega fonte,
 * data da coleta e a data de geração informada pelo próprio TSE no CSV.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const zipPath = process.argv[2];
if (!zipPath || !fs.existsSync(zipPath)) {
  console.error("Uso: node scripts/gerar-candidatos-do-zip.mjs <caminho do consulta_cand_<ano>.zip>");
  process.exit(1);
}

const CARGOS = { 1: "Presidente", 3: "Governador", 5: "Senador", 6: "Deputado Federal", 7: "Deputado Estadual", 8: "Deputado Distrital" };
const ELEICOES = { 2026: 20322002026, 2024: 2045202024, 2022: 2040602022, 2020: 2030402020, 2018: 2022802018 };

// ── 1. extrair ───────────────────────────────────────────────────────────────
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "consulta-cand-"));
execFileSync("unzip", ["-o", "-q", zipPath, "-d", tmp]);
const csvs = fs.readdirSync(tmp).filter((f) => f.toLowerCase().endsWith(".csv"));
// o zip traz um CSV _BRASIL com tudo, mais um por UF; preferimos o BRASIL
const brasil = csvs.find((f) => /BRASIL/i.test(f));
const fontes = brasil ? [brasil] : csvs;
if (!fontes.length) { console.error("Nenhum CSV dentro do zip."); process.exit(1); }

// ── 2. parser CSV (latin1, ';', aspas duplas) ───────────────────────────────
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
// #NULO / #NE são os marcadores do dicionário do TSE para "não se aplica" /
// "não especificado" (aparecem com e sem # final conforme o ano do layout)
const limpo = (v) => { const t = (v ?? "").trim(); return /^#(NULO|NE)#?$/.test(t) || t === "-1" || t === "-3" ? "" : t; };
// DD/MM/AAAA → AAAA-MM-DD. new Date("05/08/1962") interpretaria como 8 de maio
// (ordem americana) e a ficha exibiria a data de nascimento ERRADA em silêncio.
const isoData = (br) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br); return m ? `${m[3]}-${m[2]}-${m[1]}` : br || undefined; };

// ── 3. varrer e agrupar ─────────────────────────────────────────────────────
const grupos = new Map(); // `${cargo}-${uf}` -> Map(id -> candidato)
let anoDetectado = 0, geradoPeloTSE = "", totalLinhas = 0;

for (const nome of fontes) {
  const texto = fs.readFileSync(path.join(tmp, nome)).toString("latin1");
  let cab = null, idx = null;
  for (const linha of linhasCSV(texto)) {
    if (!cab) {
      cab = linha.map((c) => c.replace(/^"|"$/g, "").trim().toUpperCase());
      idx = Object.fromEntries(cab.map((c, i) => [c, i]));
      for (const obrig of ["SG_UF", "CD_CARGO", "SQ_CANDIDATO", "NM_URNA_CANDIDATO"]) {
        if (!(obrig in idx)) { console.error(`Coluna ${obrig} ausente em ${nome} — o layout do TSE mudou?`); process.exit(1); }
      }
      continue;
    }
    totalLinhas++;
    const v = (col) => limpo(linha[idx[col]]);
    const cargo = Number(v("CD_CARGO"));
    if (!CARGOS[cargo]) continue; // vices e suplentes ficam de fora, como no DivulgaCand
    anoDetectado ||= Number(v("ANO_ELEICAO"));
    geradoPeloTSE ||= v("DT_GERACAO");
    const uf = cargo === 1 ? "BR" : v("SG_UF");
    const chave = `${cargo}-${uf}`;
    if (!grupos.has(chave)) grupos.set(chave, new Map());
    const situacao = v("DS_DETALHE_SITUACAO_CAND") || v("DS_SITUACAO_CANDIDATURA");
    const tot = v("DS_SIT_TOT_TURNO");
    grupos.get(chave).set(v("SQ_CANDIDATO"), {
      i: Number(v("SQ_CANDIDATO")),
      n: v("NM_URNA_CANDIDATO"),
      c: v("NM_CANDIDATO"),
      u: Number(v("NR_CANDIDATO")) || 0,
      p: v("SG_PARTIDO"),
      pn: Number(v("NR_PARTIDO")) || 0,
      s: situacao,
      t: tot || null,
      // campos extras para a ficha funcionar mesmo com a API bloqueada —
      // tudo vem do mesmo registro oficial, nada é inferido
      nasc: isoData(v("DT_NASCIMENTO")),
      ocu: v("DS_OCUPACAO") || undefined,
      inst: v("DS_GRAU_INSTRUCAO") || undefined,
      gen: v("DS_GENERO") || undefined,
      cor: v("DS_COR_RACA") || undefined,
      ufn: v("SG_UF_NASCIMENTO") || undefined,
      munn: v("NM_MUNICIPIO_NASCIMENTO") || undefined,
      colig: v("NM_FEDERACAO") || v("NM_COLIGACAO") || undefined,
    });
  }
}

if (!anoDetectado) { console.error("ANO_ELEICAO não encontrado no CSV."); process.exit(1); }
const idEleicao = ELEICOES[anoDetectado] ?? null;

// ── 4. gravar ───────────────────────────────────────────────────────────────
const DIR = path.join("data", "derivados", `candidatos-${anoDetectado}`);
fs.mkdirSync(DIR, { recursive: true });
let totalGravado = 0;
const resumo = [];
for (const [chave, mapa] of [...grupos.entries()].sort()) {
  const [cargo, uf] = [Number(chave.split("-")[0]), chave.split("-")[1]];
  const candidatos = [...mapa.values()].sort((a, b) => a.n.localeCompare(b.n, "pt-BR"));
  fs.writeFileSync(
    path.join(DIR, `${chave}.json`),
    JSON.stringify({
      ano: anoDetectado, uf, cargo, cargoNome: CARGOS[cargo], idEleicao,
      fonte: "https://dadosabertos.tse.jus.br/dataset/candidatos-" + anoDetectado + " (consulta_cand, CC-BY)",
      coletado_em: new Date().toISOString().slice(0, 10),
      gerado_pelo_tse_em: geradoPeloTSE || null,
      total: candidatos.length, candidatos,
    }),
  );
  totalGravado += candidatos.length;
  resumo.push(`  ${CARGOS[cargo].padEnd(18)} ${uf.padEnd(3)} ${String(candidatos.length).padStart(5)}`);
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(resumo.join("\n"));
console.log(`\nok: ${totalGravado} candidatos (${totalLinhas} linhas lidas) → ${DIR}/`);
console.log(`zip gerado pelo TSE em: ${geradoPeloTSE || "(não informado)"}`);
