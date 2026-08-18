# Notas — bases públicas (lote A) e o que dá para cruzar

Testado em 2026-08-18. Detalhe técnico em `apis-bases-A.json` (40 entradas, 38 com status ok).

## Portal da Transparência + CGU (CEIS/CNEP/CEPIM/CEAF)
- API JSON exige chave gratuita (header `chave-api-dados`), 90 req/min; OpenAPI público em `/v3/api-docs`. Sem CORS: sempre via proxy server-side.
- Bulk CSV sem auth em `portaldatransparencia.gov.br/download-de-dados/{tema}/{data}` (ceis, cnep, cepim, ceaf, servidores, emendas, cpgf, viagens, convênios, despesas-execucao). Carga noturna evita o rate limit.
- Cruzamento 1: CNPJ do contrato/pagamento SIAFI x CEIS/CNEP → fornecedor sancionado recebendo dinheiro público.
- Cruzamento 2: servidor (SIAPE) x QSA da Receita → servidor sócio de fornecedora do próprio órgão; CEAF x QSA → expulso reaparecendo como sócio.
- Cruzamento 3: emenda parlamentar (autor, favorecido, município) x doadores TSE x contratos municipais no PNCP.

## Tesouro (Tesouro Transparente CKAN, SICONFI, SIAFI aberto) e SIOP
- SICONFI (`apidatalake.tesouro.gov.br/ords/siconfi/tt`) é a melhor API fiscal municipal: sem auth, JSON, RREO/RGF/DCA/MSC/extrato de entregas por código IBGE.
- Tesouro Transparente CKAN (`/ckan/api/3/action`) traz FPM/FPE, precatórios, garantias, estatais — descobrir slug via `package_search`.
- SIAFI não tem API própria; o espelho aberto é o Portal da Transparência (despesa por favorecido/documento). SIOP: painel Qlik público + CSVs anuais, sem API JSON viva.
- Cruzamento: despesa com pessoal e restos a pagar (RGF) x calendário eleitoral (LRF art. 42/21) → município que estoura limite ou não entrega contas em 2026 = red flag.
- Cruzamento: transferência recebida (FPM) vs. contratações no PNCP → município que recebe pouco mas contrata muito com poucos fornecedores.

## Empresas: Receita CNPJ, BrasilAPI, Minha Receita, Juntas Comerciais, Base dos Dados
- Fonte primária = ZIPs mensais da Receita (novo caminho Nextcloud `arquivos.receitafederal.gov.br/index.php/s/gn672Ad4CF8N6TK`; caminho antigo `/dados/cnpj/dados_abertos_cnpj/` morreu, 404). Sócios vêm com CPF mascarado `***xxxxxx**`.
- Lookup unitário sem auth e com CORS: BrasilAPI `/cnpj/v1/{cnpj}` e Minha Receita `/{cnpj}` (esta é self-hostável para milhares de consultas).
- Juntas Comerciais/REDESIM: nenhuma API aberta; histórico de alterações societárias só por certidão paga. Lacuna real.
- Base dos Dados: GraphQL de metadados sem auth (POST) + BigQuery `basedosdados.br_me_cnpj.*`, `br_tse_eleicoes.*`, `br_cgu_licitacao_contrato.*` já tratados — melhor lugar para o join TSE x CNPJ x contratos em batch.
- Cruzamentos: data de abertura da empresa vs. data da licitação; endereço/telefone/contador compartilhado entre concorrentes; sócio homônimo de candidato/assessor (nome + faixa etária, já que CPF é mascarado).

## Mercado de capitais: CVM e B3
- CVM é toda bulk CSV sem auth e diretórios navegáveis: FRE (administradores, acionistas, partes relacionadas), IPE (fatos relevantes com link do PDF), VLMO (insider agregado por grupo), CAD_FI/INF_DIARIO/CDA (fundos), cad_cia_aberta + DFP/ITR.
- B3 aberto sem login: COTAHIST (ZIP anual/diário), `arquivos.b3.com.br/api/download/requestname?fileName=...` (Instruments/TradeInformation Consolidated), `rapinegocios/tickercsv/{data}` (tick a tick), listedCompaniesProxy (cadastro em JSON, não oficial). up2data/tempo real = pago.
- Cruzamento: negociação de insiders (VLMO) e volume anômalo (COTAHIST/TradeInformation) em estatal nos dias anteriores a decreto, MP ou fato relevante.
- Cruzamento: conselheiro/diretor no FRE x histórico de cargo público/candidatura TSE (porta giratória); acionista controlador de concessionária x doações.
- Cruzamento: CNPJ de fundo exclusivo declarado como bem no TSE x CAD_FI (gestor, PL) e RPPS municipal x fundos com problemas.

## Banco Central: SGS, Olinda, Dados Abertos
- SGS `api.bcb.gov.br/dados/serie/bcdata.sgs.{n}` (JSON, CORS): PTAX 1, Selic 11/432, IPCA 433, base monetária 1788, reservas 13621. Olinda OData v4 (CORS): PTAX, Pix por município, IFDATA (usar `ListaDeRelatorio()` com parênteses), taxaJuros v2, Expectativas/Focus, Agências, Tarifas, Dinheiro em circulação.
- Não existem em Olinda hoje: Reservas_Internacionais, CapitaisEstrangeiros, scr_agregados (404). SCR agregado e capitais estrangeiros ficam no CKAN `dadosabertos.bcb.gov.br/api/3/action` como CSV.
- Uso principal: deflacionar contratos e patrimônio (IPCA), converter contratos em moeda estrangeira (PTAX), comparar reajuste contratual vs. índice.
- Pix por município e crédito SCR agregado servem de proxy de atividade econômica para contrastar com receita própria no SICONFI.
- IFDATA para bancos públicos estaduais/cooperativas ligados a políticos e para quem custodia folha/depósitos judiciais de prefeituras.

## Compras: Compras.gov.br (SIASG) e PNCP
- `dadosabertos.compras.gov.br`: sem auth, mas cada módulo tem parâmetros obrigatórios e devolve 404 (não 400) quando faltam — contratos exige `codigoOrgao` + faixa `dataVigenciaInicial`; fornecedor exige `ativo`; PNCP_14133 exige datas + `codigoModalidade`; OCDS exige `buyerID` + datas.
- PNCP `pncp.gov.br/api/consulta/v1` (contratos, contratacoes/publicacao, atas, pca) cobre União, estados e municípios pela Lei 14.133 — é a fonte nacional de prefeituras; lento (timeouts ocasionais), paginar com tamanhoPagina ≤ 500 e janelas curtas de data.
- Cruzamento: dispensas fracionadas (várias abaixo do teto para o mesmo objeto/fornecedor/mês); fornecedor único vencendo em N municípios; ata carona.
- Cruzamento: item x preço unitário (módulo pesquisa-preço/ARP) contra o preço praticado em outros órgãos → superfaturamento.
- Cruzamento: data de assinatura no PNCP x período eleitoral (3 meses antes de 04/10/2026) x doador do prefeito/governador.

## TSE (candidaturas, bens, doações, resultados)
- CKAN `dadosabertos.tse.jus.br` + CDN `cdn.tse.jus.br/estatistica/sead/odsele/...` (consulta_cand_2026 já publicado; prestação de contas 2024 tem 1,3 GB); DivulgaCandContas REST em tempo real (eleição 2026 = 2062262026); resultados JSON em `resultados.tse.jus.br/oficial/ele{ano}/{cod}` (estrutura 2026 ainda 404).
- Detalhe completo desta família está em `apis-eleitoral.json`; aqui só os pontos de entrada.
- Cruzamento: doador CPF/CNPJ (2018/2020/2022/2024) x fornecedor no PNCP/Compras.gov/Portal da Transparência no mandato seguinte.
- Cruzamento: bens declarados (evolução 2018→2022→2026) x remuneração pública (servidores) x empresas em QSA da Receita.
- Cruzamento: candidato x CEIS/CNEP/CEAF (candidato que é sócio de empresa sancionada ou ex-servidor expulso).

## Diários oficiais: INLABS/DOU, DOEs estaduais, Querido Diário
- INLABS: cadastro gratuito, login por cookie, ZIP de XML por seção/dia (DO3 = contratos/licitações, DO2 = nomeações). Busca web in.gov.br instável hoje (HTTP/2 PROTOCOL_ERROR).
- Nenhum DOE estadual expõe API JSON documentada (SP e RJ = HTML/PDF; DO do município do Rio tem apifront interna, 500 hoje). Só scraping/OCR.
- Querido Diário: API pública `api.queridodiario.ok.org.br` (não `queridodiario.ok.org.br/api`, que devolve HTML) com full-text, filtro por IBGE/data e temas — cobertura parcial dos municípios.
- Cruzamento: extrato de contrato/dispensa no DOU/DOM x PNCP (o que aparece num e não no outro); nomeação em cargo comissionado x sobrenome/QSA de fornecedor.
- Cruzamento: decreto de emergência/calamidade municipal (Querido Diário) x pico de dispensas no PNCP na semana seguinte.
