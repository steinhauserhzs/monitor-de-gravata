/**
 * MOTOR DE RED FLAGS — regras como código.
 *
 * Cada regra é uma função pura: recebe um contexto (contrato, deputado, empresa, candidato…)
 * e devolve uma evidência FACTUAL ou null. Nenhuma regra afirma culpa: ela aponta um sinal
 * que merece olhar humano. O catálogo legível pela comunidade fica em data/red-flags.json;
 * quando uma regra do catálogo é implementada aqui, o id tem que ser o mesmo.
 *
 * Como adicionar uma regra: crie um objeto Rule abaixo (ou em um arquivo próprio), registre
 * em RULES, e adicione a entrada correspondente em data/red-flags.json com "implementada": true.
 */
import type { Contexts, Finding, Rule } from "./types";
import { brl, pct } from "@/lib/format";
import { idadeEmDias } from "@/lib/cnpj";

const r = <K extends keyof Contexts>(rule: Rule<K>) => rule as unknown as Rule;

/* ───────────────────────── CONTRATOS (PNCP) ───────────────────────── */

const contratoValorAlto = r<"contrato">({
  id: "contrato-valor-global-elevado",
  nome: "Contrato de valor global elevado para o porte do órgão",
  categoria: "contratacao",
  severidade: "baixa",
  aplicaA: "contrato",
  descricao: "Contratos acima de R$ 10 mi merecem leitura do objeto, itens e vigência.",
  fonte: "PNCP",
  check: ({ contrato }) => {
    const v = contrato.valorGlobal ?? contrato.valorInicial ?? 0;
    if (v >= 10_000_000)
      return {
        regra: "contrato-valor-global-elevado",
        nome: "Valor global elevado",
        categoria: "contratacao",
        severidade: v >= 100_000_000 ? "media" : "baixa",
        evidencia: `Valor global de ${brl(v)} (${contrato.orgaoEntidade?.razaoSocial}).`,
        valor: v,
        fonte: "PNCP",
      };
    return null;
  },
});

const contratoAdesao = r<"contrato">({
  id: "contrato-fruto-de-adesao",
  nome: "Contrato fruto de adesão a ata de outro órgão (carona)",
  categoria: "contratacao",
  severidade: "baixa",
  aplicaA: "contrato",
  descricao: "'Carona' em ata de registro de preços é legal, mas dispensa nova disputa — vale checar preço e pertinência.",
  fonte: "PNCP / OCP red flags",
  check: ({ contrato }) =>
    contrato.frutoAdesao
      ? {
          regra: "contrato-fruto-de-adesao",
          nome: "Adesão a ata (carona)",
          categoria: "contratacao",
          severidade: "baixa",
          evidencia: `Contrato ${contrato.numeroContratoEmpenho} marcado como fruto de adesão a ata de registro de preços.`,
          fonte: "PNCP",
        }
      : null,
});

const contratoRetificado = r<"contrato">({
  id: "contrato-multiplas-retificacoes",
  nome: "Contrato com múltiplas retificações",
  categoria: "contratacao",
  severidade: "baixa",
  aplicaA: "contrato",
  descricao: "Muitas retificações do registro podem indicar alteração de valor/objeto após publicação.",
  fonte: "PNCP",
  check: ({ contrato }) =>
    (contrato.numeroRetificacao ?? 0) >= 3
      ? {
          regra: "contrato-multiplas-retificacoes",
          nome: "Múltiplas retificações",
          categoria: "contratacao",
          severidade: "baixa",
          evidencia: `${contrato.numeroRetificacao} retificações registradas no PNCP.`,
          valor: contrato.numeroRetificacao,
          fonte: "PNCP",
        }
      : null,
});

const contratoVigenciaLonga = r<"contrato">({
  id: "contrato-vigencia-superior-5-anos",
  nome: "Vigência superior a 5 anos",
  categoria: "contratacao",
  severidade: "baixa",
  aplicaA: "contrato",
  descricao: "A Lei 14.133 permite até 5 anos (10 em casos específicos). Vigências longas concentram mercado.",
  fonte: "Lei 14.133/2021 art. 105-108",
  check: ({ contrato }) => {
    const a = new Date(contrato.dataVigenciaInicio).getTime();
    const b = new Date(contrato.dataVigenciaFim).getTime();
    if (!a || !b) return null;
    const anos = (b - a) / (365.25 * 86400000);
    return anos > 5
      ? {
          regra: "contrato-vigencia-superior-5-anos",
          nome: "Vigência longa",
          categoria: "contratacao",
          severidade: anos > 10 ? "media" : "baixa",
          evidencia: `Vigência de ${anos.toFixed(1)} anos (${contrato.dataVigenciaInicio} → ${contrato.dataVigenciaFim}).`,
          valor: anos,
          fonte: "PNCP",
        }
      : null;
  },
});

const contratoFornecedorRecemAberto = r<"contrato">({
  id: "fornecedor-cnpj-recem-aberto",
  nome: "Fornecedor com CNPJ aberto há menos de 12 meses na assinatura",
  categoria: "empresa",
  severidade: "media",
  aplicaA: "contrato",
  descricao: "Empresas criadas pouco antes de vencer contrato público são um clássico das fraudes (empresa de fachada).",
  fonte: "Rosie (Serenata) / OCP",
  check: ({ contrato, empresa }) => {
    if (!empresa?.data_inicio_atividade) return null;
    const dias = idadeEmDias(empresa.data_inicio_atividade, contrato.dataAssinatura);
    if (dias === null) return null;
    return dias < 365
      ? {
          regra: "fornecedor-cnpj-recem-aberto",
          nome: "Fornecedor recém-aberto",
          categoria: "empresa",
          severidade: dias < 180 ? "alta" : "media",
          evidencia: `Fornecedor ${empresa.razao_social} tinha ${dias} dias de CNPJ na assinatura (${contrato.dataAssinatura}).`,
          valor: dias,
          fonte: "PNCP + Receita Federal (BrasilAPI)",
        }
      : null;
  },
});

const contratoFornecedorInapto = r<"contrato">({
  id: "fornecedor-situacao-cadastral-irregular",
  nome: "Fornecedor com situação cadastral diferente de ATIVA",
  categoria: "empresa",
  severidade: "alta",
  aplicaA: "contrato",
  descricao: "Empresa baixada/inapta/suspensa não deveria contratar com o poder público.",
  fonte: "Receita Federal",
  check: ({ contrato, empresa }) => {
    if (!empresa) return null;
    const s = (empresa.descricao_situacao_cadastral || "").toUpperCase();
    return s && s !== "ATIVA"
      ? {
          regra: "fornecedor-situacao-cadastral-irregular",
          nome: "Situação cadastral irregular",
          categoria: "empresa",
          severidade: "alta",
          evidencia: `Fornecedor ${empresa.razao_social} consta como "${s}" na Receita Federal (contrato ${contrato.numeroContratoEmpenho}).`,
          fonte: "Receita Federal (BrasilAPI)",
        }
      : null;
  },
});

const contratoFornecedorSancionado = r<"contrato">({
  id: "fornecedor-sancionado-ceis-cnep",
  nome: "Fornecedor consta em CEIS/CNEP (sancionado)",
  categoria: "empresa",
  severidade: "alta",
  aplicaA: "contrato",
  descricao: "Empresa inidônea/suspensa (CEIS) ou punida pela Lei Anticorrupção (CNEP) contratando é ilegal.",
  fonte: "Portal da Transparência (CGU)",
  check: ({ contrato, sancoes }) => {
    if (!sancoes) return null;
    const n = (sancoes.ceis ?? 0) + (sancoes.cnep ?? 0);
    return n > 0
      ? {
          regra: "fornecedor-sancionado-ceis-cnep",
          nome: "Fornecedor sancionado",
          categoria: "empresa",
          severidade: "alta",
          evidencia: `Fornecedor ${contrato.nomeRazaoSocialFornecedor} tem ${sancoes.ceis} registro(s) no CEIS e ${sancoes.cnep} no CNEP.`,
          valor: n,
          fonte: "Portal da Transparência",
        }
      : null;
  },
});

const contratoCapitalBaixo = r<"contrato">({
  id: "fornecedor-capital-social-incompativel",
  nome: "Capital social muito inferior ao valor do contrato",
  categoria: "empresa",
  severidade: "media",
  aplicaA: "contrato",
  descricao: "Capital social < 1% do contrato sugere empresa sem lastro (ou de fachada). Sinal, não prova.",
  fonte: "TCU / CGU (análise de risco)",
  check: ({ contrato, empresa }) => {
    if (!empresa || !empresa.capital_social) return null;
    const v = contrato.valorGlobal ?? contrato.valorInicial ?? 0;
    if (v < 500_000) return null;
    const ratio = empresa.capital_social / v;
    return ratio < 0.01
      ? {
          regra: "fornecedor-capital-social-incompativel",
          nome: "Capital social incompatível",
          categoria: "empresa",
          severidade: ratio < 0.001 ? "alta" : "media",
          evidencia: `Capital social ${brl(empresa.capital_social)} vs contrato de ${brl(v)} (${pct(ratio, 2)}).`,
          valor: ratio,
          fonte: "PNCP + Receita Federal",
        }
      : null;
  },
});

const contratoOutraUF = r<"contrato">({
  id: "fornecedor-outra-uf-servico-local",
  nome: "Fornecedor sediado em outra UF para serviço local",
  categoria: "contratacao",
  severidade: "baixa",
  aplicaA: "contrato",
  descricao: "Empresa de fora do estado vencendo serviço local (limpeza, merenda, obra) pode indicar intermediação.",
  fonte: "OCP red flags",
  check: ({ contrato, empresa }) => {
    if (!empresa?.uf || !contrato.unidadeOrgao?.ufSigla) return null;
    const cat = (contrato.categoriaProcesso?.nome || "").toLowerCase();
    const local = /obra|serviço|servico|alimenta|limpeza|transporte|manuten/.test(cat);
    return local && empresa.uf !== contrato.unidadeOrgao.ufSigla
      ? {
          regra: "fornecedor-outra-uf-servico-local",
          nome: "Fornecedor de outra UF",
          categoria: "contratacao",
          severidade: "baixa",
          evidencia: `Fornecedor em ${empresa.uf}, contratante em ${contrato.unidadeOrgao.ufSigla}, categoria "${contrato.categoriaProcesso?.nome}".`,
          fonte: "PNCP + Receita Federal",
        }
      : null;
  },
});

const contratoMEIValorAlto = r<"contrato">({
  id: "fornecedor-mei-contrato-acima-do-limite",
  nome: "Fornecedor MEI com contrato acima do limite anual do MEI",
  categoria: "empresa",
  severidade: "media",
  aplicaA: "contrato",
  descricao: "MEI fatura no máximo R$ 81 mil/ano. Contrato acima disso é incompatível com o enquadramento.",
  fonte: "LC 123/2006",
  check: ({ contrato, empresa }) => {
    if (!empresa?.opcao_pelo_mei) return null;
    const v = contrato.valorGlobal ?? contrato.valorInicial ?? 0;
    return v > 81_000
      ? {
          regra: "fornecedor-mei-contrato-acima-do-limite",
          nome: "MEI acima do limite",
          categoria: "empresa",
          severidade: "media",
          evidencia: `Fornecedor optante pelo MEI com contrato de ${brl(v)} (limite anual do MEI: R$ 81.000).`,
          valor: v,
          fonte: "PNCP + Receita Federal",
        }
      : null;
  },
});

/* ───────────────────────── CONTRATAÇÕES (licitações/dispensas) ───────────────────────── */

const dispensaEmergencial = r<"contratacao">({
  id: "dispensa-emergencial",
  nome: "Dispensa por emergência/calamidade",
  categoria: "contratacao",
  severidade: "media",
  aplicaA: "contratacao",
  descricao: "Emergência dispensa disputa. Uso recorrente ou valores altos exigem justificativa forte (art. 75, VIII).",
  fonte: "Lei 14.133 art. 75 / TCU",
  check: ({ contratacao }) => {
    const d = (contratacao.amparoLegal?.descricao || contratacao.amparoLegal?.nome || "").toLowerCase();
    if (contratacao.modalidadeId === 8 && /emerg|calamidade/.test(d)) {
      const v = contratacao.valorTotalEstimado ?? 0;
      return {
        regra: "dispensa-emergencial",
        nome: "Dispensa emergencial",
        categoria: "contratacao",
        severidade: v > 1_000_000 ? "alta" : "media",
        evidencia: `Dispensa por emergência: ${brl(v)} — ${contratacao.orgaoEntidade?.razaoSocial}.`,
        valor: v,
        fonte: "PNCP",
      };
    }
    return null;
  },
});

const dispensaValorAlto = r<"contratacao">({
  id: "dispensa-valor-alto",
  nome: "Dispensa/inexigibilidade de valor elevado",
  categoria: "contratacao",
  severidade: "media",
  aplicaA: "contratacao",
  descricao: "Sem licitação acima de R$ 1 mi merece leitura do amparo legal e do fornecedor.",
  fonte: "OCP / TCU",
  check: ({ contratacao }) => {
    if (![8, 9].includes(contratacao.modalidadeId)) return null;
    const v = contratacao.valorTotalEstimado ?? 0;
    return v >= 1_000_000
      ? {
          regra: "dispensa-valor-alto",
          nome: "Sem licitação, valor alto",
          categoria: "contratacao",
          severidade: v >= 10_000_000 ? "alta" : "media",
          evidencia: `${contratacao.modalidadeNome} de ${brl(v)} — ${contratacao.orgaoEntidade?.razaoSocial}: "${(contratacao.objetoCompra || "").slice(0, 120)}".`,
          valor: v,
          fonte: "PNCP",
        }
      : null;
  },
});

const contratacaoPrazoCurto = r<"contratacao">({
  id: "licitacao-prazo-proposta-curto",
  nome: "Prazo entre publicação e encerramento de propostas muito curto",
  categoria: "contratacao",
  severidade: "media",
  aplicaA: "contratacao",
  descricao: "Prazo curto restringe concorrência (direcionamento). Lei 14.133 art. 55 fixa mínimos por modalidade.",
  fonte: "OCP red flags / Lei 14.133 art. 55",
  check: ({ contratacao }) => {
    if (!contratacao.dataPublicacaoPncp || !contratacao.dataEncerramentoProposta) return null;
    if ([8, 9].includes(contratacao.modalidadeId)) return null;
    const dias = (new Date(contratacao.dataEncerramentoProposta).getTime() - new Date(contratacao.dataPublicacaoPncp).getTime()) / 86400000;
    return dias >= 0 && dias < 8
      ? {
          regra: "licitacao-prazo-proposta-curto",
          nome: "Prazo de proposta curto",
          categoria: "contratacao",
          severidade: dias < 4 ? "alta" : "media",
          evidencia: `${dias.toFixed(1)} dias entre publicação no PNCP e encerramento das propostas (${contratacao.modalidadeNome}).`,
          valor: dias,
          fonte: "PNCP",
        }
      : null;
  },
});

/* ───────────────────────── DEPUTADOS (CEAP) ───────────────────────── */

const ceapConcentrada = r<"cota">({
  id: "ceap-fornecedor-dominante",
  nome: "Um único fornecedor concentra grande parte da cota parlamentar",
  categoria: "parlamentar",
  severidade: "media",
  aplicaA: "cota",
  descricao: "Concentração > 40% da CEAP em 1 CNPJ é atípica (exceto locação de veículo/escritório). Sinal para olhar quem é o fornecedor.",
  fonte: "OPS / Rosie",
  check: ({ analise }) => {
    const top = analise.porFornecedor[0];
    if (!top || analise.total < 20_000) return null;
    return top.share > 0.4
      ? {
          regra: "ceap-fornecedor-dominante",
          nome: "Fornecedor dominante na CEAP",
          categoria: "parlamentar",
          severidade: top.share > 0.6 ? "alta" : "media",
          evidencia: `${top.fornecedor} (${top.cnpj}) recebeu ${pct(top.share)} da cota do ano (${brl(top.total)} em ${top.qtd} notas).`,
          valor: top.share,
          fonte: "Cota parlamentar (Câmara CEAP / Senado CEAPS)",
        }
      : null;
  },
});

const ceapDivulgacaoAlta = r<"cota">({
  id: "ceap-divulgacao-acima-de-50",
  nome: "Divulgação da atividade parlamentar consome mais da metade da cota",
  categoria: "parlamentar",
  severidade: "baixa",
  aplicaA: "cota",
  descricao: "'Divulgação' é a rubrica mais elástica da CEAP e a mais associada a irregularidades históricas.",
  fonte: "OPS",
  check: ({ analise }) => {
    const div = analise.porTipo.find((t) => /divulga/i.test(t.tipo));
    if (!div || !analise.total) return null;
    const share = div.total / analise.total;
    return share > 0.5
      ? {
          regra: "ceap-divulgacao-acima-de-50",
          nome: "Divulgação > 50% da cota",
          categoria: "parlamentar",
          severidade: "baixa",
          evidencia: `${pct(share)} da CEAP do ano em "${div.tipo}" (${brl(div.total)}).`,
          valor: share,
          fonte: "Cota parlamentar (Câmara CEAP / Senado CEAPS)",
        }
      : null;
  },
});

const ceapNotaAlta = r<"cota">({
  id: "ceap-nota-unica-elevada",
  nome: "Nota fiscal única de valor elevado",
  categoria: "parlamentar",
  severidade: "baixa",
  aplicaA: "cota",
  descricao: "Documento acima de R$ 20 mil na CEAP merece leitura (o que foi comprado, de quem).",
  fonte: "Rosie",
  check: ({ analise }) => {
    const m = analise.maiorNota;
    return m && m.valorLiquido > 20_000
      ? {
          regra: "ceap-nota-unica-elevada",
          nome: "Nota única elevada",
          categoria: "parlamentar",
          severidade: m.valorLiquido > 50_000 ? "media" : "baixa",
          evidencia: `Nota de ${brl(m.valorLiquido)} para ${m.nomeFornecedor} (${m.tipoDespesa}, ${m.dataDocumento?.slice(0, 10)}).`,
          valor: m.valorLiquido,
          fonte: "Cota parlamentar (Câmara CEAP / Senado CEAPS)",
        }
      : null;
  },
});

const ceapCombustivel = r<"cota">({
  id: "ceap-combustivel-elevado",
  nome: "Gasto com combustível acima de R$ 6 mil/mês em média",
  categoria: "parlamentar",
  severidade: "media",
  aplicaA: "cota",
  descricao: "Média mensal alta de combustível é o clássico da OPS/Rosie (equivale a rodar milhares de km/mês).",
  fonte: "OPS / Rosie",
  check: ({ analise }) => {
    const c = analise.porTipo.find((t) => /combust/i.test(t.tipo));
    if (!c) return null;
    const meses = Math.max(1, analise.porMes.length);
    const media = c.total / meses;
    return media > 6_000
      ? {
          regra: "ceap-combustivel-elevado",
          nome: "Combustível elevado",
          categoria: "parlamentar",
          severidade: media > 10_000 ? "alta" : "media",
          evidencia: `${brl(c.total)} em combustível em ${meses} mês(es) — média ${brl(media)}/mês.`,
          valor: media,
          fonte: "Cota parlamentar (Câmara CEAP / Senado CEAPS)",
        }
      : null;
  },
});

const ceapAcimaMedia = r<"cota">({
  id: "ceap-acima-da-media-da-bancada",
  nome: "Gasto anual acima da média da bancada",
  categoria: "parlamentar",
  severidade: "baixa",
  aplicaA: "cota",
  descricao: "Comparação objetiva com pares do mesmo estado (a cota varia por UF).",
  fonte: "Monitor de Gravata",
  check: ({ analise, mediaBancada }) => {
    if (!mediaBancada || !analise.total) return null;
    const ratio = analise.total / mediaBancada;
    return ratio > 1.3
      ? {
          regra: "ceap-acima-da-media-da-bancada",
          nome: "Acima da média",
          categoria: "parlamentar",
          severidade: ratio > 1.6 ? "media" : "baixa",
          evidencia: `Gastou ${brl(analise.total)}, ${((ratio - 1) * 100).toFixed(0)}% acima da média (${brl(mediaBancada)}).`,
          valor: ratio,
          fonte: "Cota parlamentar (Câmara CEAP / Senado CEAPS)",
        }
      : null;
  },
});

/* ───────────────────────── EMPRESAS ───────────────────────── */

const empresaSocioServidorPlaceholder = r<"empresa">({
  id: "empresa-capital-social-simbolico-com-contratos",
  nome: "Capital social simbólico com contratos públicos relevantes",
  categoria: "empresa",
  severidade: "media",
  aplicaA: "empresa",
  descricao: "Capital social ≤ R$ 10 mil e soma de contratos públicos > R$ 1 mi.",
  fonte: "TCU / CGU",
  check: ({ empresa, contratos }) => {
    if (!contratos?.length) return null;
    const soma = contratos.reduce((a, c) => a + (c.valor || 0), 0);
    return (empresa.capital_social ?? 0) <= 10_000 && soma > 1_000_000
      ? {
          regra: "empresa-capital-social-simbolico-com-contratos",
          nome: "Capital simbólico × contratos",
          categoria: "empresa",
          severidade: "media",
          evidencia: `Capital social ${brl(empresa.capital_social)} e ${brl(soma)} em ${contratos.length} contrato(s) público(s) localizados.`,
          valor: soma,
          fonte: "Receita Federal + PNCP",
        }
      : null;
  },
});

const empresaSancionada = r<"empresa">({
  id: "empresa-sancionada",
  nome: "Empresa consta em cadastros de sanção (CEIS/CNEP)",
  categoria: "empresa",
  severidade: "alta",
  aplicaA: "empresa",
  descricao: "Registro em CEIS (inidônea/suspensa) ou CNEP (Lei Anticorrupção).",
  fonte: "Portal da Transparência",
  check: ({ empresa, sancoes }) => {
    if (!sancoes) return null;
    const n = sancoes.ceis + sancoes.cnep;
    return n > 0
      ? {
          regra: "empresa-sancionada",
          nome: "Empresa sancionada",
          categoria: "empresa",
          severidade: "alta",
          evidencia: `${empresa.razao_social}: ${sancoes.ceis} registro(s) CEIS, ${sancoes.cnep} CNEP.`,
          valor: n,
          fonte: "Portal da Transparência",
        }
      : null;
  },
});

/* ───────────────────────── CANDIDATOS (TSE) ───────────────────────── */

const candidatoPatrimonioSalto = r<"candidato">({
  id: "candidato-patrimonio-salto",
  nome: "Patrimônio declarado cresceu mais de 100% desde a eleição anterior",
  categoria: "eleitoral",
  severidade: "media",
  aplicaA: "candidato",
  descricao: "Salto patrimonial entre declarações ao TSE é sinal para pedir explicação (não é prova de nada).",
  fonte: "TSE DivulgaCand",
  check: ({ candidato, anteriores }) => {
    if (!anteriores?.length) return null;
    // sem bens/eleição carregados (ficha mínima do índice) não há o que comparar — ausente ≠ zero
    if (candidato.totalDeBens == null || !candidato.eleicao) return null;
    const ant = anteriores.filter((a) => a.ano < candidato.eleicao!.ano).sort((a, b) => b.ano - a.ano)[0];
    if (!ant || !ant.totalDeBens) return null;
    const ratio = candidato.totalDeBens! / ant.totalDeBens;
    return ratio > 2
      ? {
          regra: "candidato-patrimonio-salto",
          nome: "Salto patrimonial",
          categoria: "eleitoral",
          severidade: ratio > 5 ? "alta" : "media",
          evidencia: `Bens declarados: ${brl(ant.totalDeBens)} (${ant.ano}) → ${brl(candidato.totalDeBens)} (${candidato.eleicao!.ano}), ${((ratio - 1) * 100).toFixed(0)}% de aumento.`,
          valor: ratio,
          fonte: "TSE DivulgaCand",
        }
      : null;
  },
});

const candidatoSemBens = r<"candidato">({
  id: "candidato-sem-bens-declarados",
  nome: "Candidato não declarou nenhum bem",
  categoria: "eleitoral",
  severidade: "baixa",
  aplicaA: "candidato",
  descricao: "Declaração zerada é legal, mas frequente em laranjas e em quem esconde patrimônio em terceiros.",
  fonte: "TSE",
  check: ({ candidato }) =>
    // dispara só com o dado carregado E igual a zero — undefined é "não sabemos"
    candidato.totalDeBens === 0 && candidato.eleicao
      ? {
          regra: "candidato-sem-bens-declarados",
          nome: "Sem bens declarados",
          categoria: "eleitoral",
          severidade: "baixa",
          evidencia: `Total de bens declarados ao TSE em ${candidato.eleicao.ano}: R$ 0,00.`,
          fonte: "TSE DivulgaCand",
        }
      : null,
});

const candidatoProcessos = r<"candidato">({
  id: "candidato-processos-cassacao",
  nome: "Candidatura com processo de cassação/desconstituição registrado",
  categoria: "eleitoral",
  severidade: "alta",
  aplicaA: "candidato",
  descricao: "O TSE registra processos que podem levar à perda do registro. Ler o processo antes de concluir.",
  fonte: "TSE",
  check: ({ candidato }) => {
    const n = (candidato.processosCassacao?.length ?? 0) + (candidato.processosDesconstituicao?.length ?? 0);
    return n > 0
      ? {
          regra: "candidato-processos-cassacao",
          nome: "Processo de cassação",
          categoria: "eleitoral",
          severidade: "alta",
          evidencia: `${n} processo(s) de cassação/desconstituição vinculado(s) à candidatura no DivulgaCand.`,
          valor: n,
          fonte: "TSE DivulgaCand",
        }
      : null;
  },
});

const candidatoFundoPartidario = r<"candidato">({
  id: "candidato-financiado-100-por-fundo",
  nome: "Campanha financiada 100% por fundo partidário/FEFC",
  categoria: "eleitoral",
  severidade: "baixa",
  aplicaA: "candidato",
  descricao: "Sem nenhuma doação de pessoa física, toda a campanha vem de dinheiro público via partido. Não é irregular; é informação.",
  fonte: "TSE",
  check: ({ candidato, prestacao }) => {
    const d = prestacao?.dadosConsolidados;
    if (!d || !d.totalRecebido) return null;
    const share = (d.totalPartidos ?? 0) / d.totalRecebido;
    return share >= 0.999
      ? {
          regra: "candidato-financiado-100-por-fundo",
          nome: "100% fundo partidário",
          categoria: "eleitoral",
          severidade: "baixa",
          evidencia: `${brl(d.totalRecebido)} recebidos, ${pct(share)} vindos do partido (fundo partidário/FEFC). Candidato ${candidato.nomeUrna}.`,
          valor: share,
          fonte: "TSE DivulgaCand (prestação de contas)",
        }
      : null;
  },
});

export const RULES: Rule[] = [
  contratoValorAlto,
  contratoAdesao,
  contratoRetificado,
  contratoVigenciaLonga,
  contratoFornecedorRecemAberto,
  contratoFornecedorInapto,
  contratoFornecedorSancionado,
  contratoCapitalBaixo,
  contratoOutraUF,
  contratoMEIValorAlto,
  dispensaEmergencial,
  dispensaValorAlto,
  contratacaoPrazoCurto,
  ceapConcentrada,
  ceapDivulgacaoAlta,
  ceapNotaAlta,
  ceapCombustivel,
  ceapAcimaMedia,
  empresaSocioServidorPlaceholder,
  empresaSancionada,
  candidatoPatrimonioSalto,
  candidatoSemBens,
  candidatoProcessos,
  candidatoFundoPartidario,
];

export function runRules<K extends keyof Contexts>(aplicaA: K, ctx: Contexts[K]): Finding[] {
  const out: Finding[] = [];
  for (const rule of RULES) {
    if (rule.aplicaA !== aplicaA) continue;
    try {
      const f = (rule.check as (c: Contexts[K]) => Finding | null)(ctx);
      if (f) out.push(f);
    } catch {
      /* regra quebrada nunca derruba a página */
    }
  }
  const peso = { alta: 3, media: 2, baixa: 1 } as const;
  return out.sort((a, b) => peso[b.severidade] - peso[a.severidade]);
}

export const implementedRuleIds = () => new Set(RULES.map((r) => r.id));
