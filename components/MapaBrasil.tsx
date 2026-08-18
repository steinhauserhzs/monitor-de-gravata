import fs from "node:fs";
import path from "node:path";
import Link from "next/link";

/**
 * Mapa clicável do Brasil. Fonte: malha oficial do IBGE
 * (servicodados.ibge.gov.br/api/v3/malhas/paises/BR?intrarregiao=UF&formato=image/svg+xml&qualidade=minima),
 * salva em data/derivados/br-uf.svg em 2026-08-18. Cada <path id="{código IBGE}"> vira um link para os candidatos da UF.
 */
const UF_POR_IBGE: Record<string, { sigla: string; nome: string }> = {
  "11": { sigla: "RO", nome: "Rondônia" }, "12": { sigla: "AC", nome: "Acre" }, "13": { sigla: "AM", nome: "Amazonas" }, "14": { sigla: "RR", nome: "Roraima" },
  "15": { sigla: "PA", nome: "Pará" }, "16": { sigla: "AP", nome: "Amapá" }, "17": { sigla: "TO", nome: "Tocantins" }, "21": { sigla: "MA", nome: "Maranhão" },
  "22": { sigla: "PI", nome: "Piauí" }, "23": { sigla: "CE", nome: "Ceará" }, "24": { sigla: "RN", nome: "Rio Grande do Norte" }, "25": { sigla: "PB", nome: "Paraíba" },
  "26": { sigla: "PE", nome: "Pernambuco" }, "27": { sigla: "AL", nome: "Alagoas" }, "28": { sigla: "SE", nome: "Sergipe" }, "29": { sigla: "BA", nome: "Bahia" },
  "31": { sigla: "MG", nome: "Minas Gerais" }, "32": { sigla: "ES", nome: "Espírito Santo" }, "33": { sigla: "RJ", nome: "Rio de Janeiro" }, "35": { sigla: "SP", nome: "São Paulo" },
  "41": { sigla: "PR", nome: "Paraná" }, "42": { sigla: "SC", nome: "Santa Catarina" }, "43": { sigla: "RS", nome: "Rio Grande do Sul" }, "50": { sigla: "MS", nome: "Mato Grosso do Sul" },
  "51": { sigla: "MT", nome: "Mato Grosso" }, "52": { sigla: "GO", nome: "Goiás" }, "53": { sigla: "DF", nome: "Distrito Federal" },
};

let _paths: { id: string; d: string }[] | null = null;
let _meta: { viewBox: string; transform: string } | null = null;

function carregar() {
  if (_paths) return { paths: _paths, meta: _meta! };
  const f = path.join(process.cwd(), "data", "derivados", "br-uf.svg");
  const svg = fs.readFileSync(f, "utf8");
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 1080 1080";
  const transform = svg.match(/<g id="BRUF" transform="([^"]+)"/)?.[1] ?? "";
  const paths = [...svg.matchAll(/<path id="(\d+)" d="([^"]+)"/g)].map((m) => ({ id: m[1], d: m[2] }));
  _paths = paths;
  _meta = { viewBox, transform };
  return { paths, meta: _meta };
}

export function MapaBrasil({ ano = 2026, cargo = 6 }: { ano?: number; cargo?: number }) {
  const { paths, meta } = carregar();
  return (
    <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] items-center">
      <svg viewBox={meta.viewBox} className="w-full h-auto max-h-[34rem] mapa-br" role="img" aria-label="Mapa do Brasil por estado — clique para ver os candidatos">
        <g transform={meta.transform}>
          {paths.map((p) => {
            const uf = UF_POR_IBGE[p.id];
            if (!uf) return null;
            return (
              <Link key={p.id} href={`/candidatos?ano=${ano}&uf=${uf.sigla}&cargo=${cargo}`} aria-label={`${uf.nome} — candidatos ${ano}`}>
                <path d={p.d} className="mapa-uf" aria-label={`${uf.nome} (${uf.sigla})`}>
                  <title>{`${uf.nome} (${uf.sigla}) — ver candidatos de ${ano}`}</title>
                </path>
              </Link>
            );
          })}
        </g>
      </svg>
      <div>
        <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-stamp">Eleições {ano}</div>
        <h2 className="font-display text-3xl md:text-5xl leading-[0.95] mt-2">Clique no seu estado</h2>
        <p className="mt-3 text-ink-2 max-w-md">
          Todos os candidatos registrados no TSE, por cargo: bens declarados, evolução patrimonial, doações, processos e red flags. Sem
          juízo de valor — só o que consta oficialmente.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 font-mono text-[0.62rem] uppercase tracking-[0.12em]">
          {[
            [1, "Presidente"],
            [3, "Governador"],
            [5, "Senador"],
            [6, "Dep. federal"],
            [7, "Dep. estadual"],
          ].map(([c, l]) => (
            <Link key={c} href={`/candidatos?ano=${ano}${c === 1 ? "&uf=BR" : ""}&cargo=${c}`} className={`px-2.5 py-1.5 border border-ink ${c === cargo ? "bg-ink text-paper" : "hover:bg-paper-2"}`}>
              {l}
            </Link>
          ))}
        </div>
        <ul className="mt-5 grid grid-cols-6 sm:grid-cols-9 gap-1 font-mono text-[0.68rem]">
          {Object.values(UF_POR_IBGE)
            .sort((a, b) => a.sigla.localeCompare(b.sigla))
            .map((u) => (
              <li key={u.sigla}>
                <Link href={`/candidatos?ano=${ano}&uf=${u.sigla}&cargo=${cargo}`} className="block text-center border border-linha py-1 hover:bg-ink hover:text-paper" title={u.nome}>
                  {u.sigla}
                </Link>
              </li>
            ))}
        </ul>
        <div className="mt-3 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-3">malha: IBGE (API de malhas v3) · candidatos: TSE DivulgaCandContas</div>
      </div>
    </div>
  );
}
