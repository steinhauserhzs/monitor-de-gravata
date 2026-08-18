import fs from "node:fs";
import path from "node:path";
import { getJSON } from "./fetcher";
import { ELEICOES } from "./tse";

/**
 * Quem ocupa cada cargo eletivo hoje, por fonte:
 *  - deputado federal / senador → APIs da Câmara e do Senado (ao vivo)
 *  - presidente, governador, dep. estadual/distrital → eleitos de 2022 no TSE (índice derivado)
 *  - prefeito e vereador → eleitos de 2024 no TSE, consultados por município (sob demanda)
 * Índices gerados por `npm run eleitos` e `npm run municipios`.
 */
export type Eleito = {
  id: number;
  nome: string;
  nomeCompleto: string;
  partido: string;
  uf: string;
  cargo: string;
  cargoCod: number;
  numero: number;
  situacao: string;
  foto: string;
};

let _eleitos: { ano: number; gerado_em: string; eleitos: Eleito[] } | null | undefined;
export function loadEleitos() {
  if (_eleitos !== undefined) return _eleitos;
  const f = path.join(process.cwd(), "data", "derivados", "eleitos-2022.json");
  _eleitos = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
  return _eleitos;
}

export function eleitosPorCargo(cargoCod: number, uf?: string) {
  const base = loadEleitos();
  if (!base) return [];
  return base.eleitos.filter((e) => e.cargoCod === cargoCod && (!uf || e.uf === uf));
}

export type MunicipioTSE = { uf: string; c: string; n: string };
let _mun: MunicipioTSE[] | null | undefined;
export function loadMunicipios(): MunicipioTSE[] {
  if (_mun !== undefined) return _mun ?? [];
  const f = path.join(process.cwd(), "data", "derivados", "municipios-tse.json");
  _mun = fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, "utf8")).municipios as MunicipioTSE[]) : null;
  return _mun ?? [];
}

const norm = (s: string) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

export function buscarMunicipio(termo: string, uf?: string, max = 40) {
  const t = norm(termo);
  return loadMunicipios()
    .filter((m) => (!uf || m.uf === uf) && (!t || norm(m.n).includes(t)))
    .slice(0, max);
}

export const municipioPorCodigo = (codigo: string) => loadMunicipios().find((m) => m.c === String(codigo)) ?? null;

/** Prefeitos e vereadores eleitos de um município (TSE 2024), ao vivo. */
export async function eleitosDoMunicipio(codigoTSE: string, cargo: 11 | 13, ano = 2024) {
  const el = ELEICOES[ano];
  if (!el) return [];
  const r = await getJSON<{ candidatos: { id: number; nomeUrna: string; nomeCompleto: string; numero: number; partido?: { sigla: string }; descricaoTotalizacao?: string | null; fotoUrl?: string | null }[] }>(
    `https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/listar/${ano}/${codigoTSE}/${el.id}/${cargo}/candidatos`,
    { revalidate: 86400, timeoutMs: 30000 },
  );
  return (r.candidatos ?? []).filter((c) => /^eleito/i.test(c.descricaoTotalizacao ?? ""));
}
