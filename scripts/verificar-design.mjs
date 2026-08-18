/**
 * Verificador do design system (docs/DESIGN-SYSTEM.md). Roda na CI e em `npm run design`.
 * Não é lint de estilo: pega o que QUEBRA layout ou viola a voz do projeto.
 */
import fs from "node:fs";
import path from "node:path";

const arquivos = [];
for (const dir of ["app", "components"]) {
  const anda = (d) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) anda(p);
      else if (/\.(tsx|ts)$/.test(f.name)) arquivos.push(p);
    }
  };
  if (fs.existsSync(dir)) anda(dir);
}

let erros = 0, avisos = 0;
const erro = (f, m) => { console.error(`✗ ${f}: ${m}`); erros++; };
const aviso = (f, m) => { console.warn(`! ${f}: ${m}`); avisos++; };

const TOKENS = ["paper", "ink", "stamp", "marker", "verde", "azul", "linha"];
const PROIBIDAS = [
  { re: /\b(suspeito|esquema criminoso|escândalo|corrupto|ladrão|bandido)\b/i, msg: "linguagem não factual (ver DESIGN-SYSTEM §8)" },
  { re: /className="[^"]*\bmin-w-\[[0-9.]+rem\]/, msg: "min-w fixo sem w-full/sm: — quebra no celular (§5)", ok: /w-full sm:min-w-\[/ },
  { re: /#[0-9a-fA-F]{6}\b/, msg: "cor hex fora dos tokens (§1)", ignorar: /globals\.css|Logo\.tsx|rgba/ },
];

for (const f of arquivos) {
  const src = fs.readFileSync(f, "utf8");

  // tabela precisa de contêiner de rolagem
  const tabelas = [...src.matchAll(/<table\b/g)].length;
  const rolagens = [...src.matchAll(/overflow-x-auto|\.rolagem|className="rolagem/g)].length;
  if (tabelas > rolagens) erro(f, `${tabelas} <table> e só ${rolagens} contêiner(es) de rolagem (§5)`);

  for (const regra of PROIBIDAS) {
    if (regra.ignorar && regra.ignorar.test(f)) continue;
    for (const linha of src.split("\n")) {
      const m = linha.match(regra.re);
      if (!m) continue;
      if (regra.ok && regra.ok.test(linha)) continue;
      // a palavra pode aparecer legitimamente quando o texto está NEGANDO seu uso
      // (ex.: 'nunca dizemos "X é corrupto"'). Só acusa fora desse contexto.
      if (regra.msg.includes("factual") && /nunca|jamais|não |sem juízo|≠|em vez de|proibid|"[^"]*(corrupto|suspeito|escândalo|ladrão)[^"]*"|'[^']*(corrupto|suspeito)/i.test(linha)) continue;
      if (regra.msg.includes("hex")) aviso(f, `${regra.msg}: ${m[0]}`);
      else erro(f, `${regra.msg}: "${m[0]}" → ${linha.trim().slice(0, 90)}`);
      break;
    }
  }

  // painel com fetch externo deve citar a fonte
  if (/getJSON|fetch\(|safe\(/.test(src) && /<Panel/.test(src) && !/<Source|fonte:|Fonte:/.test(src)) {
    aviso(f, "painel com dado externo sem <Source> ou menção de fonte (§4)");
  }
  // imagem sem alt
  const imgs = [...src.matchAll(/<img\b[^>]*>/g)];
  for (const [tag] of imgs) if (!/\balt=/.test(tag)) erro(f, "<img> sem alt (§7)");
}

// tokens existem?
const css = fs.readFileSync("app/globals.css", "utf8");
for (const t of TOKENS) if (!css.includes(`--${t}:`)) erro("app/globals.css", `token --${t} ausente (§1)`);
if (!css.includes("prefers-reduced-motion")) erro("app/globals.css", "sem bloco prefers-reduced-motion (§6)");
if (!css.includes(".quebra")) erro("app/globals.css", "classes anti-quebra ausentes (§5)");

console.log(`\n${erros ? `${erros} erro(s)` : "sem erros"} · ${avisos} aviso(s) — regras em docs/DESIGN-SYSTEM.md`);
process.exit(erros ? 1 : 0);
