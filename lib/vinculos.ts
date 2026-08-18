/**
 * Vínculos a verificar — HIPÓTESES por sobrenome. Nenhuma base pública brasileira expõe parentesco.
 * O que dá para fazer com honestidade: (1) achar o(s) sobrenome(s) menos comuns do político,
 * (2) apontar onde procurar (servidores, fornecedores, outros candidatos, gabinete) e
 * (3) quando houver chave do Portal da Transparência, contar servidores federais com esse sobrenome.
 * Tudo isso é sinal para verificação humana — nunca afirmação de parentesco.
 */

const COMUNS = new Set([
  "SILVA","SANTOS","OLIVEIRA","SOUZA","SOUSA","RODRIGUES","FERREIRA","ALVES","PEREIRA","LIMA","GOMES","COSTA","RIBEIRO","MARTINS","CARVALHO","ALMEIDA","LOPES","SOARES","FERNANDES","VIEIRA","BARBOSA","ROCHA","DIAS","NASCIMENTO","ANDRADE","MOREIRA","NUNES","MARQUES","MACHADO","MENDES","FREITAS","CARDOSO","RAMOS","GONCALVES","GONÇALVES","SANTANA","TEIXEIRA","ARAUJO","ARAÚJO","MELO","BARROS","PINTO","MONTEIRO","CORREIA","CORREA","CAVALCANTE","CAVALCANTI","JESUS","CAMPOS","MORAES","MORAIS","CASTRO","REIS","BATISTA","DUARTE","MIRANDA","BORGES","CUNHA","NOGUEIRA","AZEVEDO","MOURA","PIRES","MEDEIROS","AMARAL","GARCIA","LEITE","BRITO","BRAGA","SAMPAIO","MOTA","MATOS","GUIMARAES","GUIMARÃES","REZENDE","RESENDE","FONSECA","TAVARES","LEAL","PAIVA","VASCONCELOS","VASCONCELLOS","COELHO","FARIAS","FARIA","QUEIROZ","BEZERRA","XAVIER","SIQUEIRA","NEVES","AGUIAR","LACERDA","PACHECO","MAIA","BRANDAO","BRANDÃO","VIANA","VIANNA","MAGALHAES","MAGALHÃES","DE","DA","DO","DOS","DAS","E","JUNIOR","JÚNIOR","FILHO","NETO","NETA","SOBRINHO",
]);

export function sobrenomesRaros(nomeCompleto: string): string[] {
  const partes = (nomeCompleto || "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/\s+/).filter(Boolean);
  const raros = partes.slice(1).filter((p) => p.length >= 4 && !COMUNS.has(p));
  return [...new Set(raros)];
}

export type Vinculo = {
  tipo: string;
  descricao: string;
  grau: "hipotese" | "indicio" | "verificado";
  fonte: string;
  url?: string;
  qtd?: number;
};

/**
 * Servidores federais por sobrenome: a API do Portal (/servidores) EXIGE órgão de lotação/exercício ou CPF —
 * não aceita busca só por nome (verificado em 18/08/2026: HTTP 400 "Filtros mínimos"). Por isso esta função
 * devolve null e a UI oferece o link da busca do próprio Portal, que aceita nome.
 */
export async function servidoresPorSobrenome(_sobrenome: string): Promise<{ qtd: number; nomes: string[] } | null> {
  void _sobrenome;
  return null;
}

/** Monta a lista de pistas (links prontos) para verificação humana. */
export function pistasDeVinculo(nomeCompleto: string, uf?: string): Vinculo[] {
  const raros = sobrenomesRaros(nomeCompleto);
  const out: Vinculo[] = [];
  for (const s of raros.slice(0, 2)) {
    out.push({ tipo: "servidores federais", descricao: `Servidores federais com o sobrenome "${s}" (buscar nome a nome no Portal)`, grau: "hipotese", fonte: "Portal da Transparência", url: `https://portaldatransparencia.gov.br/servidores/consulta?nome=${encodeURIComponent(s)}` });
    out.push({ tipo: "fornecedores no PNCP", descricao: `Contratos no PNCP com fornecedor/objeto contendo "${s}"`, grau: "hipotese", fonte: "PNCP", url: `/contratos?q=${encodeURIComponent(s)}${uf ? `&uf=${uf}` : ""}` });
    out.push({ tipo: "diários oficiais", descricao: `Nomeações, exonerações e contratos em diários oficiais municipais com "${s}"`, grau: "hipotese", fonte: "Querido Diário", url: `https://queridodiario.ok.org.br/pesquisa?querystring=${encodeURIComponent(s)}` });
    out.push({ tipo: "servidores da Câmara/Senado", descricao: `Servidores e secretários parlamentares com o sobrenome "${s}" (nepotismo é vedado — Súmula Vinculante 13)`, grau: "hipotese", fonte: "Câmara / Senado transparência", url: `https://www.camara.leg.br/transparencia/recursos-humanos/servidores?nome=${encodeURIComponent(s)}` });
  }
  return out;
}
