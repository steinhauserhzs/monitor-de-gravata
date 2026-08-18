// TEMPORÁRIO — diagnóstico da chave do Portal (remover após uso). Não expõe a chave, só status das chamadas.
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  const key = process.env.PORTAL_TRANSPARENCIA_KEY ?? "";
  const tests: Record<string, string> = {
    emendasUpper: "/emendas?nomeAutor=ADILSON%20BARROSO&ano=2026&pagina=1",
    emendasMixed: "/emendas?nomeAutor=Adilson%20Barroso&ano=2026&pagina=1",
    emendasSemAno: "/emendas?nomeAutor=ADILSON%20BARROSO&pagina=1",
    emendasQualquer: "/emendas?ano=2026&pagina=1",
    servidores: "/servidores?nome=BARROSO&pagina=1",
    ceis: "/ceis?codigoSancionado=00000000000191&pagina=1",
  };
  const out: Record<string, unknown> = { keyLen: key.length };
  for (const [k, p] of Object.entries(tests)) {
    try {
      const r = await fetch("https://api.portaldatransparencia.gov.br/api-de-dados" + p, { headers: { "chave-api-dados": key, Accept: "application/json" }, cache: "no-store" });
      const t = await r.text();
      out[k] = { status: r.status, len: t.length, head: t.slice(0, 220) };
    } catch (e) {
      out[k] = { erro: String(e) };
    }
  }
  return NextResponse.json(out);
}
