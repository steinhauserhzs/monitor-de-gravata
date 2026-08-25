/**
 * Gera o índice local de candidatos: data/derivados/candidatos-<ano>/<cargo>-<uf>.json
 *
 * POR QUE ISSO EXISTE
 * O DivulgaCand do TSE fica atrás de um WAF (Akamai) que limita consultas
 * automatizadas: de dentro da Vercel a resposta é 403 em 100% das vezes, e
 * mesmo de uma máquina comum o bloqueio aparece depois de ~15 requisições.
 * A lista de SP para deputado federal sozinha tem 2,6 MB — buscar isso ao vivo
 * a cada page view nunca ia parar de pé.
 *
 * Então este script roda FORA da produção (máquina do mantenedor ou CI), guarda
 * só os campos que a listagem usa, e o site passa a ler do índice. Continua
 * valendo a regra do projeto: o índice é DERIVADO, nunca fonte da verdade —
 * cada arquivo carrega a fonte e a data da coleta, e a ficha individual segue
 * consultando o TSE ao vivo.
 *
 * Uso:
 *   node scripts/gerar-candidatos.mjs            # 2026, todos os cargos federais
 *   node scripts/gerar-candidatos.mjs 2026 6     # só deputado federal
 *   node scripts/gerar-candidatos.mjs 2026 6 SP  # só SP
 */
import fs from "node:fs";
import path from "node:path";

const ano = Number(process.argv[2]) || 2026;
const cargoFiltro = process.argv[3] ? Number(process.argv[3]) : null;
const ufFiltro = process.argv[4] ? process.argv[4].toUpperCase() : null;

const ELEICOES = { 2026: 20322002026, 2024: 2045202024, 2022: 2040602022, 2020: 2030402020, 2018: 2022802018 };
const idEleicao = ELEICOES[ano];
if (!idEleicao) { console.error(`Eleição ${ano} não mapeada.`); process.exit(1); }

const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
const CARGOS = { 1: "Presidente", 3: "Governador", 5: "Senador", 6: "Deputado Federal", 7: "Deputado Estadual", 8: "Deputado Distrital" };

const DIR = path.join("data", "derivados", `candidatos-${ano}`);
fs.mkdirSync(DIR, { recursive: true });

// Cabeçalhos completos de navegador: o Akamai do TSE recusa cliente que não se
// apresenta assim. Não é disfarce — o User-Agent identifica o projeto.
const HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "pt-BR,pt;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 MonitorDeGravata/0.1 (+https://github.com/steinhauserhzs/monitor-de-gravata)",
  "sec-ch-ua": '"Chromium";v="126", "Not(A:Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "Sec-Fetch-Site": "cross-site",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Dest": "empty",
};

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Uma requisição, com espera longa e crescente quando o WAF bloqueia. */
async function buscar(uf, cargo) {
  const url = `https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/listar/${ano}/${uf}/${idEleicao}/${cargo}/candidatos`;
  for (let tentativa = 1; tentativa <= 6; tentativa++) {
    try {
      const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(90000) });
      if (r.status === 403 || r.status === 429) {
        // rate limit: esperar de verdade (30s, 60s, 120s…) antes de insistir
        const espera = Math.min(30000 * 2 ** (tentativa - 1), 240000);
        process.stdout.write(` [bloqueado, esperando ${Math.round(espera / 1000)}s]`);
        await dormir(espera);
        continue;
      }
      if (!r.ok) return { erro: `${r.status} ${r.statusText}` };
      const j = await r.json();
      return { candidatos: j.candidatos ?? [] };
    } catch (e) {
      if (tentativa === 6) return { erro: e.message };
      await dormir(5000 * tentativa);
    }
  }
  return { erro: "bloqueado após 6 tentativas" };
}

/** Só o que a listagem precisa — chaves curtas porque isso vai para o repositório. */
const enxugar = (c) => ({
  i: c.id,
  n: c.nomeUrna ?? "",
  c: c.nomeCompleto ?? "",
  u: c.numero ?? 0,
  p: c.partido?.sigla ?? "",
  pn: c.partido?.numero ?? 0,
  s: c.descricaoSituacao ?? "",
  t: c.descricaoTotalizacao ?? null,
});

const cargos = cargoFiltro ? [cargoFiltro] : [1, 3, 5, 6, 7, 8];
let totalGeral = 0;
const falhas = [];

for (const cargo of cargos) {
  // presidente é nacional; o resto é por UF
  const alvos = cargo === 1 ? ["BR"] : ufFiltro ? [ufFiltro] : UFS;
  for (const uf of alvos) {
    process.stdout.write(`  ${CARGOS[cargo] ?? cargo} · ${uf}`);
    const r = await buscar(uf, cargo);
    if (r.erro) {
      console.log(` → FALHOU (${r.erro})`);
      falhas.push({ cargo, uf, erro: r.erro });
      await dormir(2000);
      continue;
    }
    const lista = r.candidatos.map(enxugar);
    const arq = path.join(DIR, `${cargo}-${uf}.json`);
    fs.writeFileSync(
      arq,
      JSON.stringify({
        ano,
        uf,
        cargo,
        cargoNome: CARGOS[cargo] ?? String(cargo),
        idEleicao,
        fonte: "https://divulgacandcontas.tse.jus.br/divulga/rest/v1",
        coletado_em: new Date().toISOString().slice(0, 10),
        total: lista.length,
        candidatos: lista,
      }),
    );
    totalGeral += lista.length;
    console.log(` → ${lista.length} (${(fs.statSync(arq).size / 1024).toFixed(0)} KB)`);
    await dormir(3000); // gentileza com a fonte: não é corrida
  }
}

console.log(`\nok: ${totalGeral} candidatos → ${DIR}/`);
if (falhas.length) {
  console.log(`${falhas.length} combinação(ões) falharam — rode de novo só elas:`);
  for (const f of falhas) console.log(`  node scripts/gerar-candidatos.mjs ${ano} ${f.cargo} ${f.uf}   # ${f.erro}`);
  process.exitCode = 1;
}
