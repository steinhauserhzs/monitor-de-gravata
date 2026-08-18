# Notas — Bases setoriais (lote B) — Monitor de Gravata

Verificado em 2026-08-18 com `curl -sS -m 20`. 46 entradas em `apis-bases-B.json` (42 ok, 4 falharam/instáveis). Ver JSON para URLs exatas e exemplos de resposta.

## Saúde (DATASUS: CNES, SIH, SIM, SINAN, TabNet, OpenDataSUS)
- API JSON estável só em `apidadosabertos.saude.gov.br` (swagger em `/static/swagger.json`, ~80 rotas: CNES estabelecimentos, SIM, leitos, estoque de medicamentos, PMMB); rotas antigas mudaram, reler swagger antes de usar.
- CNES liga cada unidade ao CNPJ mantenedor + tipo de gestão: cruzar OS/OSCIP contratadas pela prefeitura x unidade que existe/não existe x profissionais vinculados (médicos fantasmas).
- SIH (AIH .dbc via Transferência de Arquivos ou TabNet) dá valor pago por hospital/mês: comparar com repasses do FNS e contratos de gestão; picos sem aumento de leitos = superfaturamento.
- Estoque BNAFAR/Hórus por município x licitações de medicamentos (Transparência/PNCP): compra alta com estoque zerado é sinal de desvio.
- OpenDataSUS agora é `dadosabertos.saude.gov.br` (CKAN sem API JSON hoje); FTP `ftp.datasus.gov.br` só via cliente FTP/pysus (não respondeu HTTP).

## Previdência (INSS/DATAPREV, PREVIC)
- Sem API: INSS publica CSV mensal de benefícios concedidos/cessados por espécie/UF/APS; PREVIC publica cadastro de EFPC, patrocinadores, investimentos e penalidades (URL correta `acesso-a-informacao-1/dados-abertos`).
- Picos anormais de concessão por agência (fraude em benefício/BPC) e volume de descontos associativos ilegais por entidade — tema quente 2025/26.
- Fundos de pensão de estatais (Postalis, Petros, Funcef): cruzar dirigentes indicados politicamente x investimentos em FIPs x empresas no CEIS/CNEP (Greenfield).
- Cruzar CPF de servidores/candidatos com aposentadoria/BPC via Portal da Transparência (não via INSS direto).
- `dadosabertos.dataprev.gov.br` está fora do ar; usar dados.gov.br (busca "Previdência Social").

## Judiciário (DataJud CNJ)
- `api-publica.datajud.cnj.jus.br/api_publica_{tribunal}/_search` (Elasticsearch, POST) com chave pública oficial da wiki no header `Authorization: APIKey ...` — testado TJSP 200 hoje; chave rotaciona, ler sempre da wiki.
- Não expõe nome das partes (LGPD): usar número CNJ obtido em DOU/diários/TCU/MPF para montar ficha judicial de candidatos e fornecedores.
- Filtrar por classe (improbidade 64, ação penal, execução fiscal) e órgão julgador para contar processos por comarca/município.
- Base p/ "candidato tem ação de improbidade em andamento?" — sempre em conjunto com TSE (DivulgaCand) e TCU (contas irregulares).
- Sem CORS; paginar com search_after; size máx 10000.

## IBGE (Agregados/SIDRA, Localidades, Malhas, FTP)
- Todas as APIs sem chave e com CORS: agregados v3 (IPCA 1737, PIB municipal 5938, população 6579, PNAD 4093, PMC 8880, PIM-PF 8888) → 200.
- Código IBGE de município é a chave de junção com TSE, SICONFI, FNDE, DATASUS, TCEs — usar `/api/v1/localidades`.
- Denominadores: gasto/contrato per capita, contrato como % do PIB municipal, deflacionar séries por IPCA/INPC.
- Malhas GeoJSON p/ mapas coropléticos de sanções/emendas/obras paradas por município; setor censitário (Censo 2022 FTP) p/ vulnerabilidade onde a obra parou.
- POF/PNAD microdados no FTP (200) — contexto socioeconômico.

## Educação (INEP, FNDE)
- Censo Escolar (ZIP 2024 200) dá matrículas por escola: denominador do FUNDEB, PNAE (merenda), PNATE (transporte) — "alunos fantasmas" inflam repasse.
- SIOPE mostra se o município cumpriu 25% em educação e 70% do FUNDEB em profissionais; prefeito candidato à reeleição que descumpriu = destaque.
- Liberações FNDE (SIMAD) por município/programa + SIGPC (prestação de contas reprovada/omissa) x continuidade de repasses.
- Preço da merenda por aluno (contrato) x repasse PNAE x Censo Escolar = triangulação simples e forte.
- ENEM por escola x gasto per capita: gasta muito e entrega pouco é sinal.

## Trabalho (RAIS/CAGED)
- FTP `ftp.mtps.gov.br/pdet/microdados/` listado (RAIS, NOVO CAGED, CAGED); RAIS identificada por CNPJ só p/ pesquisadores, pública é por município/CNAE.
- Empresa vencedora de contrato milionário com 0–2 vínculos = fachada (usar RAIS estabelecimento/CNAE + porte da Receita).
- Vínculos em prefeituras/câmaras (CNAE administração pública) apontam inchaço eleitoral (admissões antes da eleição via CAGED mensal).
- Cruzar sócios de fornecedores com vínculos públicos = nepotismo/servidor fantasma (via CNPJ QSA + Transparência servidores).
- Novo CAGED mensal por município p/ narrativa econômica local.

## Meio ambiente e território (IBAMA, INPE, CAR, INCRA, SGB, INDE)
- IBAMA CKAN sem chave: embargos e autos de infração em CSV.zip (200) com CPF/CNPJ do autuado — cruzar com contratos, doações e candidatos proprietários rurais.
- INPE TerraBrasilis via GeoServer WFS (DETER/PRODES 200): sobrepor polígonos com SIGEF/CAR de políticos; usar bbox/CQL_FILTER (GetFeature completo dá timeout).
- SIGEF/INCRA: shapefile por UF sem login (200) com nome do detentor — patrimônio rural de candidatos e grilagem; CAR tem captcha (usar bases tratadas por MapBiomas/Imaflora).
- SGB risco geológico x obras de contenção/emendas de defesa civil; INDE GeoNetwork/WFS como catálogo de camadas oficiais.
- SINAFLOR (autorizações florestais) via busca CKAN IBAMA — madeireiras ligadas a políticos.

## Transportes (SENATRAN, ANAC RAB, ANTT, ANTAQ, DNIT, PRF)
- RAB CSV (200): aeronaves em nome de empresas contratadas/políticos (patrimônio incompatível, táxi-aéreo em campanha).
- ANTT CKAN (200): concessionárias, multas, reequilíbrios x doações; DNIT CKAN (200): pavimento ruim logo após obra = má execução.
- SENATRAN frota XLSX (200): denominador p/ contratos de sinalização/radar; frota oficial x locação de veículos.
- PRF acidentes (CSV via Drive): trechos letais x obras prometidas e não entregues.
- ANTAQ estatístico aquaviário fora do ar hoje; usar organização no dados.gov.br.

## Reguladoras (ANEEL, ANP, ANATEL, ANVISA, ANS, ANCINE)
- ANEEL CKAN + datastore_search (200): distribuidoras/geradoras (CNPJ), multas, subsídios CDE x sanções e doações.
- ANP: multas e ações de fiscalização por CNPJ, cadastro de postos, série de preços — postos que abastecem frota pública cobrando acima da média local; posto autuado vencendo licitação.
- ANATEL: acessos por município/prestadora x contratos de conectividade escolar; outorgas de rádio de políticos.
- ANVISA (CSV h5ai 200): fornecedores de medicamentos/EPI sem AFE; ANS (FTP 200): operadoras de planos de servidores com dívida de ressarcimento SUS ou situação prudencial ruim.
- ANCINE via dados.gov.br: produtoras beneficiadas por FSA/Rouanet ligadas a agências de publicidade governamental.

## Controle (TCU, TCEs, TCMs) e IPEA
- TCU: certidão consolidada por CNPJ (200) + listas POST de inidôneos/inabilitados (200) + acórdãos paginados (200) + contratos do próprio TCU; lista de contas irregulares vai ao TSE (Ficha Limpa). `dadosabertos.tcu.gov.br` morreu — usar `sites.tcu.gov.br/dados-abertos`.
- TCE-RS (CKAN, licitações CSV por órgão), TCE-SP (`/api/json/despesas/{municipio}/{ano}/{mes}` com CNPJ do fornecedor — 644 municípios), TCE-PE (`/DadosAbertos/{Entidade}!json` licitações/contratos) são as 3 APIs JSON prontas p/ produção.
- TCE-MG (SPA com download), TCM-SP (página), TCM-GO (SPA com catálogo REST) exigem inspeção no navegador; TCE-PR/TCE-CE instáveis hoje (503/500).
- Cruzamento-padrão: fornecedor por prefeitura (TCE) x CEIS/CNEP/TCU inidôneos x doadores do prefeito (TSE) x sócios com vínculo público (RAIS/Transparência).
- IPEAData OData4 (200, HTTP sem TLS): deflatores e indicadores sociais/regionais p/ contextualizar gasto e emendas.
