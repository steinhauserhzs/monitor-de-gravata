// Valida data/apis/*.json, data/red-flags.json, data/casos/*.md — roda na CI e em `npm run validar`.
import fs from "node:fs";
import path from "node:path";
let erros = 0;
const err = (m) => { console.error("✗ " + m); erros++; };
const ok = (m) => console.log("✓ " + m);
const ESFERAS = ["federal","estadual","municipal","legislativo","judiciario","eleitoral","controle","economico","civil"];
const AUTH = ["nenhuma","chave-gratuita","token","oauth","bulk-download"];
const SEV = ["baixa","media","alta"];
const CAT = ["contratacao","parlamentar","eleitoral","empresa","servidor","obra","municipal"];
const STATUS = ["rascunho","em-revisao","publicado","contestado","corrigido","arquivado"];
const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// APIs
const ids = new Set();
for (const f of fs.readdirSync("data/apis").filter((x) => x.endsWith(".json"))) {
  let arr;
  try { arr = JSON.parse(fs.readFileSync(path.join("data/apis", f), "utf8")); } catch (e) { err(`${f}: JSON inválido — ${e.message}`); continue; }
  if (!Array.isArray(arr)) { err(`${f}: precisa ser array`); continue; }
  arr.forEach((a, i) => {
    const w = `${f}[${i}] ${a.id ?? "?"}`;
    for (const k of ["id","nome","orgao","esfera","base_url","auth","endpoints_chave","utilidade_anticorrupcao"]) if (a[k] === undefined || a[k] === "") err(`${w}: falta "${k}"`);
    if (a.id && !kebab.test(a.id)) err(`${w}: id não é kebab-case`);
    if (a.id && ids.has(a.id)) err(`${w}: id duplicado`); ids.add(a.id);
    if (a.esfera && !ESFERAS.includes(a.esfera)) err(`${w}: esfera inválida "${a.esfera}"`);
    if (a.auth && !AUTH.includes(a.auth)) err(`${w}: auth inválida "${a.auth}"`);
    if (a.base_url && !/^https?:\/\//.test(a.base_url)) err(`${w}: base_url precisa ser http(s)`);
    if (a.endpoints_chave && !Array.isArray(a.endpoints_chave)) err(`${w}: endpoints_chave precisa ser array`);
  });
  ok(`${f}: ${arr.length} APIs`);
}
// Red flags
try {
  const rf = JSON.parse(fs.readFileSync("data/red-flags.json", "utf8"));
  const rids = new Set();
  rf.forEach((r, i) => {
    const w = `red-flags[${i}] ${r.id ?? "?"}`;
    for (const k of ["id","nome","categoria","descricao","fonte","severidade"]) if (!r[k]) err(`${w}: falta "${k}"`);
    if (r.id && !kebab.test(r.id)) err(`${w}: id não é kebab-case`);
    if (r.id && rids.has(r.id)) err(`${w}: id duplicado`); rids.add(r.id);
    if (r.severidade && !SEV.includes(r.severidade)) err(`${w}: severidade inválida`);
    if (r.categoria && !CAT.includes(r.categoria)) err(`${w}: categoria inválida "${r.categoria}"`);
    if (/corrupt|criminos|ladr|bandid|esquema/i.test(r.nome + " " + r.descricao)) err(`${w}: linguagem não factual (política editorial)`);
  });
  ok(`red-flags.json: ${rf.length} regras`);
} catch (e) { err(`red-flags.json: ${e.message}`); }
// Casos
for (const f of fs.readdirSync("data/casos").filter((x) => x.endsWith(".md"))) {
  const src = fs.readFileSync(path.join("data/casos", f), "utf8");
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  if (!m) { err(`${f}: sem frontmatter`); continue; }
  const fm = m[1];
  for (const k of ["titulo","status","tipo","fontes","criado_em","resumo"]) if (!new RegExp(`^${k}:`, "m").test(fm)) err(`${f}: falta "${k}"`);
  const st = fm.match(/^status:\s*(\S+)/m)?.[1];
  if (st && !STATUS.includes(st)) err(`${f}: status inválido "${st}"`);
  if (!/url:\s*"?https?:\/\//.test(fm)) err(`${f}: nenhuma fonte com URL`);
  if (st === "publicado" && !/^revisores:\s*\[[^\]]+\]/m.test(fm)) err(`${f}: publicado sem revisores`);
  if (/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/.test(src)) err(`${f}: contém CPF completo (proibido)`);
  ok(`${f}: ok (${st})`);
}
console.log(erros ? `\n${erros} erro(s).` : "\nTudo válido.");
process.exit(erros ? 1 : 0);
