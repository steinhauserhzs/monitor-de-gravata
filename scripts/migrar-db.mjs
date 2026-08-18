// Cria/atualiza o schema dos índices derivados no Postgres (Neon). Uso: node scripts/migrar-db.mjs
import { neon } from "@neondatabase/serverless";
import fs from "node:fs";

const url = process.env.DATABASE_URL || (fs.existsSync(".env.local") && fs.readFileSync(".env.local", "utf8").split("\n").find((l) => l.startsWith("DATABASE_URL"))?.split("=").slice(1).join("=").replace(/^"|"$/g, "").trim());
if (!url) { console.error("DATABASE_URL ausente (defina no ambiente ou em .env.local)."); process.exit(1); }
const sql = neon(url);
const { SCHEMA_SQL } = await import("../lib/db.ts").catch(() => ({ SCHEMA_SQL: null }));
const ddl = SCHEMA_SQL ?? fs.readFileSync("lib/db.ts", "utf8").split("export const SCHEMA_SQL = `")[1].split("`;")[0];
for (const stmt of ddl.split(";").map((s) => s.trim()).filter(Boolean)) {
  await sql.query(stmt);
  console.log("ok:", stmt.split("\n")[0].slice(0, 70));
}
const t = await sql`select table_name from information_schema.tables where table_schema='public' order by 1`;
console.log("\ntabelas:", t.map((r) => r.table_name).join(", "));
