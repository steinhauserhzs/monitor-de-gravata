# Ficha 360 do Político — Especificação (Monitor de Gravata)

Data: 2026-08-18 · Eleições: 04/10/2026 · Status: rascunho de spec v1 (endpoints testados via curl nesta data; ver `ficha-360-endpoints.json`)

## 0. Tese e princípios

A Ficha 360 é a página única de um político/candidato que responde, com dados oficiais e rastreáveis, a sete perguntas do cidadão:
**quem é, o que fez, como votou, quanto gastou, quem financia, com quem se relaciona, o que dizem dele.**

Princípios não negociáveis (também são a mitigação jurídica central):

1. **Fato ≠ hipótese.** Todo campo carrega `grau_confianca` e `fonte`. Cruzamentos por nome/sobrenome NUNCA viram afirmação; viram `Vinculo{tipo, grau_confianca:'hipotese', verificado_por:null}` com rótulo visível "hipótese a verificar".
2. **Fórmula pública.** Todo indicador/rank tem fórmula publicada nesta spec e link "como calculamos" na UI. Sem caixa preta.
3. **Direito de resposta.** Todo card tem "contestar este dado" (issue pública + e-mail). Correções entram como `EventoTimeline{tipo:'correcao'}`.
4. **Fonte primária linkada.** Nenhum número sem URL do dado oficial (ou do bulk + hash + data de coleta).
5. **Sem CPF exposto.** Onde a fonte traz CPF completo (TSE candidato, TCU inabilitados), armazenamos hash + últimos dígitos mascarados; exibimos mascarado.
6. **Simetria.** Mesmas métricas para todos da mesma casa/cargo; sempre benchmark da bancada/UF/casa (percentil), nunca número solto.

Disponibilidade (legenda usada em toda a spec): **auto** = API aberta sem chave · **chave** = precisa de token gratuito · **bulk** = arquivo periódico (CSV/ZIP) · **comunidade** = precisa de verificação/curadoria humana.

---

## 1. Dimensões

### 1.1 Identidade
- **O que mostra:** nome civil, nome de urna, foto, partido atual, UF, cargo, data de nascimento, escolaridade, ocupação declarada, e-mail institucional, situação (exercício/licença/suplente), redes oficiais (só as declaradas no TSE/Casa).
- **Fontes (testadas):**
  - Câmara `GET /api/v2/deputados?nome=` e `/deputados/{id}` (200) — `ultimoStatus`, `cpf` (vem vazio), `redeSocial[]`, `escolaridade`.
  - Senado `GET /dadosabertos/senador/{codigo}.json` (200) — `IdentificacaoParlamentar`, `DadosBasicosParlamentar`, `UltimoMandato`.
  - TSE `GET /divulga/rest/v1/candidatura/buscar/{ano}/{UF}/{idEleicao}/candidato/{id}` (200) — `nomeCompleto, cpf, tituloEleitor, ocupacao, grauInstrucao, fotoUrl, emails, sites, eleicoesAnteriores[]`.
- **Chave de identidade canônica:** `politico.id = 'br:' + hash(cpf)` quando o CPF vier do TSE; senão `camara:{id}` / `senado:{codigo}` com tabela de reconciliação (`ids_externos`). Reconciliação por (nome completo + data nascimento + UF) → `grau_confianca:'alta'`; só nome → `'media'`.
- **Disponibilidade:** auto. **Risco:** exposição de CPF/título (dado pessoal, LGPD art. 7º; TSE publica, mas replicar em massa é risco). **Mitigação:** armazenar hash SHA-256 + salt, exibir `***.456.789-**`.

### 1.2 Mandatos e linha do tempo / filiações
- **O que mostra:** timeline unificada: mandatos (federais, estaduais, municipais, executivo), filiações partidárias com datas, licenças, suplências, cargos de mesa/liderança, candidaturas (eleito/não eleito), eventos judiciais/éticos relevantes.
- **Fontes:** Câmara `/deputados/{id}/historico` (mudanças de partido/situação com `dataHora`), `/mandatosExternos`, `/ocupacoes`, `/profissoes`; Senado `/senador/{c}/mandatos.json`, `/filiacoes.json`, `/licencas.json`; TSE `eleicoesAnteriores[]` (no JSON do candidato — inclui 2026 "Concorrendo"), bulk `consulta_cand_{ano}.zip` (cdn.tse.jus.br, 200); Portal Transparência `/servidores?nome=` (cargos comissionados/servidor público antes do mandato — chave).
- **Indicadores:** `n_partidos = count(distinct partido)`, `trocas_partido_por_mandato = n_trocas / n_mandatos`, `anos_vida_publica`, `tempo_medio_filiacao`. Flag informativa (não pejorativa): "trocou de partido fora de janela" só se data cair fora das janelas legais (LC 64/90 e EC 91/2016) — marcar `hipotese`.
- **Disponibilidade:** auto (+ bulk TSE). **Risco:** baixo (fatos públicos). **Mitigação:** rótulo neutro.

### 1.3 Produtividade legislativa
- **O que mostra:** proposições de autoria (por tipo), relatorias, proposições transformadas em norma, requerimentos, emendas a projetos, tempo médio de tramitação.
- **Fontes:** Câmara `/proposicoes?idDeputadoAutor=&ano=&siglaTipo=` (200) + `/proposicoes/{id}` (`statusProposicao`, `uriUltimoRelator`) + `/tramitacoes`; bulk `arquivos/proposicoesAutores/json/proposicoesAutores-{ano}.json` (200) e `proposicoes-{ano}.csv` (200, ~17 MB) — bulk é a forma correta para calcular coautoria e "transformada em norma" (campo `ultimoStatus.descricaoSituacao` contém "Transformado na Lei/Norma Jurídica"). Senado `/senador/{c}/autorias.json`, `/relatorias.json` (200; deprecados em favor de `/dadosabertos/processo?...`, mas ainda respondem).
- **Fórmulas:**
  - `IPL (índice de produção legislativa) = 0.35*z(PL+PLP+PEC autor principal) + 0.25*z(relatorias concluídas) + 0.30*z(normas aprovadas ponderadas por tipo: PEC 3, PLP 2, PL 1, PDL 0.5, REQ 0) + 0.10*z(emendas a proposições)`, z = z-score dentro da casa e da legislatura. Publicar pesos e permitir o usuário alterar.
  - Excluir requerimentos de moção/homenagem do numerador (metadado `siglaTipo in ('REQ','RIC')` e ementa com "voto de louvor|pesar|congratulações").
- **Disponibilidade:** auto/bulk. **Risco:** baixo; risco de interpretação (líder/presidente da Casa produz menos por função). **Mitigação:** normalizar por "dias em exercício sem cargo de mesa" e mostrar nota.

### 1.4 Votações
- **O que mostra:** votos nominais com contexto (ementa, resultado, orientação do partido/governo), coerência com partido, alinhamento com governo, ausências em votações, "votações-chave" curadas.
- **Fontes:** Câmara `/votacoes?dataInicio&dataFim&idOrgao=180` (plenário) → `/votacoes/{id}/votos` (200; ex.: `2306513-113`, `tipoVoto`, `deputado_.id`) e `/votacoes/{id}/orientacoes` (200; `siglaPartidoBloco`, `orientacaoVoto`, `codTipoLideranca` P/B para partido/bloco/Governo/Maioria/Minoria); bulk `votacoesVotos-{ano}.csv` (200) e `votacoesOrientacoes-{ano}.csv` (200, ~1 MB). Senado: `/dadosabertos/votacao?codigoParlamentar=&ano=` (200; substituto oficial de `/senador/{c}/votacoes.json`, que está deprecado desde 2025-03-18 mas ainda responde).
- **Fórmulas:**
  - `coerencia_partido = votos_iguais_orientacao_partido / votos_em_que_partido_orientou` (excluir "liberado"/orientação vazia).
  - `alinhamento_governo = votos_iguais_orientacao_'Governo' / votos_com_orientacao_Governo`.
  - `taxa_ausencia_votacao = (votacoes_nominais - votos_registrados) / votacoes_nominais` (só sessões em que o parlamentar estava em exercício e não licenciado; usar `/historico` e `licencas`).
  - "Votações-chave": lista mantida em `data/votacoes-chave.json` (comunidade; critério: PEC/PL com >400 votantes ou tema em `temas.json` — teto de gastos, marco temporal, PL fake news, reforma tributária, anistia, etc.), cada uma com `id_votacao`, `pergunta_cidada` ("votou a favor de X?") e link.
- **Disponibilidade:** auto/bulk (comunidade para a curadoria de chaves). **Risco:** enquadramento tendencioso da pergunta. **Mitigação:** a pergunta usa a ementa oficial e mostra sempre o texto integral; votos "Sim/Não/Abstenção/Obstrução/Ausente" sem adjetivos.

### 1.5 Presença
- **O que mostra:** presença em sessões deliberativas do plenário, presença em reuniões de comissão, missões oficiais, ausências justificadas x não justificadas.
- **Fontes:** Câmara `/deputados/{id}/eventos?dataInicio&dataFim` (200; eventos em que constou presente) + bulk `eventosPresencaDeputados-{ano}.csv` (200, ~90 MB — fonte principal); página HTML `camara.leg.br/deputados/{id}/presenca-plenario/{ano}` e `/presenca-comissoes/{ano}` (200; scraping leve para justificativas). Senado: sem endpoint direto de presença em plenário no dadosabertos; derivar de `/votacao` (votou = presente) + `/senador/{c}/licencas.json` + `/comissoes.json` (composição, não frequência).
- **Fórmulas:** `presenca_plenario = sessoes_com_presenca / sessoes_deliberativas_do_periodo_em_exercicio`; `presenca_comissoes = reunioes_presente / reunioes_das_comissoes_de_que_e_titular`; missões oficiais contam como presença justificada e aparecem como badge separado (`n_missoes`, países).
- **Disponibilidade:** bulk/auto (Câmara), derivado (Senado). **Risco:** baixo. **Mitigação:** explicitar denominador; nunca contar licenças médicas como falta.

### 1.6 Gastos (CEAP / CEAPS / verba de gabinete / passagens)
- **O que mostra:** total anual, por categoria, por fornecedor (top 10), evolução mensal, benchmark contra a bancada da UF e a mediana da Casa, alertas objetivos.
- **Fontes:**
  - Câmara CEAP: `/deputados/{id}/despesas?ano=&mes=` (200, mas **em 18/08/2026 devolveu `dados:[]` para todos os ids testados** — tratar como instável; fallback obrigatório) e bulk oficial `https://www.camara.leg.br/cotas/Ano-{ano}.csv.zip` (200; campos `txNomeParlamentar, cpf, ideCadastro, txtCNPJCPF, txtFornecedor, vlrLiquido, txtDescricao, numMes, urlDocumento`).
  - Senado CEAPS: `https://adm.senado.gov.br/adm-dadosabertos/api/v1/senadores/despesas_ceaps/{ano}` (200, JSON; filtrar por `codSenador`), `/api/v1/senadores/{codigoParlamentar}/recursos-utilizados` (200; totais por rubrica do ano corrente), CSV `https://www.senado.leg.br/transparencia/LAI/verba/despesa_ceaps_{ano}.csv` (200; latin1, `;`, `CNPJ_CPF, FORNECEDOR, VALOR_REEMBOLSADO, COD_DOCUMENTO`). Swagger em `adm.senado.gov.br/adm-dadosabertos/swagger-ui/index.html` (200).
  - Verba de gabinete/salários de servidores: Câmara `camara.leg.br/deputados/{id}/pessoal-gabinete?ano=` (HTML, 200); Senado `/api/v1/servidores/lotacoes` + `/servidores/remuneracoes/{ano}/{mes}` (200).
- **Fórmulas:**
  - `gasto_pct_bancada = gasto_anual / mediana(gasto_anual da bancada UF)`; `percentil_casa`.
  - Alertas objetivos (regras públicas, ex.: `red-flags-br.json`): fornecedor concentrado (>40% do total anual em 1 CNPJ), fornecedor com CNPJ baixado/inapto na Receita, fornecedor sancionado (CEIS/CNEP), notas com valor redondo repetido, combustível > limite mensal plausível (litros = valor / preço médio ANP > 2 tanques/dia), reembolso em fornecedor cujo QSA tem sobrenome do parlamentar (→ hipótese, ver 1.7/1.8).
- **Disponibilidade:** bulk (Câmara) / auto (Senado). **Risco:** acusação de irregularidade quando o gasto é lícito. **Mitigação:** rotular como "sinal de atenção — gasto dentro das regras da cota salvo decisão do órgão"; link para o recibo (`urlDocumento`).

### 1.7 Equipe de gabinete e HIPÓTESE de nepotismo por sobrenome
- **O que mostra:** lista de secretários parlamentares/comissionados (nome, cargo, nível, período) e, separado, uma seção "Coincidências de sobrenome (hipótese a verificar)".
- **Fontes:** Câmara HTML `/deputados/{id}/pessoal-gabinete?ano=` (200; tabela nome/cargo/nível/período — sem remuneração individual na mesma página); Senado `adm.senado.gov.br/adm-dadosabertos/api/v1/servidores/lotacoes` (200; `nome, vinculo, situacao, lotacao.nome = 'Gabinete/Escritório de Apoio do Senador X'`) e `/servidores/servidores/comissionados` (200); Portal Transparência `/servidores?nome=` (chave) para cruzar servidores federais.
- **Regra da hipótese (Súmula Vinculante 13/STF):** só sinaliza se `sobrenome_raro(servidor) ∩ sobrenomes(politico)` onde `sobrenome_raro` = frequência do sobrenome no bulk de candidatos TSE < percentil 5 nacional (exclui Silva, Santos, Oliveira, Souza, Lima, Pereira, Costa…). Score: `0.5 se 1 sobrenome raro compartilhado, 0.8 se 2 sobrenomes compartilhados na ordem, +0.1 se mesma UF de nascimento (TSE)`. Sempre `grau_confianca:'hipotese'`, texto fixo: "Coincidência de sobrenome não prova parentesco. A SV 13 veda nomear cônjuge, companheiro ou parente até 3º grau para cargo em comissão. Verificação humana pendente." Nunca aparece no ranking (só entra no ranking após `verificado_por` preenchido com evidência: certidão, notícia com fonte, decisão judicial).
- **Disponibilidade:** auto (Senado) / scraping leve (Câmara) / comunidade (verificação). **Risco:** ALTO — dano à honra de terceiro (servidor), LGPD. **Mitigação:** hipótese nunca indexável (noindex), nome do servidor exibido só com clique "mostrar", exclusão do vínculo mediante contestação simples, log de quem verificou.

### 1.8 Parentes com cargos públicos e licitações (cruzamentos possíveis)
- **Bases que permitem cruzar (e o que cada uma dá):**
  - Portal da Transparência `/servidores?nome=` (chave; retorna servidor federal por nome, órgão, cargo, situação) e `/servidores/{id}/remuneracao`; bulk `download-de-dados/servidores/{AAAAMM}_Servidores_SIAPE` (302 → zip).
  - QSA da Receita por CNPJ: BrasilAPI `/api/cnpj/v1/{cnpj}` (200; `qsa[].nome_socio`, `cnpj_cpf_do_socio` mascarado `***656231**`, `data_entrada_sociedade`), minhareceita.org (200); bulk CNPJ da Receita (bulk mensal, gigabytes).
  - PNCP por fornecedor: `pncp.gov.br/api/consulta/v1/contratos?dataInicial&dataFinal&cnpjOrgao` (200; `niFornecedor`, `nomeRazaoSocialFornecedor`, `valorGlobal`); busca livre `pncp.gov.br/api/search/?q=&tipos_documento=contrato&status=todos` (200); não há filtro direto por CNPJ de fornecedor no v1 → indexar bulk por `niFornecedor`.
  - TSE doadores/fornecedores de campanha: `divulga/rest/v1/prestador/...` (catalogado em `apis-eleitoral.json`) e bulk `prestacao_de_contas_eleitorais_candidatos_{ano}.zip` (200; 470 MB).
  - Sanções: CEIS/CNEP (Portal Transparência `/ceis`, `/cnep`, chave; bulk `download-de-dados/ceis` 200), TCU inabilitados/inidôneos (`contas.tcu.gov.br/ords/condenacao/consulta/inabilitados|inidoneos`, 200, JSON com `nome, cpf/cnpj, processo, deliberacao, data_final, uf`).
- **Por que só dá para fazer por sobrenome + UF com verificação humana:** nenhuma base pública brasileira expõe grafo de parentesco; o CPF vem mascarado no QSA e ausente nos servidores; nome completo é ambíguo (homônimos); Receita não abre CPF de sócio; TSE não liga candidato a familiares. Logo o máximo automatizável é: `candidatos_ligacao = pessoas com sobrenome raro compartilhado E mesma UF (servidor.uf_lotacao | socio.uf_empresa | doador.uf)`, gerando fila de verificação (`Vinculo.grau_confianca:'hipotese'`). Confirmar exige humano (certidão, declaração do próprio, decisão judicial, reportagem com fonte nominal). Nunca publicar sem `verificado_por`.
- **Disponibilidade:** chave/bulk/comunidade. **Risco:** ALTO (calúnia/difamação, LGPD sobre terceiros). **Mitigação:** igual à 1.7; além disso limitar a busca de servidores/QSA a fornecedores já ligados ao político (CEAP/CEAPS/emendas/doações), não varredura geral.

### 1.9 Emendas parlamentares (destino, fornecedor)
- **O que mostra:** valor por ano/tipo (individual RP6, bancada RP7, comissão RP8, "Pix" transferência especial), municípios beneficiados, órgão/função, execução (empenhado/pago), fornecedores finais quando rastreáveis, concentração geográfica.
- **Fontes:** Portal Transparência `/emendas?ano=&nomeAutor=&codigoEmenda=` (chave; 401 sem chave — confirmado) + `/emendas/documentos/{codigo}` (empenhos → favorecidos); bulk `download-de-dados/emendas-parlamentares/UNICO` (302 → zip). Cruzar favorecido (CNPJ) com PNCP + CEIS + QSA.
- **Fórmulas:** `concentracao_municipal = HHI(valor por município)`; `pct_reduto = valor no município onde teve mais votos / total` (votos por município: bulk TSE `votacao_candidato_munzona_{ano}.zip`); `taxa_execucao = pago / empenhado`; alerta "fornecedor de emenda também é doador de campanha" (cruza CNPJ com TSE receitas → `Vinculo{tipo:'doador_fornecedor', grau:'alta'}` porque é match exato de CNPJ, não de nome).
- **Disponibilidade:** chave/bulk. **Risco:** médio (emenda é legal; risco de insinuação). **Mitigação:** só match exato por CNPJ vira "fato"; texto neutro.

### 1.10 Patrimônio (bens TSE por eleição)
- **O que mostra:** total declarado em cada eleição, variação % entre eleições, composição (imóveis, veículos, aplicações, participações societárias), lista de bens com descrição literal.
- **Fontes:** TSE `candidatura/buscar/.../candidato/{id}` (200; `bens[]{descricao, descricaoDeTipoDeBem, valor}`, `totalDeBens`, `st_DIVULGA_BENS`), bulk `cdn.tse.jus.br/estatistica/sead/odsele/bem_candidato/bem_candidato_{ano}.zip` (200) para série histórica desde 2006.
- **Fórmulas:** `variacao_real = (total_t / total_t-4) deflacionado pelo IPCA (série BCB/SGS 433)`; benchmark contra a mediana da variação de candidatos ao mesmo cargo. Alerta objetivo apenas se `variacao_real > p95` da distribuição — rótulo "acima do usual, pode ter explicação (herança, venda, valorização)".
- **Disponibilidade:** auto/bulk. **Risco:** baixo-médio (dado autodeclarado e público). **Mitigação:** aviso de que valores são "de aquisição" (não de mercado), padrão do TSE.

### 1.11 Financiamento de campanha
- **O que mostra:** receitas por origem (fundo partidário, FEFC, PF, recursos próprios, outros candidatos/partido), top doadores PF, despesas por fornecedor, "doador que também é fornecedor" (mesmo CPF/CNPJ), dívidas e sobras.
- **Fontes:** TSE `prestador/consulta/...`, `receitas/{idEleicao}/{idPrestador}/{idUltimaEntrega}/lista`, `despesas/...`, `doador-fornecedor/consulta/{idEleicao}` (POST) e ranks (`prestador/ranks/doadores|fornecedores|concentracao`) — todos catalogados em `apis-eleitoral.json`; bulk `prestacao_de_contas_eleitorais_candidatos_{ano}.zip` (200) para consultas em massa e cruzamentos.
- **Fórmulas:** `dependencia_fundo = (FEFC + fundo partidário) / receita_total`; `HHI_doadores`; `doador_fornecedor = ∃ cpfCnpj ∈ receitas ∩ despesas` (fato, match exato); `doador_servidor_publico = nome+UF do doador PF ∈ servidores federais` (hipótese); `doador_socio_de_fornecedor_publico = QSA(fornecedor PNCP no estado) ∩ doadores` (hipótese por nome; fato se CPF mascarado bater 6 dígitos + nome completo → `grau:'media'`).
- **Disponibilidade:** auto/bulk (+chave p/ Portal Transparência). **Risco:** médio. **Mitigação:** distinguir claramente fato (CNPJ) de hipótese (nome).

### 1.12 Processos e sanções
- **O que mostra:** processos judiciais em que é parte (por tribunal, classe, assunto, status), inelegibilidade/cassação, sanções administrativas.
- **Fontes:**
  - DataJud (CNJ) `POST https://api-publica.datajud.cnj.jus.br/api_publica_{tribunal}/_search` — exige header `Authorization: APIKey <chave pública documentada pelo CNJ>` (testado 200 em `api_publica_trf1` e `api_publica_tse`; `api_publica_stf` não existe como índice). Busca por nome de parte NÃO é suportada oficialmente (índice expõe `numeroProcesso, classe, assuntos, movimentos, orgaoJulgador`, sem partes na maioria dos tribunais) → uso real: enriquecer números de processo já conhecidos (TSE `numeroProcesso`, `processosCassacao[]`, `numeroProcessoPrestContas`; notícias; STF/STJ). Chave: chave.
  - TSE: campos `processosCassacao`, `processosDesconstituicao`, `st_MOTIVO_FICHA_LIMPA/ABUSO_PODER/COMPRA_VOTO/CONDUTA_VEDADA/GASTO_ILICITO`, `descricaoSituacao` (ex.: "Deferido com recurso") — no JSON do candidato (200). Consulta processual unificada PJe TSE (HTML, 200, comunidade).
  - CNJ CNCIAI (Cadastro Nacional de Condenações por Improbidade e Inelegibilidade): `www.cnj.jus.br/improbidade_adm/consultar_requerido.php` (200, HTML/form; sem API — scraping por nome com verificação humana).
  - TCU: `contas.tcu.gov.br/ords/condenacao/consulta/inabilitados` e `/inidoneos` (200, JSON aberto), Certidões APF (`certidoes-apf.apps.tcu.gov.br`, 200, HTML).
  - CEIS/CNEP/CEPIM: Portal Transparência (chave) + bulk CSV (200).
- **Fórmulas:** não há score de "criminalidade"; exibir contagem por natureza (eleitoral, improbidade, penal, cível) e status (em andamento/transitado). Só condenação transitada em julgado ou colegiado (Ficha Limpa, LC 135/2010) entra no ranking como fato; processo em andamento é informativo (presunção de inocência, CF art. 5º LVII).
- **Disponibilidade:** chave/auto/comunidade. **Risco:** ALTO (homônimos, dados sensíveis judiciais). **Mitigação:** só vincular processo à pessoa por número de processo obtido de fonte que já o liga ao político (TSE, decisão publicada); homônimo em CNCIAI exige `verificado_por`.

### 1.13 Ética (Conselho de Ética / cassações)
- **O que mostra:** representações no Conselho de Ética, resultado (arquivada, censura, suspensão, cassação), perda de mandato por outras razões.
- **Fontes:** Câmara: proposições `siglaTipo=REP` (representação) via `/proposicoes?siglaTipo=REP&ano=` + tramitações no órgão "CEDECO"/Conselho de Ética (`/orgaos` para descobrir id, `/orgaos/{id}/votacoes`); Senado: matérias com `siglaSubtipoMateria` de representação (dadosabertos `/processo` novo). Não há endpoint dedicado; páginas HTML testadas retornaram 404/302 → tratar como comunidade + `EventoTimeline` curado com link do Diário.
- **Fórmula:** contagem e status; cassação/censura confirmada = fato com peso máximo em "integridade".
- **Disponibilidade:** auto (parcial)/comunidade. **Risco:** baixo (ato público). **Mitigação:** link para a decisão.

### 1.14 Discursos, redes e propaganda paga
- **O que mostra:** discursos em plenário (n, temas por palavra-chave), apartes; presença digital declarada; anúncios pagos em Meta (gasto, alcance, período, quem pagou).
- **Fontes:** Câmara `/deputados/{id}/discursos?dataInicio` (200; `transcricao`, `keywords`); Senado `/senador/{c}/discursos.json`, `/apartes.json` (200); Meta Ad Library API `GET graph.facebook.com/v21.0/ads_archive?search_terms=&ad_reached_countries=['BR']&fields=page_name,spend,impressions,bylines` (chave; sem token retornou 500 OAuthException — exige app + verificação de identidade do desenvolvedor); relatório agregado da Ad Library (CSV público, bulk). Google Ads Transparency: sem API pública (comunidade). TSE: `emails, sites` do candidato.
- **Fórmulas:** `gasto_ads_pre_campanha = spend em ads com bylines/page ligados ao político antes de 16/08/2026` (2026: propaganda paga na internet só é permitida como impulsionamento identificado — Lei 9.504/97 art. 57-C); alerta se `spend > 0` fora do período legal → "hipótese: verificar se é impulsionamento próprio ou de terceiro".
- **Disponibilidade:** auto (discursos) / chave (Meta). **Risco:** médio (atribuição de anúncio de terceiro ao político). **Mitigação:** só páginas com nome/número do candidato ou `bylines` = CNPJ da campanha (`cnpjcampanha` do TSE).

### 1.15 Promessas x entregas
- **O que mostra:** compromissos do plano de governo/propostas registradas no TSE (PDF `arquivos[]` do candidato) e discursos, ligados a proposições/emendas/votos posteriores.
- **Fontes:** TSE `arquivos[]` (proposta de governo — obrigatória para Executivo, opcional para Legislativo); discursos; comunidade extrai promessas para `data/promessas/{politico}.json` com `trecho, fonte, tema`. Matching semântico com proposições/emendas → sempre `hipotese` até revisão humana.
- **Fórmula:** `taxa_entrega = promessas com ≥1 ação verificada / promessas`; exibida só com ≥5 promessas catalogadas.
- **Disponibilidade:** comunidade. **Risco:** médio (subjetivo). **Mitigação:** critérios de "ação" públicos, revisão por 2 pessoas.

### 1.16 Notícias e checagens
- **O que mostra:** feed de notícias por nome (com fonte), checagens de fatos sobre declarações do político.
- **Fontes:** Google News RSS `news.google.com/rss/search?q="Nome"&hl=pt-BR&gl=BR&ceid=BR:pt-419` (200; termos: uso pessoal/não comercial no copyright do feed → só linkar título+veículo, não armazenar corpo); GDELT DOC 2.0 `api.gdeltproject.org/api/v2/doc/doc?query="Nome" sourcecountry:BR&mode=artlist&format=json` (429 no teste — rate limit agressivo; usar cache 15 min); Google Fact Check Tools `factchecktools.googleapis.com/v1alpha1/claims:search?query=&languageCode=pt` (403 sem chave — chave gratuita do Google Cloud; retorna `claimReview[]` de Lupa, Aos Fatos, Estadão Verifica); Querido Diário `api.queridodiario.ok.org.br/gazettes?querystring="Nome"` (200; menções em diários oficiais municipais — útil para "o que fez pelo meu município" e nomeações de parentes em prefeituras).
- **Fórmulas:** contagem por período; `n_checagens_falso` como fato (com link ClaimReview).
- **Disponibilidade:** auto/chave. **Risco:** direito autoral (RSS) e homônimos. **Mitigação:** título+link+veículo apenas; desambiguar por UF/cargo na query (`"Nome" deputado AL`).

### 1.17 Ranking objetivo com fórmula pública
- Índice composto **IMG (Índice Monitor de Gravata)**, 0–100, por casa/cargo, com pesos padrão editáveis pelo usuário (slider) e persistidos na URL:
  - Produtividade (IPL) 20 · Presença 15 · Coerência/transparência de voto (participação em votações nominais) 15 · Gastos (percentil invertido do gasto por bancada + ausência de fornecedores sancionados) 20 · Integridade (sanções e condenações confirmadas; processos em andamento NÃO pontuam) 20 · Transparência (declarou bens, publicou plano, gabinete sem hipótese aberta há >90 dias sem resposta = neutro) 10.
  - Cada subíndice = percentil dentro do grupo de comparação (mesma casa, mesma legislatura). Hipóteses não verificadas têm peso 0.
  - Publicar `ranking-metodologia.md` versionado; toda mudança de peso gera nova versão e o rank exibe a versão.

### 1.18 Grafo de ligações
- Nós: Politico, Partido, Empresa (CNPJ), Pessoa (doador/sócio/servidor — nome mascarado quando hipótese), Municipio, Orgao, Processo. Arestas = `Vinculo`.
- Tipos: `filiacao, doacao, fornecedor_ceap, fornecedor_campanha, emenda_favorecido, socio, servidor_gabinete, sobrenome_coincidente(hipotese), sancao, processo, coautoria, mesma_frente`.
- Fonte principal: cruzamento de CNPJ entre CEAP/CEAPS × TSE despesas/receitas × PNCP × CEIS × QSA. Arestas por nome nunca são desenhadas em cor forte (tracejado + rótulo "hipótese").

### 1.19 Comparar dois políticos
- Mesmas 6 famílias de métricas lado a lado, só entre mesmo cargo/casa; diferença mostrada em pontos percentuais e percentil; votações-chave em que divergiram.

### 1.20 "O que fez pelo meu município"
- Entradas: emendas com destino no município (Portal Transparência), proposições que citam o município (busca na ementa/keywords), discursos citando o município, menções em Querido Diário, votos do político naquele município na última eleição (bulk TSE `votacao_candidato_munzona`). Saída: `valor_emendas_municipio`, `pct_dos_votos_que_veio_daqui`, lista.

### 1.21 Perguntas geradas por dados
- Motor de templates: para cada indicador fora do intervalo (p90/p10) ou vínculo `hipotese` aberto, gerar pergunta neutra e citável, ex.: "Por que 43% da cota de 2025 foi paga a um único fornecedor (CNPJ X)?", "A senadora recebeu R$ Y do doador Z, que é sócio de fornecedor do Estado; há relação?". Perguntas trazem link "envie ao gabinete" (e-mail institucional) e registram resposta pública.

---

## 2. Modelo de dados canônico (TypeScript)

```ts
export type Fonte = {
  nome: string;            // 'camara' | 'senado' | 'tse' | 'portal-transparencia' | 'pncp' | 'tcu' | 'datajud' | 'receita' | 'meta-ads' | 'google-news' | 'querido-diario' | 'comunidade'
  url: string;             // URL exata da chamada ou do bulk
  coletado_em: string;     // ISO
  hash?: string;           // sha256 do payload bruto (auditoria)
  licenca?: string;
};
export type GrauConfianca = 'fato' | 'alta' | 'media' | 'hipotese';

export interface Politico {
  id: string;                          // 'br:<sha256(cpf+salt)>' ou 'camara:160541' / 'senado:5322'
  ids_externos: { camara?: number; senado?: number; tse?: { ano: number; idEleicao: string; idCandidato: string }[] };
  nome_civil: string; nome_urna?: string; cpf_mascarado?: string;
  data_nascimento?: string; uf: string; municipio_nascimento?: string;
  partido_atual: string; cargo_atual: 'deputado_federal'|'senador'|'deputado_estadual'|'vereador'|'prefeito'|'governador'|'presidente'|'candidato';
  situacao?: 'exercicio'|'licenca'|'suplente'|'fim_mandato'|'cassado';
  escolaridade?: string; ocupacao?: string; email?: string; foto_url?: string;
  redes?: { tipo: string; url: string; fonte: Fonte }[];
  atualizado_em: string; fontes: Fonte[];
}
export interface Mandato { id: string; politico_id: string; casa: 'camara'|'senado'|'assembleia'|'camara_municipal'|'executivo'; cargo: string; uf: string; municipio?: string; legislatura?: number; inicio: string; fim?: string; condicao: 'titular'|'suplente'|'efetivado'; partido_na_posse: string; fonte: Fonte; }
export interface Voto { id: string; politico_id: string; casa: 'camara'|'senado'; votacao_id: string; data: string; proposicao: string; ementa: string; voto: 'sim'|'nao'|'abstencao'|'obstrucao'|'ausente'|'art17'|'liberado'; orientacao_partido?: string; orientacao_governo?: string; votacao_chave?: { slug: string; pergunta: string }; fonte: Fonte; }
export interface Despesa { id: string; politico_id: string; tipo: 'ceap'|'ceaps'|'gabinete'|'passagem'|'missao'|'emenda_execucao'; ano: number; mes?: number; categoria: string; fornecedor_nome: string; fornecedor_doc: string; fornecedor_doc_tipo: 'cnpj'|'cpf_mascarado'; valor: number; documento_url?: string; alertas?: string[]; fonte: Fonte; }
export interface Bem { id: string; politico_id: string; eleicao_ano: number; tipo: string; descricao: string; valor: number; fonte: Fonte; }
export interface Doacao { id: string; politico_id: string; eleicao_ano: number; idEleicao: string; origem: 'fefc'|'fundo_partidario'|'pf'|'proprio'|'candidato'|'partido'|'outros'; doador_nome: string; doador_doc_mascarado?: string; doador_tipo: 'pf'|'pj'|'partido'|'candidato'; valor: number; data: string; doador_fornecedor?: boolean; fonte: Fonte; }
export interface Processo { id: string; politico_id: string; numero: string; tribunal: string; classe?: string; assuntos?: string[]; natureza: 'eleitoral'|'improbidade'|'penal'|'civel'|'administrativo'|'contas'; status: 'andamento'|'arquivado'|'condenacao_colegiada'|'transitado'|'absolvido'; papel: 'reu'|'investigado'|'autor'|'interessado'; ultima_movimentacao?: string; grau_confianca: GrauConfianca; fonte: Fonte; }
export interface Sancao { id: string; alvo_tipo: 'politico'|'empresa'|'pessoa'; alvo_id: string; base: 'ceis'|'cnep'|'cepim'|'tcu_inabilitados'|'tcu_inidoneos'|'cnciai'|'tse_inelegibilidade'|'conselho_etica'; descricao: string; orgao: string; inicio?: string; fim?: string; processo?: string; fonte: Fonte; }
export interface Noticia { id: string; politico_id: string; titulo: string; veiculo: string; url: string; publicado_em: string; tipo: 'noticia'|'checagem'|'diario_oficial'; veredito_checagem?: string; fonte: Fonte; }
export interface EventoTimeline { id: string; politico_id: string; data: string; tipo: 'mandato'|'filiacao'|'licenca'|'candidatura'|'cargo_mesa'|'sancao'|'processo'|'etica'|'correcao'|'promessa'|'outro'; titulo: string; descricao?: string; ref_id?: string; grau_confianca: GrauConfianca; fonte: Fonte; }
export interface Vinculo {
  id: string;
  origem: { tipo: 'politico'|'empresa'|'pessoa'|'partido'|'orgao'|'municipio'|'processo'; id: string };
  destino: { tipo: 'politico'|'empresa'|'pessoa'|'partido'|'orgao'|'municipio'|'processo'; id: string };
  tipo: 'filiacao'|'doacao'|'fornecedor_ceap'|'fornecedor_campanha'|'emenda_favorecido'|'socio'|'servidor_gabinete'|'sobrenome_coincidente'|'parentesco'|'sancao'|'processo'|'coautoria'|'mesma_frente'|'doador_fornecedor';
  grau_confianca: GrauConfianca;      // 'fato' só com match exato de CNPJ/número; nome/sobrenome => 'hipotese'
  metodo: 'cnpj_exato'|'cpf_mascarado+nome'|'nome_completo+uf'|'sobrenome_raro+uf'|'numero_processo'|'declarado_fonte_oficial'|'manual';
  score?: number;                      // 0..1
  fonte: Fonte;
  verificado_por?: { usuario: string; em: string; evidencia_url: string; decisao: 'confirmado'|'refutado' } | null;
  visivel_publico: boolean;            // false para hipóteses sobre terceiros até verificação
  contestacoes?: { em: string; texto: string; status: 'aberta'|'aceita'|'rejeitada' }[];
}
export interface Indicador { politico_id: string; slug: string; valor: number; percentil_grupo?: number; grupo: string; formula_versao: string; calculado_em: string; insumos: Fonte[]; }
```

---

## 3. Priorização

**v1 (até 15/09/2026 — antes do 1º turno):** Identidade + timeline (Câmara/Senado/TSE) · Votações nominais + coerência partido/governo + 20 votações-chave curadas · Presença (bulk Câmara; derivada Senado) · Gastos CEAP (bulk zip)/CEAPS (adm.senado) com benchmark bancada e top fornecedores · Patrimônio TSE 2018/2022/2026 · Financiamento 2022/2026 (receitas, top doadores, doador-fornecedor por CNPJ) · Sanções abertas (TCU JSON, CEIS bulk) · Notícias (Google News RSS) · Ranking IMG v1 com página de metodologia · Comparar dois · Perguntas geradas (templates de gasto e voto).

**v2 (pós-eleição, out–dez/2026):** Produtividade completa (bulk proposições + normas) · Emendas (Portal Transparência com chave) + "o que fez pelo meu município" + Querido Diário · Equipe de gabinete (Senado API; Câmara scraping) + hipótese de sobrenome com fila de verificação · Grafo de ligações (CNPJ) · Fact-check (Google API) · Meta Ad Library (após app aprovado) · Processos: TSE + DataJud por número.

**v3 (2027):** Parentes/QSA/PNCP cruzamento assistido por comunidade · Promessas x entregas · Ética (curadoria) · Estaduais/municipais (ALESP, câmaras, TCEs) · Contestação/direito de resposta com fluxo formal · Histórico versionado de rankings.

---

## 4. Riscos jurídicos transversais e mitigação (resumo)

| Risco | Base | Mitigação |
|---|---|---|
| Difamação/calúnia (art. 138–140 CP; responsabilidade civil) | Publicar hipótese como fato | Rótulos `hipotese`, texto padrão, sem adjetivos, fonte linkada, contestação em 1 clique, remoção rápida de terceiros |
| LGPD (Lei 13.709) — dados de terceiros (servidores, doadores PF, sócios) | Tratamento sem base legal clara | Base: interesse público/dados manifestamente públicos (art. 7º §3º, art. 11 §1º); minimização (mascarar CPF, noindex em hipóteses), relatório de impacto simplificado no repo |
| Direito eleitoral (Lei 9.504 art. 57; Res. TSE 23.610) — conteúdo pode ser lido como propaganda negativa | Rankings próximos à eleição | Fórmula pública, aplicação simétrica a todos, sem "vote/não vote", sem doações; nota de neutralidade |
| Direito autoral (RSS Google, notícias) | Reproduzir corpo | Só título/link/veículo |
| Termos de uso de APIs (Meta, Google) | Uso fora do permitido | Guardar só agregados; respeitar rate limit; chaves em servidor |
| Presunção de inocência | Processo em andamento pontuando | Processos não pontuam; só condenação colegiada/transitada |

## 5. Observações de teste (18/08/2026)
- Câmara `/deputados/{id}/despesas` respondeu 200 com `dados: []` para vários ids (inclusive deputados em exercício) — usar bulk `camara.leg.br/cotas/Ano-{ano}.csv.zip` como fonte primária e API só como incremental.
- Senado: serviços `senador/{c}/votacoes|relatorias|autorias.json` marcados como deprecados (desativação prevista 2026-02-01) mas ainda respondem; migrar para `/dadosabertos/votacao` (testado 200) e `/dadosabertos/processo`.
- `adm.senado.gov.br/adm-dadosabertos` é a API administrativa do Senado (CEAPS, lotações, remunerações, contratos) — não documentada no portal principal, mas com Swagger aberto e JSON limpo.
- DataJud exige APIKey pública do CNJ; índices por tribunal (`api_publica_trf1`, `api_publica_tse` OK; `api_publica_stf` inexistente).
- Portal da Transparência: 401 sem chave (cadastro gratuito, header `chave-api-dados`).
- Meta Ad Library: 500 sem token; Google Fact Check: 403 sem chave; GDELT: 429 (limitar a 1 req/5s com cache).
