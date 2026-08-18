# Projetos e repositórios brasileiros semelhantes ao Monitor de Gravata

Pesquisa realizada em 2026-08-17/18 para o projeto open-source **Monitor de Gravata — o Pesadelo de Brasília** (super app anticorrupção comunitário). Objetivo: mapear quem já fez algo parecido no Brasil, com que código, licença, dados e regras, para **reusar em vez de reinventar**.

Metodologia e status dos testes:
- Repositórios: metadados reais via `gh api repos/...` (stars, licença, linguagem, `pushed_at`, `archived`) e `gh search repos`. Datas de "último push" abaixo são as devolvidas pela API na data da pesquisa.
- Sites/APIs: `curl -sS -m 15 -o /dev/null -w "%{http_code}"` e leitura via `r.jina.ai` quando necessário. Status registrado na coluna "Site (teste)".
- Documentos: manual da Alice (CGU, PDF, 22 pág.) e artigo da Revista Controle Externo TCE-GO sobre os robôs do TCU foram baixados e lidos.
- Legenda de status: `200 ok` = respondeu; `DNS` = domínio não resolve; `401` = exige token; `bloq` = WAF bloqueou o robô; `parked` = domínio abandonado/spam.

Arquivo irmão: `red-flags-br.json` (47 regras/red flags derivadas desta pesquisa, 41 implementáveis na v1).

---

## 1. Tabela geral

### 1.1 Projetos de controle social / dados abertos (núcleo)

| Projeto | Site (teste) | Repo GitHub | Licença | Stack | Último push | Stars | O que faz | O que reusar |
|---|---|---|---|---|---|---|---|---|
| **Operação Serenata de Amor** (Rosie + Jarbas) | serenata.ai `200 ok`; jarbas.serenata.ai `521` (fora do ar) | okfn-brasil/serenata-de-amor | MIT | Python (pandas, scikit-learn), Django (Jarbas), Elm | 2024-01-31 (repo declara "não recebe atualizações frequentes") | 4.603 | IA que audita reembolsos da cota parlamentar (CEAP Câmara + CEAPS Senado) e publica suspeitas com motivo; Jarbas = interface/API para validação humana | As **6 regras da Rosie** (seção 2), pipeline `Adapter → Core → classifiers`, scripts `research/src/fetch_*` (doações TSE, CNPJ, sanções federais, orçamento, fornecedores, geocodificação), modelo de "suspeita com motivo" + Twitter bot (`whistleblower`) |
| serenata-toolbox | — | okfn-brasil/serenata-toolbox | MIT | Python (pip) | 2020-07-15 | 153 | Download/limpeza dos datasets CEAP, CNPJ, TSE usados pela Rosie | Tradução de colunas PT→EN e adapters de download da Câmara |
| serenata-notebooks | — | okfn-brasil/serenata-notebooks | MIT | Jupyter | 2020-07-15 | 54 | ~40 hipóteses de auditoria exploradas pela comunidade (2016-2017) | Lista de hipóteses (refeição em dia de discurso, empresas fechadas, sanções, consultorias, táxi, TSE, portais municipais) — insumo direto para regras v2 |
| Perfil Político | perfilpolitico.serenata.ai (não testado; repo arquivado) | okfn-brasil/perfil-politico (+ -frontend) | GPL-3.0 | Django + PostgreSQL, Vue | 2022-09-21 (arquivado) | 166 | Ficha do candidato 2018/2022 100% de dados abertos: filiação, candidaturas, bens, receitas, proposições, empresas ligadas, suspeitas da Rosie | Modelo de dados `Politician/Candidate/Asset/Affiliation/Bill`, comandos `load_candidates/load_assets/load_income_statements/load_rosies_suspicions`, endpoint `/api/economic-bonds/candidate/<pk>/` (empresas dos candidatos via quadro societário) — **é o esqueleto da "Ficha 360"** |
| **Querido Diário** (OKBR) | queridodiario.ok.org.br `200 ok`; API api.queridodiario.ok.org.br `200 ok` (OpenAPI 0.19.0) | okfn-brasil/querido-diario; -api; -data-processing; -toolbox; -frontend; -comunidade | MIT | Python/Scrapy (raspadores), FastAPI, OpenSearch, Apache Tika | 2026-08-02 (ativo) | 1.369 / 61 / 29 / 33 / 57 / 37 | Raspa, converte e indexa diários oficiais municipais; busca full-text com trechos; temas com NER (Políticas Ambientais, Tecnologias na Educação); endpoints de CNPJ e sócios | **API pública** (`/gazettes?querystring=…&territory_ids=…`, `/gazettes/by_theme/{theme}`, `/company/info/{cnpj}`, `/company/partners/{cnpj}`, `/aggregates/{uf}`) para o "radar municipal"; padrão de spiders (~1.000+ municípios) e o pipeline de extração de texto |
| **Brasil.io** (Turicas) | brasil.io `302→/home` `200 ok`; API `401` (token gratuito obrigatório desde 2020) | turicas/brasil.io | GPL-3.0 | Python/Django, PostgreSQL | 2026-08-08 (ativo) | 1.039 | Datasets públicos limpos com API: `socios-brasil`, `eleicoes-brasil`, `gastos-deputados`, `gastos-diretos`, `salarios-magistrados`, `govbr`, `genero-nomes`, `covid19`, `cursos-prouni` | Datasets prontos (sócios/CNPJ, candidatos/bens/receitas TSE, cota parlamentar) via API com token; scripts de coleta em repos separados |
| turicas/socios-brasil | — | turicas/socios-brasil | LGPL-3.0 | Python (rows) | 2026-08-12 | 609 | Baixa/normaliza dados abertos do CNPJ (empresas, sócios, estabelecimentos) da Receita | Pipeline de conversão dos arquivos da Receita; base para grafo sócio↔empresa |
| turicas/eleicoes-brasil | — | turicas/eleicoes-brasil | GPL-3.0 | Python | 2026-08-16 | 165 | Captura/normaliza Repositório de Dados Eleitorais do TSE (candidatos, bens, receitas, despesas, votação) | Normalização de colunas TSE por ano — necessário para 2026 |
| turicas/transparencia-gov-br | — | turicas/transparencia-gov-br | LGPL-3.0 | Python | 2026-06-28 | 60 | Scraper do Portal da Transparência federal | Alternativa quando a API do Portal exigir chave |
| turicas/rows | — | turicas/rows | LGPL-3.0 | Python | 2026-08-08 | 886 | Lib tabular usada em todos os projetos acima | Utilitário |
| **Base dos Dados** | basedosdados.org `200 ok`; backend search `200 ok` | basedosdados/sdk; /pipelines; /backend; /website; /analises | MIT | Python/R SDK, BigQuery, Prefect | 2026-08-18 (ativo) | 422 / 48 / 16 / 30 / 112 | Data lake público (BigQuery) com dados tratados; datasets relevantes confirmados via API de busca: `br_tse_eleicoes` (Eleições Brasileiras), `br_tse_filiacao_partidaria`, `br_camara_dados_abertos`, `br_senado_dados_abertos`, `br_cgu_sancoes` (CEIS/CNEP/CEPIM/CEAF), `br_cgu_licitacao_contrato`, `br_me_cnpj` (Quadros Societários), `br_cgu_emendas_parlamentares`, `br_imprensa_nacional_dou`, `br_cgu_ebt`, `br_mides` (despesas subnacionais), `br_cgu_fef` | Consultas SQL prontas para agregados (ex.: doações × contratos) sem manter ETL próprio; SDK `basedosdados` |
| **OPS – Operação Política Supervisionada** (Lúcio Big) | ops.org.br / ops.net.br `200 ok`; institutoops.org.br `200 ok` | ops-org/operacao-politica-supervisionada (repo antigo `ops.net.br` arquivado; **não existe** `ops-github/OPS`) | Apache-2.0 | .NET 10 API + React 18/TS/Vite/Tailwind/shadcn + PostgreSQL 15; importadores C# (AngleSharp, Selenium, OCR Azure) | 2026-08-11 (ativo) | 58 | Auditoria pública da cota parlamentar de deputados federais, senadores e **deputados estaduais das 27 UFs**; folha de pagamento e frequência; cadastro de fornecedores com Receita/Minha Receita; denúncias voluntárias | **Importadores das 27 assembleias** (`OPS.Importador/Assembleias/*`), esquemas SQL (`Docs/BD/Schemas/*.sql`: camara, senado, assembleias, fornecedor, TSE), modelo `fornecedor` com flags `doador`, `controle`, `mensagem`, tabela `fornecedor_socio`, deflação por IPCA, agrupamentos de auditoria (seção 3) |
| Politicos.org.br / **Ranking dos Políticos** | politicos.org.br `302→ranking.org.br` `200 ok` (Next.js) | — (sem repo público encontrado; existe `hc3/politicos` que consumia antiga API dev.transparencia.org.br) | — | Next.js | — | — | Pontuação de deputados/senadores por votações selecionadas por conselho, gastos de cota, presença, processos; "Radar Político", boletins | Metodologia de score (positivos/negativos) como referência para o índice do Monitor; **não** copiar dados (sem licença aberta) |
| Parlametria (perfil-parlamentar, leggo, voz ativa) | parlametria.org.br `DNS` (morto); leggo.org.br `DNS` | parlametria/perfil-parlamentar; leggo-backend; leggoR; leggo-frontend (arq.); farol-verde; relatorio-financiamento; analytics-ufcg/voz-ativa-bot | AGPL-3.0 (leggo/perfil), GPL-3.0 (relatório financiamento), MIT (site) | Python/Django, R (leggoR), Vue/TS, Airflow | 2023-02-28 (perfil) / 2022-12-22 (leggo) — inativos | 27 / 8 / 20 | Compatibilidade eleitor×candidato por votações (Agenda Brasil Sustentável), acompanhamento de proposições com "temperatura", pressão nas redes, relatório de sócios de empresas financiando campanhas | `leggoR` (acesso R às APIs Câmara/Senado), lógica de "temperatura" de proposição, relatório de financiamento por setor econômico |
| Radar Parlamentar (PoliGNU/USP) | radarparlamentar.polignu.org `301`→ mesmo host (loop; efetivamente offline) | radar-parlamentar/radar (GitHub arquivado 2018) → **gitlab.com/radar-parlamentar/radar** (existe, 6 forks) | AGPL-3.0 (histórico) | Python/Django, PCA sobre votações | 2018 | 86 | Mapas de similaridade partidária por votações (PCA) | Algoritmo de posicionamento partidário; dataset de votações |
| Meu Congresso | meucongresso.com.br `200 ok` | não encontrado | — | web | — | — | Cidadão opina em projetos e vê quais parlamentares votaram como ele; painéis de votações | Ideia de "cenário de alinhamento" para o Manual do Candidato |
| Câmara Aberta | camaraaberta.org / .com.br `DNS` | não encontrado | — | — | — | — | (projeto histórico de dados da Câmara) | Nada reutilizável hoje |
| Legisla Brasil | legislabrasil.org `200 ok` | não encontrado | — | WordPress | — | — | Formação de assessores/mandatos, pesquisas, ranking de partidos/gabinetes | Referência de UX de "transparência de gabinete" |
| Bússola Eleitoral | bussolaeleitoral.com.br `200 parked` ("Meu Site"); .org.br `DNS` | não encontrado | — | — | — | — | Extinto | — |
| Congresso em Números / Deputado Federal Digital / Detetive de Contratos | `DNS` para todos os domínios testados | não encontrados no GitHub | — | — | — | — | Não localizados (nomes talvez de painéis internos ou projetos encerrados) | — |

### 1.2 ONGs de transparência e participação

| Projeto | Site (teste) | Repo GitHub | Licença | Stack | Último push | Stars | O que faz | O que reusar |
|---|---|---|---|---|---|---|---|---|
| **Transparência Brasil** | transparencia.org.br `200 ok`; tadepe.transparencia.org.br `SSL inválido`; obratransparente `DNS`; achadosepedidos.org.br `200 ok`; excelencias.org.br `200 parked` (domínio tomado por spam) | org Transparencia-Brasil (30+ repos): cesta-de-precos-pncp (2026-08-14), emendas-parlamentares-transferencias-especiais (R, 2026-03), achados-e-pedidos-site/-node-api (2026-02), workshop-america-aberta-consultando-APIs, validacao-de-empenhos-siga, TCU_creches_paralisadas, API_TDP_Python/api-ta-de-pe-R (2019-20) | CC-BY-4.0 (cesta), sem licença na maioria | R, PHP, Node, Jupyter | 2026-08-14 | 0-4 | Tá de Pé (obras escolares SIMEC → app), Obra Transparente, Excelências (fichas de parlamentares, extinto), Achados e Pedidos (LAI), Cesta de Preços PNCP | **cesta-de-precos-pncp** (referência de preços a partir do PNCP → regra de sobrepreço), notebooks de emendas/transferências especiais (Transferegov), scripts R do Tá de Pé (obras paralisadas), tutorial de APIs públicas |
| analytics-ufcg (UFCG, parceiro TB/MPPB) | empenhados.mppb.mp.br (não testado) | analytics-ufcg/empenhados (MIT), ta-de-pe-dados, ta-de-pe, monitor-cidadao-*, empenhados-patrimonio(-app), rcongresso, licitacoes-gf-eda, marcuswac/rede-de-conluios (GPL-3.0) | MIT / GPL | R (blogdown), TypeScript, Python | 2023-10 (monitor-cidadao) / 2020 (empenhados) | 15 / 48 / 9-10 | Mineração de indícios em licitações da PB (merenda, transporte escolar): agrupamento de licitantes (k-means por participações/municípios/taxa de vitória/valor), realinhamento de preços, localização de fornecedores, variação de preço unitário por NCM; **rede de conluios** (coparticipação de empresas); patrimônio de candidatos entre eleições | Regras concretas para o Radar de Contratos (seção 5.4); `rcongresso` (R) |
| Observatório Social do Brasil | osbrasil.org.br `200 ok` | não há repo | — | WordPress | — | — | Rede de observatórios municipais; "Acompanhe Seu Vereador"; Força Tarefa Cidadã com TCU | Metodologia de monitoramento municipal e canal de voluntários locais (integração comunitária, não código) |
| Contas Abertas | contasabertas.com.br `406` (WAF) | — | — | — | — | — | Análises do orçamento federal | — |
| Instituto Não Aceito Corrupção | naoaceitocorrupcao.org.br `200 ok` | — | — | Wix | — | — | Advocacy, pesquisas, CEID | Conteúdo educativo/parcerias |
| Fiquem Sabendo | fiquemsabendo.com.br `200 ok` | — | — | — | — | — | Agência de dados via LAI, WikiLai, "Don't LAI to me" | Base de pedidos LAI e guia de LAI para o módulo "pergunte ao poder público" |
| Colab | colab.com.br `200 ok` | — | — | app proprietário | — | — | Zeladoria/consultas com prefeituras (1 mi usuários) | Nada de código; possível parceiro |
| Mudamos (ITS Rio) | mudamos.org `200 ok` | (repos antigos itsriodejaneiro/mudamos-*) | — | React Native, blockchain de assinaturas | — | — | Assinatura digital de projetos de lei de iniciativa popular | Modelo de assinatura verificável (fora de escopo v1) |
| Cidade Democrática | cidadedemocratica.org.br `200 ok` | — | — | WordPress | — | — | Processos participativos | — |
| DadosJusBR | dadosjusbr.org (API api.dadosjusbr.org) | dadosjusbr/api (Go, 44★, 2026-05), alba, storage, coletores (arq.), coletor-mpgo, parsers MP | MIT | Go, Python | 2026-05-13 | 44 | Remunerações do sistema de justiça (penduricalhos) padronizadas | Regra "remuneração acima do teto" e coletores de MPs/tribunais |

### 1.3 Clientes de API e ferramentas de dados (GitHub)

| Repo | Licença | Stack | Último push | Stars | O que faz | Reuso |
|---|---|---|---|---|---|---|
| BrasilAPI/BrasilAPI | MIT | Node/Next (Vercel) | 2026-08-10 | 10.995 | API pública: CNPJ, CEP, bancos, feriados, IBGE, etc. (`/api/cnpj/v1/{cnpj}` testado `200`) | Consulta de CNPJ sem chave; padrão de projeto serverless na Vercel |
| cuducos/minha-receita (GitHub arquivado → **codeberg.org/cuducos/minha-receita**) | MIT | Go + PostgreSQL | 2026-01 (GitHub) | 1.597 | API de CNPJ da Receita (`https://minhareceita.org/{cnpj}`, `docs.minhareceita.org` `200 ok`; grafo em grafo.minhareceita.org) | Fonte principal de cadastro/sócios/CNAE/situação/capital (usada pela OPS) |
| Hitmasu/OpenCNPJ | MIT | C# | 2026-07-26 | 391 | API pública de CNPJ | Alternativa/fallback |
| Cepesp-Fgv/cepesp-python, cepesp-r, cepesp-rest | (sem licença) | Python/R | 2023-09/10 | 38/46/22 | Acesso ao CEPESPData (resultados eleitorais TSE agregados) | Séries históricas eleitorais 1998-2022 |
| GV-CEPESP/cepespdata | — | docs | 2024-07 | 7 | Documentação/tabelas auxiliares CEPESP | Dicionários TSE |
| gabrielgz0/pypncp | MIT | Python async | 2026-06-23 | 5 | Cliente da API de Consulta do PNCP | Referência de endpoints/paginação PNCP (`/api/consulta/v1/contratos` testado `200`) |
| Licinexus/licinexus-mcp | MIT | TypeScript (MCP) | 2026-08-03 | 77 | MCP server PNCP + Receita Federal | **Pode ser plugado direto no agente do Monitor** para consultas PNCP |
| thiagosy/PNCP | — | Jupyter | 2024-06 | 28 | Coleta de processos do PNCP | Exemplos de payload |
| brasilemdados/Olho-Cidadao | — | Python | 2026-03-31 | 6 | Integra Câmara, Senado, SIOP, Portal da Transparência | Ideias de integração |
| rvsanches/skills-datajud-djen | MIT | Agent Skills (md) | 2026-07-12 | 13 | Skills com conhecimento de produção sobre DataJud e DJEN (CNJ) | Instalar como skill do agente para consultas judiciais |
| DanielFillol/DataJUD_API_CALLER | Apache-2.0 | Go | 2023-10 | 8 | Automação DataJud | Exemplo de queries Elasticsearch do DataJud |
| ops-org/eleicoes-brasil (fork de turicas) | — | Python | 2026-03 | 0 | Idem turicas | — |
| brasiliapp/web | — | TypeScript | 2024-04 | 36 | Monitor de cota, verba de gabinete e assessores | UI de referência |
| turicas/gastos-deputados | LGPL-3.0 | Python | 2020-05 | 30 | Baixa/limpa CEAP | Script de download da cota |
| anapaulagomes/licitacoes-de-feira (arq.), unb-mds/LicitaBSB-24.1 (MIT, 2025-11) | LGPL/MIT | Python/HTML | — | 18/12 | Licitações municipais (Feira de Santana; DF) | Padrão de raspagem de portais municipais |
| andryw/quemMeRepresenta | GPL-2.0 | CSS/JS | 2018 | 7 | "Quem me representa" (votações) | — |
| Transparencia-Brasil/cesta-de-precos-pncp | CC-BY-4.0 | HTML/R | 2026-08-14 | 1 | Cesta de preços a partir do PNCP | Regra de sobrepreço |
| marcuswac/rede-de-conluios | GPL-3.0 | R/Shiny | 2020-05 | 9 | Grafo de coparticipação de licitantes (TCE-PB) | Regra de conluio |

Buscas sem resultado relevante no GitHub (com `gh search repos`): "camara-api client", "compras.gov.br api", "corrupção brasil dados", "irregularidades licitações", "fiscalização licitações machine learning" (nomes genéricos; a maioria dos clientes é ad hoc em notebooks).

---

## 2. Regras da Rosie (Serenata de Amor) — documentação completa

Fonte: código em `rosie/rosie/chamber_of_deputies/classifiers/*.py`, `rosie/rosie/core/classifiers/invalid_cnpj_cpf_classifier.py`, `settings.py` (lido via raw.githubusercontent.com em 2026-08-18). Arquitetura: cada classificador é um `TransformerMixin` do scikit-learn com `fit/transform/predict`; `Core` roda todos e grava `suspicions.xz` (CSV) com uma coluna booleana por regra; Jarbas mostra a suspeita e o motivo. Chaves únicas: `applicant_id, year, document_id`.

Câmara (`CLASSIFIERS`): `meal_price_outlier`, `over_monthly_subquota_limit`, `suspicious_traveled_speed_day`, `invalid_cnpj_cpf`, `election_expenses`, `irregular_companies_classifier`. Senado: apenas `invalid_cnpj_cpf`.

| # | Regra (chave) | Lógica exata | Dados | Observações para o Monitor |
|---|---|---|---|---|
| R1 | `invalid_cnpj_cpf` — `InvalidCnpjCpfClassifier` | Para `document_type ∈ {bill_of_sale, simple_receipt, unknown}`: `recipient_id` zfill(11) precisa validar como CPF **ou** zfill(14) como CNPJ (lib `brutils`); se nenhum valida → suspeito | CEAP/CEAPS: `recipient_id`, `document_type` | Trivial em TS (`validar-cpf/cnpj`); vale para PNCP também |
| R2 | `irregular_companies_classifier` — `IrregularCompaniesClassifier` | Suspeito se `situation ∈ {BAIXADA, NULA, SUSPENSA, INAPTA}` **e** `situation_date < issue_date` (empresa já estava irregular quando emitiu a nota) | CEAP + cadastro CNPJ (situação, data da situação) | Usar minha-receita/BrasilAPI; a mesma regra é a "Situação Cadastral" da Alice |
| R3 | `meal_price_outlier` — `MealPriceOutlierClassifier` | Só `category == 'Meal'`, `len(recipient_id) == 14` (CNPJ) e nome do fornecedor sem regex `hote(?:(?:ls?)|is)` (exclui hotéis). Por CNPJ calcula `mean, std, congresspeople (nº de parlamentares distintos), records`. Empresas "conhecidas": `congresspeople > 3 and records > 20`. `KMeans(n_clusters=3)` em `[mean, std]` das conhecidas; para cada cluster `threshold = mean_cluster + 4*std_cluster`. Para CNPJ conhecido usa `threshold_cnpj = mean + 3*std` (sobrescreve o do cluster). Suspeito se `net_value > threshold`. Saída -1/1 | CEAP alimentação | Reimplementar com k-means simples ou substituir por percentil 99 por CNPJ + por cluster |
| R4 | `over_monthly_subquota_limit` — `MonthlySubquotaLimitClassifier` | Ordena por `issue_date`; agrupa por `applicant_id, month, year`; `cumsum(net_value*100)`; marca as despesas cujo acumulado ultrapassa o teto da subcota no período. Tetos hard-coded (centavos): subcota 120 (locação de veículos) 1.000.000 (12/2013–03/2015), 1.090.000 (04/2015–04/2017), 1.271.300 (05/2017+); 122 (táxi/pedágio/estacionamento) 250.000 (12/2013–03/2015), 270.000 (04/2015+); 3 (combustíveis) 450.000 (07/2009–03/2015), 490.000 (04–08/2015), 600.000 (09/2015+); 8 (segurança) 450.000, 800.000, 870.000; 137 (cursos/eventos) 769.716 (10/2015+) | CEAP: `subquota_number, month, year, net_value, issue_date` | Tetos precisam ser atualizados (Ato da Mesa 2023+); manter tabela versionada por período |
| R5 | `suspicious_traveled_speed_day` — `TraveledSpeedsClassifier` | Só refeições, com lat/long dentro do bounding box do Brasil (lon −73,99..−34,79; lat −33,74..5,27), `is_party_expense == False`. Agrupa por `applicant_id, issue_date`: `distance_traveled` = soma das distâncias (Vincenty) entre todos os pares de coordenadas do dia; `expenses` = nº refeições. `fit`: polinômio grau 3 `distance ~ expenses`. `predict`: `expected = poly(expenses)`; `diff = |expected − distance|`; `expenses_threshold_outlier = expenses > 8`; threshold de `diff` escolhido em passos de 50 km para atingir contaminação alvo 0,1%. Suspeito se qualquer dos dois | CEAP + geocodificação dos fornecedores (Serenata usava `geocode_addresses.py`) | Depende de geocodificar CNPJs (CEP→lat/long via BrasilAPI/CEP + Nominatim); deixar para v2 |
| R6 | `election_expenses` — `ElectionExpensesClassifier` | Suspeito se `legal_entity == '409-0 - CANDIDATO A CARGO POLITICO ELETIVO'` (natureza jurídica do CNPJ) | CEAP + cadastro CNPJ | Trivial via natureza jurídica 409-0 |

Hipóteses adicionais exploradas nos notebooks (não viraram classificador, mas são regras candidatas): reembolso de refeição em dia de discurso/presença em plenário (fgrehm 2016-12-19 e 2017-05-29), empresas fechadas (anaschwendler 2017-02-20), fornecedores com sanções federais (marcusrehm 2016-12-12/2017-01-15), consultorias (cuducos 2017-07-17), táxi/transporte local (fabiocorreacordeiro), "sex places" (cuducos 2017-04-21, motéis), gastos com hospedagem (samuelgrigolato), comparação de versões da API da Câmara, portais de transparência municipais (jtemporal 2017-05-19), uso de dados do TSE (rafonseca 2017-05-10), OCR de recibos com Google Vision (fgrehm 2016-12-30). Scripts de coleta em `research/src`: `fetch_campaign_donations.py`, `fetch_cnpj_info.py`, `fetch_federal_sanctions.py`, `fetch_federal_budget_datasets.py`, `fetch_purchase_suppliers.py`, `fetch_deputies_advisors.py`, `fetch_tse_data.py`, `fetch_receipts.py`, `geocode_addresses.py`, `get_family_names.py`.

---

## 3. Regras da OPS (Operação Política Supervisionada)

Fonte: repo `ops-org/operacao-politica-supervisionada` (README, `Docs/BD/Schemas/*.sql`, `OPS.Core/Enumerators/AgrupamentoAuditoria.cs`, `FornecedorRepository.cs`, `OPS.Site/src/pages/fornecedor/FornecedorDetalhe.tsx`), site ops.net.br e institutoops.org.br (páginas "Operações da OPS", "Eu, fiscal", "Tutoriais OPS").

Constatação importante: **a OPS não codifica classificadores automáticos como a Rosie**. O sistema é uma plataforma de *auditoria assistida* — importa e normaliza os dados, enriquece o fornecedor com a Receita Federal e entrega filtros/agrupamentos para que voluntários encontrem indícios e registrem denúncias (tabelas `denuncia`, `dossie`, `AcompanhaDenuncias` no repo antigo). Ainda assim, dá para extrair as "regras" implícitas:

Agrupamentos de auditoria (`EnumAgrupamentoAuditoria`): Parlamentar (1), Despesa/tipo (2), Fornecedor (3), Partido (4), Estado (5), Documento/nota fiscal (6), Ano (7). O front oferece filtro por deputado, tipo de despesa, fornecedor, partido, UF, período, e ranking de "campeões de gasto" e "maiores notas".

Enriquecimento do fornecedor (`fornecedor.fornecedor_info` + `fornecedor_socio`, via minha-receita/ReceitaWS): situação cadastral e data, motivo, situação especial, data de abertura, capital social, porte, MEI/Simples, CNAE principal e secundários, natureza jurídica, endereço, quadro societário com qualificação; totais recebidos de CEAP Câmara/Senado/Assembleias. Flags manuais: `fornecedor.doador` (é doador de campanha), `controle` e `mensagem` (anotação do auditor). O front destaca em vermelho fornecedor não ATIVO e mostra "Encerramento" quando baixado.

Alertas/critérios usados nas operações públicas da OPS (base para regras):
1. **Fornecedor irregular** — situação cadastral ≠ ATIVA, empresa baixada antes da nota (idem Rosie R2).
2. **Nota duplicada / mesmo documento** e valores redondos recorrentes (denúncias clássicas).
3. **Operação Tanque Furado (1-4)** — abastecimentos incompatíveis: vários no mesmo dia, litragem acima da capacidade do tanque, combustível em volume incompatível com deslocamento.
4. **Operação Advogado do Diabo** — consultoria jurídica paga com cota a escritório que patrocina o próprio parlamentar em juízo (28 deputados + 1 senadora, R$3,85 mi denunciados ao TCU/MPF).
5. **Operação Clone Maldito** — "trabalhos técnicos" plagiados (impossível auditar por falta de cópia; a regra do Monitor: cobrar transparência do produto).
6. **Locação de aeronaves** (fiscalização colaborativa 2018) — voos com valores/rotas incompatíveis; deputado denunciado ao MPF.
7. **Operação Alecrim Dourado** (ALEMS) — quase mil notas de deputados estaduais; devolução de valores e mudança de regras.
8. **Descampanha eleitoral** — levantamento de pendências judiciais de candidatos (2016).
9. Blog 2026: "farra silenciosa da verba indenizatória" — concentração em **divulgação** e **locação de veículos** (regra de concentração por tipo/fornecedor); "penduricalhos" (remuneração acima do teto).
10. Verificação de fornecedor doador de campanha do parlamentar (`doador = true`).
11. Deflação por IPCA para comparar gastos entre anos (`IndiceInflacaoImportador`).

Reuso concreto: importadores das 27 assembleias (o único código aberto que cobre CEAP estadual), DDL PostgreSQL pronto, fluxo denúncia→dossiê→ofício ao TCU/MPF (o Monitor pode reproduzir como "casos" comunitários), tutorial "Fiscalizando Meu Município" (PDF) para o onboarding de voluntários.

---

## 4. Robôs de governo (TCU / CGU / TCEs / MPs)

| Robô | Órgão | O que faz (verificado) | Lógica/tipologias documentadas | Fonte lida |
|---|---|---|---|---|
| **Alice** (Analisador de Licitações, Contratos e Editais) | CGU (criada 2015; TCU adaptou) | Lê diariamente editais/atas de pregão do Compras.gov.br, Licitações-e (BB), Licitações Caixa e dispensas/inexigibilidades no DOU; aplica **>30 trilhas** cruzando **>40 bases** (sanções, vínculos empregatícios, Receita), leitura textual de editais/TR e classificadores de IA; envia informe por e-mail com "Alertas" (em branco = nada detectado nas trilhas ativas). 2024: 161 mil processos analisados, 212 auditorias (R$30,57 bi), R$1,25 bi de benefícios; disponível a estados/municípios (126 entes cadastrados); integração ao Compras.gov.br a partir de 2026 | Classificação: **Indício de irregularidade** (ilegal) × **Risco** (exige verificação); por fase: (a) planejamento/edital: exigência de certidão de quitação não prevista na Lei 14.133 (indício); métrica homem-hora em TI vedada pela IN SGD 94/2022 (risco); (b) seleção do fornecedor: vencedora sem situação cadastral ATIVA (indício); baixo capital social vs. vulto do contrato — fachada/fantasma, Ac. 2093/2021-P (risco); (c) gestão contratual: aditivos > 25% (50% reformas) (indício); quadro de funcionários insuficiente — Ac. 2668/2022-2ªC e 993/2022-P (risco). Artigo TCE-GO acrescenta as 3 classes do TCU: **proibição de contratar**, **empresas fantasmas**, **baixa competitividade**, com fator de risco por gravidade + materialidade (valor estimado). Trilhas de restrição à competitividade baseadas na jurisprudência do TCU | Manual Prático Alice v1.0/2025 (PDF CGU); gov.br/cgu/…/alice; Revista Controle Externo TCE-GO 2020 |
| **Sofia** (Sistema de Orientação sobre Fatos e Indícios para o Auditor) | TCU | Plug-in que, ao redigir relatório/instrução, captura CNPJs citados e verifica sanções, responsabilizações em outros processos do TCU e contratos com a APF | Cruzamento automático CNPJ × (sanções, processos TCU, contratos) — equivalente ao "enriquecimento de empresa" do Monitor | Artigo TCE-GO |
| **Monica** (Monitoramento Integrado para o Controle de Aquisições) | TCU | Painel de todas as compras federais (SIASG) por UASG, fornecedor e material/serviço, com exportação | Painel analítico; sem regra automática | Artigo TCE-GO; Ac. 2.593/2017-P |
| **Adele** (Análise de Disputa em Licitações Eletrônicas) | TCU | Painel da dinâmica de cada pregão: lances cronológicos, empresas participantes (composição societária, ramo) e **detecção de mesmo IP usado por mais de uma licitante** | Sócios em comum, mesmo IP, padrão de lances (competição simulada) | Artigo TCE-GO |
| **Ágata** (Aplicação Geradora de Análise Textual com Aprendizado) | TCU/SGI | ML para refinar/atualizar os alertas da Alice (reduz falsos positivos) | Aprendizado supervisionado sobre feedback dos auditores | Artigo TCE-GO |
| **Carina** (Crawler e Analisador de Registros da Imprensa Nacional) | TCU (desde 04/2020) | Rastreia diariamente tipologias em aquisições publicadas no DOU (dispensas, inexigibilidades, extratos) | Mesmas tipologias da Alice aplicadas ao DOU | Artigo TCE-GO |
| **Alice Nacional** | TCU + 15 TCEs | Extensão da Alice a editais/atas de estados e municípios | idem | Artigo TCE-GO |
| **Painel de Risco de Contratações / Malha Fina de Convênios** | CGU | Malha Fina (desde 2018): ML supervisionado prevê resultado da análise de prestação de contas de convênios no Transferegov; combina **trilhas de auditoria** (inconformidades legais cruzando Transferegov com bases da CGU) com **classificação de risco** vs. limite de tolerância; regulamentada pela Portaria Conjunta MGI/CGU 41/2023 e IN 5/2018 | Score de risco + trilhas; a lógica pública está nas portarias | gov.br/cgu notícias 2018/2019/2023; Portaria 41/2023 |
| **Suricato / Solaris** | TCE-MG | Suricato = Diretoria de Fiscalização Integrada e Inteligência; **Solaris** (Seletor de Objetos em Licitações para Análise e Retificação de Irregularidades) lê diariamente editais de todo o estado; treinado inicialmente para **direcionamento** e **aquisição de bens de luxo**; 161 suspeitas → 25 confirmadas → R$7 mi evitados; em agosto/2025: 2.297 licitações, 60 alertas, R$91,7 mi economizados; 100% de atendimento pelos municípios | Tipologias moduláveis por jurisdicionado; leitura de edital + comunicado ao município | tce.mg.gov.br notícias; painelsuricato |
| **Audesp** | TCE-SP | Sistema de captação eletrônica de dados dos municípios paulistas (fase IV: licitações e contratos); dados usados pelo MPSP ("Soli") | Base de dados, não robô de alerta | mpsp.mp.br (Soli passa a contar com dados de licitações do Audesp) |
| **Sinapses** | CNJ (não MPF) | Plataforma nacional de armazenamento/treinamento supervisionado de modelos de IA do Judiciário (Res. CNJ 332/2020) | Não é robô de fiscalização | cnj.jus.br |
| **MPF Sinapses / MP-SP Farol / "Fiscalização baseada em risco"** | — | **Não verificados**: `sinapses.mpf.mp.br` e `farol.mpsp.mp.br` não resolvem; buscas não confirmaram ferramenta "Farol" do MPSP (existe "Farol" do TCE-SC e "Farol AI" comercial). "Fiscalização baseada em risco" é o princípio geral (matriz materialidade × relevância × risco) usado por TCU/CGU/TCEs | — | — |
| Outros citados nas buscas | TCE-SC (IA para editais, finalista de case), TCDF (IA em licitações, R$2 bi), MP-MT + Microsoft (IA em termos de referência/superfaturamento) | — | — | resultados de busca |

Lição transversal: todos operam **alerta ≠ prova** ("indício/risco" com fator de gravidade + materialidade, revisão humana), publicam por e-mail diário e medem benefício financeiro. O Monitor deve replicar exatamente essa semântica (severidade, materialidade, "revisado por humano").

---

## 5. O que reusar e como

### 5.1 Código
1. **Rosie (MIT)** → portar as 6 regras para TypeScript como funções puras `rule(despesa, ctx) → Suspeita | null` (R1, R2, R4, R6 imediatas; R3 com k-means simples ou percentis; R5 em v2). Guardar tetos de subcota como tabela versionada.
2. **OPS (Apache-2.0)** → usar `Docs/BD/Schemas/*.sql` como base do modelo relacional (parlamentar, despesa, fornecedor, sócio, TSE); portar a lógica dos **importadores das 27 assembleias** (mesmo que reescritos em TS/Python) — é o único código aberto para CEAP estadual; adotar o modelo `fornecedor {doador, controle, mensagem}` como "anotações da comunidade".
3. **Perfil Político (GPL-3.0)** → copiar o **modelo de dados** e a sequência de cargas TSE (filiação → candidatura → bens → receitas → proposições → CNPJ) para a Ficha 360; atenção: GPL obriga a manter licença compatível se copiar código literal (usar como referência de design ou licenciar o Monitor como GPL/AGPL).
4. **Querido Diário API** → consumir direto (sem ETL) no Radar Municipal: busca por município + termos ("dispensa", "emergencial", "inexigibilidade", "aditivo", nome do fornecedor); `/company/partners/{cnpj}` como fallback de sócios.
5. **minha-receita / BrasilAPI / OpenCNPJ** → camada de CNPJ com fallback em cascata; cache local.
6. **turicas/socios-brasil + eleicoes-brasil** → gerar localmente as tabelas de sócios e de candidatos/receitas/bens 2026 (ou usar Brasil.io API com token / Base dos Dados BigQuery).
7. **Base dos Dados** → SQL para cruzamentos pesados (`br_cgu_sancoes` × `br_cgu_licitacao_contrato` × `br_me_cnpj` × `br_tse_eleicoes`), evitando manter ETL na v1.
8. **Licinexus/licinexus-mcp** e **rvsanches/skills-datajud-djen** → plugar no agente (MCP/skills) para consultas PNCP, Receita e DataJud.
9. **empenhados / rede-de-conluios / cesta-de-precos-pncp** → regras de contratação (conluio, realinhamento precoce, sobrepreço por item, clusters de licitantes).
10. **DadosJusBR API** → regra de remuneração acima do teto e dados de MPs/tribunais.
11. **Skills e MCPs já instalados no ambiente do projeto**: agent-reach (acesso web), codebase-memory-mcp; e a biblioteca de 817 playbooks de cibersegurança para o módulo de segurança do app.

### 5.2 Dados/APIs testadas nesta pesquisa (status)
- Câmara `dadosabertos.camara.leg.br/api/v2` `200`; Senado `legis.senado.leg.br/dadosabertos` `200`; PNCP `pncp.gov.br/api/consulta/v1/contratos` `200`; TSE dados abertos `200`; BrasilAPI CNPJ `200`; Querido Diário API `200`; Base dos Dados search `200`; Portal da Transparência API `401` (exige `chave-api-dados` gratuita); Brasil.io API `401` (token gratuito); portal.tcu.gov.br `bloqueado` para robôs (usar downloads/`contas.tcu.gov.br`).

### 5.3 Padrões de produto a copiar
- Serenata: "suspeita + motivo + link para o documento" e bot que publica no social (whistleblower).
- OPS: agrupamentos de auditoria e ficha do fornecedor com badge de situação; fluxo denúncia → dossiê → ofício.
- Alice: severidade (indício × risco), fase do processo, materialidade em cifrões, "alertas em branco" também são informação, informe diário por e-mail.
- Ranking dos Políticos: score explicável com metodologia pública revista anualmente.
- Querido Diário: comunidade de raspadores por município com censo/priorização.

### 5.4 Regras já derivadas → `red-flags-br.json` (47 itens)
Parlamentar (15), contratação (17), empresa (3), eleitoral (5), servidor (2), obra (2), municipal (2). 41 marcadas como implementáveis na v1 apenas com APIs abertas testadas; 6 dependem de texto de edital/LLM, geocodificação ou dados judiciais (v2).

---

## 6. Como o Monitor de Gravata se diferencia e integra

**Diferenciação**
1. **Escopo 360 num único produto**: os projetos existentes são verticais (Rosie = cota; OPS = cota + folha; QD = diários; Perfil Político = candidatos; Tá de Pé = obras; Alice = editais). O Monitor junta ficha do político + contratos + empresas + sanções + manual do candidato 2026 + catálogo de APIs, com o mesmo CNPJ/CPF/nome como chave de cruzamento.
2. **Motor de red flags aberto e versionado** (JSON + funções puras) em vez de notebooks dispersos ou trilhas fechadas de governo — cada regra cita a fonte (Rosie/OPS/TCU/CGU/TCE), severidade, dados e pseudocódigo, e pode ser auditada/proposta pela comunidade via PR.
3. **Comunidade que audita a máquina** (modelo Serenata/OPS) com trilha de revisão humana obrigatória antes de qualquer publicação nominal — mitiga risco jurídico (LGPD/difamação) que projetos anteriores enfrentaram.
4. **Timing eleitoral 2026**: registro de candidaturas encerrado em 15/08; o Manual do Candidato cruza DivulgaCand + bens + doações + contratos + sanções + CNCIAI em tempo de campanha (nenhum projeto ativo faz isso hoje — Perfil Político e Bússola estão mortos).
5. **Cobertura municipal via QD + PNCP** (a maioria dos projetos vivos é federal; OPS cobre assembleias, mas não prefeituras).
6. **Agente + MCP/skills** (licinexus-mcp, datajud skills, agent-reach) para consultas sob demanda, algo que nenhum dos projetos civis oferece.

**Integração (não competir)**
- Consumir Querido Diário, Base dos Dados, Brasil.io, minha-receita e BrasilAPI como *upstream* e devolver spiders/PRs (QD) e datasets limpos (BD/Brasil.io).
- Reaproveitar Rosie/OPS com crédito e mesma licença nas partes portadas; propor à OPS exportação em JSON das denúncias/dossiês públicos.
- Enviar achados relevantes pelos canais oficiais (Fala.BR/CGU, ouvidorias dos TCEs, MPF) e documentar como "casos" — a Alice aceita cadastro de entes; o Monitor pode publicar um "informe diário" público análogo.
- Parcerias naturais: OKBR (embaixadoras/QD), Instituto OPS (voluntários), Transparência Brasil (cesta de preços, LAI), OSB (rede municipal), Fiquem Sabendo (LAI), DadosJusBR.

---

## 7. Lacunas / não verificado
- Não foi possível ler páginas do portal.tcu.gov.br (WAF bloqueia); as informações dos robôs vêm do artigo da Revista Controle Externo (TCE-GO, 2020) e do manual da CGU (2025).
- MPF "Sinapses" e MP-SP "Farol": não localizados/confirmados (domínios não resolvem; Sinapses é do CNJ). "Detetive de Contratos", "Congresso em Números", "Deputado Federal Digital", "Câmara Aberta": sem site ativo nem repo público.
- Radar Parlamentar migrou para GitLab; não foi possível confirmar se há instância no ar.
- Portal da Transparência e Brasil.io exigem token — endpoints não exercitados além do 401.
- Regras exatas das ">30 trilhas" da Alice e das tipologias do Solaris não são públicas; documentamos os exemplos oficiais e as classes.
- Tetos atuais de subcota CEAP (Ato da Mesa vigente) precisam ser conferidos antes de ligar a regra R4.
- Politicos.org.br/Ranking: metodologia completa está em manual em PDF não baixado; sem licença de dados.
