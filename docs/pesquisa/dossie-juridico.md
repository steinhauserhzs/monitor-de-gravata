# Dossiê Jurídico — Monitor de Gravata

> Pesquisa de referência para um super app comunitário, open source, que exibe ficha 360 de políticos/candidatos, red flags de contratos públicos e casos comunitários. Não é parecer jurídico. Data da pesquisa: 2026-08-18 (eleições gerais em 04/10/2026).
>
> **Como as URLs foram verificadas:** todas as URLs do planalto.gov.br e do portal do STF abaixo responderam HTTP 200 em 2026-08-18 (o planalto exige User-Agent de navegador; curl "cru" dá timeout). As páginas do tse.jus.br respondem **403 para acesso automatizado (Akamai)** mesmo com User-Agent de navegador; os links do TSE foram confirmados por indexação de busca e devem ser abertos em navegador. Está sinalizado item a item.

---

## A) O que protege o projeto

| Base legal | O que dá ao projeto | URL (verificada) |
|---|---|---|
| **CF/88, art. 5º, IV, IX, XIV, XXXIII; art. 37, caput e §3º; art. 220** | Liberdade de expressão e de informação, publicidade da administração, direito de acesso à informação, vedação de censura. É o alicerce de qualquer ficha pública sobre agente público. | https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm |
| **Lei 12.527/2011 (LAI)** | Publicidade como regra, sigilo como exceção (art. 3º); transparência ativa obrigatória (art. 8º: contratos, licitações, despesas, repasses); dados em formato aberto e legível por máquina (art. 8º, §3º). O app **reutiliza** dados que o Estado é obrigado a publicar. | https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm |
| **Decreto 8.777/2016 (Política de Dados Abertos do Executivo Federal)** | Define "dado aberto", obriga planos de dados abertos, autoriza reuso livre. Fundamenta o uso de bases do Portal da Transparência, Compras.gov, TSE etc. | https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/decreto/d8777.htm |
| **Lei 14.129/2021 (Governo Digital)** | Reforça dados abertos como política de Estado (arts. 24-29: interoperabilidade, laboratórios de inovação, dados abertos como padrão, art. 29 sobre acesso a dados por interessados). | https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14129.htm |
| **Lei 14.133/2021 (Nova Lei de Licitações)** | Cria o **PNCP** e obriga a divulgação centralizada de editais, contratos, atas, sanções (arts. 174-175). É a fonte primária para "red flags de contratos". Também define impedimentos e sanções (arts. 14, 155-163) — vocabulário oficial para status de empresas. | https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm |
| **Lei 12.846/2013 (Anticorrupção / Empresa Limpa)** | Responsabilidade objetiva de pessoas jurídicas por atos contra a administração; cria o **CNEP** (art. 22) e o **CEIS** é público — bases oficiais para "empresa sancionada". Acordos de leniência (art. 16). | https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12846.htm |
| **Lei 8.429/1992 (Improbidade) c/ Lei 14.230/2021** | Tipos de improbidade (arts. 9º, 10, 11) e o **CNCIAI/CNIA** (Cadastro Nacional de Condenações por Improbidade, CNJ) como fonte pública. **Atenção:** a 14.230 exigiu **dolo** e mudou prazos/legitimidade — condenações antigas podem ter sido revistas. Sempre mostrar data e situação. | https://www.planalto.gov.br/ccivil_03/leis/l8429.htm · https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14230.htm |
| **LC 64/1990 c/ LC 135/2010 (Ficha Limpa)** | Inelegibilidades (art. 1º, I) — só se aplicam a condenação por **órgão colegiado** ou trânsito em julgado; lista taxativa de crimes. Fundamenta um selo "situação de elegibilidade" desde que refletindo **exatamente** a decisão da Justiça Eleitoral (DivulgaCand). | https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp64.htm · https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp135.htm |
| **Lei 13.608/2018 (Denunciante / Fala.BR)** | Sigilo do denunciante e proteção contra retaliação (arts. 4º-A a 4º-C, incluídos pela Lei 13.964/2019). Base para o canal de denúncia do app **encaminhar** ao Fala.BR/ouvidorias em vez de tentar substituí-los. | https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13608.htm · https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm |
| **Lei 12.965/2014 (Marco Civil), art. 19 c/ tese STF 26/06/2025** | Provedor de aplicação (o app, se hospedar conteúdo de terceiros — "casos comunitários") tem regime de responsabilidade definido em lei + tese vinculante. Ver seção B.6. | https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm |
| **LGPD 13.709/2018, art. 7º, §3º e §4º; art. 4º, II, "a"** | Dados **tornados manifestamente públicos pelo titular** e dados de acesso público podem ser tratados respeitando a finalidade e a boa-fé; tratamento **jornalístico** é excluído do núcleo da lei (art. 4º, II, "a"). Dados de agentes públicos em exercício de função têm expectativa reduzida de privacidade. | https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm |
| **STF ARE 652.777 (Tema 483, RG)** | Tese: "É legítima a publicação, inclusive em sítio eletrônico mantido pela Administração Pública, dos nomes dos seus servidores e do valor dos correspondentes vencimentos e vantagens pecuniárias." Autoriza exibir remuneração/nome de agentes públicos. | https://portal.stf.jus.br/jurisprudenciaRepercussao/verAndamentoProcesso.asp?incidente=4121428&numeroProcesso=652777&classeProcesso=ARE&numeroTema=483 |
| **Lei 13.188/2015 (Direito de resposta)** | Não é só risco: é **ferramenta de credibilidade**. Prever espaço de resposta proporcional e destacado (art. 4º) para todo político citado, com fluxo próprio, reduz litígio. | https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13188.htm |
| **Lei 13.869/2019 (Abuso de autoridade), art. 30/33** | Protege contribuidores contra requisição indevida de dados por autoridade (art. 33) e contra investigação ilegal. | https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13869.htm |

**Regra de ouro:** o app não "acusa"; **relê e organiza registros públicos oficiais**, com link para a fonte primária em cada campo. Isso posiciona o projeto como reutilizador de dados abertos (LAI/8.777/14.129) e não como autor de imputação.

---

## B) Riscos e como mitigar

### B.1 Crimes contra a honra (CP arts. 138-140) e responsabilidade civil (CC 186/927)

- URL: https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm
- **Calúnia (138):** imputar falsamente **crime**. Escrever "X desviou dinheiro" sem condenação = risco. Escrever "X é réu em ação penal por peculato (TRF-1, processo nº…)" com link = fato. Há **exceção da verdade** (§3º), exceto contra o Presidente/chefe de Estado estrangeiro e nos casos de sentença absolutória.
- **Difamação (139):** imputar fato ofensivo. A exceção da verdade só cabe se o ofendido é **funcionário público e o fato se refere ao exercício da função** (art. 139, parágrafo único) — cobre a maioria dos alvos do app, mas **não** candidatos sem cargo nem parentes.
- **Injúria (140):** opinião ofensiva ("ladrão", "corrupto"). Sem exceção da verdade. **Proibido no app.**
- **Art. 141:** aumenta a pena se contra funcionário público em razão da função ou por meio que facilite a divulgação (internet). Ou seja: o app é agravante, não atenuante.
- **Art. 142, III:** não constitui injúria/difamação "o conceito desfavorável emitido por funcionário público em apreciação ou informação que preste no cumprimento de dever de ofício" — **não** protege colaborador voluntário. Não confiar nisso.

**Mitigação: separação fato × juízo em nível de dado**
- Todo registro tem `tipo: "fato_oficial" | "fato_documentado" | "contexto"`. Não existe tipo "opinião".
- Campos obrigatórios: `fonte_url` (primária), `orgao_emissor`, `data_documento`, `data_coleta`, `status_processual`.
- Verbos permitidos na UI: "consta", "registra", "foi condenado em X grau por", "responde a", "assinou contrato de", "recebeu doação de". Verbos proibidos: "desviou", "roubou", "fraudou", "é corrupto", "esquema", "máfia" — bloqueio por lint no CI (lista em `politica-editorial.md`).
- **Sem adjetivos, sem emoji, sem manchete.** Título de caso = "Contrato nº X, órgão Y, R$ Z, 2025 — 3 red flags automáticas".

### B.2 Presunção de inocência (CF art. 5º, LVII) e glossário de status processual

Exibir sempre o **status exato**, com data, e um badge neutro. Glossário mínimo (usar estes termos, nunca sinônimos):

| Status | Significado | O que a UI pode dizer |
|---|---|---|
| `investigado` | Inquérito/PIC/procedimento em curso, sem denúncia | "Consta inquérito nº… (fonte)". Nunca "acusado". |
| `denunciado` | MP ofereceu denúncia; juiz ainda não recebeu | "MP ofereceu denúncia por…" |
| `reu` | Denúncia recebida | "Réu em ação penal nº… por…" |
| `absolvido` | Sentença/acórdão absolutório | Exibir com o mesmo destaque da acusação. |
| `condenado_1_grau` | Sentença de 1º grau, recorrível | "Condenado em 1º grau (recurso pendente)". |
| `condenado_colegiado` | Acórdão de tribunal — relevante para LC 135 | "Condenado por órgão colegiado (Ficha Limpa: verificar DivulgaCand)". |
| `transitado_em_julgado` | Definitivo | "Condenação definitiva". |
| `arquivado` / `prescrito` / `extinta_punibilidade` | Sem julgamento de mérito | Exibir e não interpretar. |
| `improbidade_*` | Cível, não criminal | Deixar claro que **não é crime**; após Lei 14.230 exige dolo. |
| `TCU/TCE: contas irregulares` | Administrativo | "Contas julgadas irregulares (acórdão nº…)". Não é condenação criminal. |
| `sancionada` (empresa) | CEIS/CNEP/e-Sanções | Mostrar tipo, órgão sancionador, vigência. |

- **Regra de simetria:** absolvição, arquivamento, reforma da decisão e prescrição entram na ficha com **o mesmo peso visual** da acusação e são atualizados no mesmo ciclo. Ficha "só de acusações" é a evidência típica de má-fé em ação indenizatória.
- Nunca calcular "índice de corrupção", "nota" ou "ranking de sujeira" por pessoa. Índices só sobre **contratos/órgãos** e sempre com metodologia aberta.

### B.3 Homônimos e identidade

- Risco: atribuir processo/sanção a pessoa errada. É o erro mais fácil de cometer e o mais caro (dano moral objetivo, "erro grosseiro").
- Mitigação: chave primária de político = **CPF parcial + número sequencial de candidato TSE (SQ_CANDIDATO) + título de eleitor mascarado**, nunca só nome. Para empresa = **CNPJ completo**. Para processos judiciais, exigir número CNJ (`NNNNNNN-DD.AAAA.J.TR.OOOO`) e vínculo por CPF/CNPJ na fonte, ou marcar `vinculo: "nao_confirmado"` e **não exibir**.
- UI: nome completo + "candidato(a) a X pelo partido Y em ZZZZ (SQ …)" para desambiguar. Nunca exibir CPF completo (LGPD, minimização).

### B.4 LGPD (13.709/2018) — o que pode e o que não pode

- **Pode**: dados de agente público no exercício da função (nome, cargo, remuneração — Tema 483; contratos, emendas, doações eleitorais e bens declarados publicados pelo TSE), dados manifestamente públicos, com finalidade de interesse público e transparência (art. 7º, §3º/§4º; art. 23 para o poder público que os publicou).
- **Não pode / evitar**: CPF completo, endereço residencial, telefone, filhos menores, dados de saúde/orientação/religião (art. 5º, II — dados sensíveis), dados de **cidadãos privados** que aparecem incidentalmente em contratos (ex.: beneficiários de programas sociais). Reprocessar para minimizar (art. 6º, III).
- Colaboradores/usuários do app: **coletar o mínimo** (sem cadastro obrigatório para leitura; contribuições via GitHub, que já tem seus próprios termos), publicar política de privacidade curta, nomear encarregado (art. 41) mesmo sendo projeto comunitário. Autoridade: ANPD (https://www.gov.br/anpd/pt-br).
- Direito de eliminação (art. 18) **não** alcança dado público de agente público sobre a função; responder ao pedido explicando a base legal (art. 7º, §3º e §4º; LAI art. 3º) e o Tema 483, e mesmo assim rever exatidão.

### B.5 Período eleitoral (LC 64/90, Lei 9.504/97, Código Eleitoral, Res. TSE 23.610 e alterações 2024/2026)

- **Código Eleitoral art. 323** (https://www.planalto.gov.br/ccivil_03/leis/l4737compilado.htm): crime "divulgar, na propaganda eleitoral ou durante período de campanha, **fatos que sabe inverídicos** em relação a partidos ou candidatos e capazes de exercer influência perante o eleitorado". Elemento subjetivo: **saber** que é falso. Ficha baseada em documento oficial com link é a antítese do tipo. Mas: erro grosseiro + recusa a corrigir pode ser lido como dolo eventual. Daí o **takedown/correção em 72h com log público** (threat-model).
- **Lei 9.504/97** (https://www.planalto.gov.br/ccivil_03/leis/l9504.htm): art. 57-B/57-D (propaganda na internet, vedação de anonimato, impulsionamento só por candidatos/partidos), art. 58 (direito de resposta eleitoral, prazos curtos: 24h/48h/72h). Um app "neutro" não é propaganda, mas **qualquer conteúdo que peça voto ou "não vote em X" converte o app em propaganda irregular** — proibido na política editorial. Sem doação, sem impulsionamento pago do app durante a campanha citando candidatos.
- **LC 64/90 art. 22** (AIJE, abuso de poder econômico/uso indevido dos meios de comunicação): risco se o app for percebido como veículo de campanha de um lado. Mitigação: **mesma regra para todos** (ver política editorial), fontes primárias, ausência de editorial e de ranking pessoal.
- **Res. TSE 23.610/2019** (propaganda eleitoral; https://www.tse.jus.br/legislacao/compilada/res/2019/resolucao-no-23-610-de-18-de-dezembro-de-2019 — *TSE bloqueia acesso automatizado; abrir em navegador*), alterada pela **Res. TSE 23.732/2024** (https://www.tse.jus.br/legislacao/compilada/res/2024/resolucao-no-23-732-de-27-de-fevereiro-de-2024): art. 9º-B (desinformação: proibido usar conteúdo fabricado/manipulado para divulgar fatos notoriamente inverídicos ou gravemente descontextualizados), art. 9º-C (IA: rotulagem obrigatória de conteúdo sintético; **deepfake proibido**; chatbots que simulem candidato proibidos), art. 9º-D/9º-E (dever de cuidado das plataformas). Para 2026, a **Res. TSE 23.755/2026** (https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-755-de-2-de-marco-de-2026, mesma ressalva de acesso) atualizou a 23.610; segundo notícia do próprio TSE (https://www.tse.jus.br/comunicacao/noticias/2026/Abril/por-dentro-das-eleicoes-conheca-as-regras-sobre-uso-de-ia-na-campanha-eleitoral-de-2026, idem) fica **vedada a publicação, republicação e impulsionamento de conteúdo sintético novo com imagem/voz de candidatos ou figuras públicas nas 72h antes e 24h depois do fim da votação, mesmo rotulado**.
  - Implicação direta: **o app não gera imagem/voz/vídeo sintético de candidatos, nunca**. Se usar IA para resumir documentos, rotular ("resumo gerado por IA a partir de [documento]; verifique o original") e manter o original linkado. Sem "avatar" de político.
- **Data-corte:** 04/10/2026 (1º turno). Recomenda-se **congelar mudanças de schema e de regras de red flag de 15/09 a 30/10** (só correções factuais/takedown), para não parecer manobra de última hora.

### B.6 Responsabilidade por conteúdo de terceiros — art. 19 do Marco Civil após o STF (26/06/2025)

Fonte primária (notícia do próprio STF, HTTP 200 em 2026-08-18): https://noticias.stf.jus.br/postsnoticias/stf-define-parametros-para-responsabilizacao-de-plataformas-por-conteudos-de-terceiros/ · Tema 987 (RE 1.037.396, rel. Min. Dias Toffoli) e Tema 533 (RE 1.057.258, rel. Min. Luiz Fux); andamento: https://portal.stf.jus.br/jurisprudenciaRepercussao/verAndamentoProcesso.asp?incidente=5160549&numeroProcesso=1037396&classeProcesso=RE&numeroTema=987

Resumo da tese, conforme o STF noticiou:
1. O art. 19 do MCI é **parcialmente inconstitucional**: a exigência de ordem judicial específica para responsabilizar o provedor "já não é suficiente" para proteger direitos fundamentais e a democracia; a interpretação vale **até o Congresso legislar**.
2. **Crimes contra a honra** (calúnia/difamação/injúria): o provedor só responde civilmente se **descumprir ordem judicial** de remoção (regime do art. 19 mantido). Nada impede remoção por notificação extrajudicial.
3. **Conteúdo já reconhecido como ofensivo por decisão judicial e replicado**: todos os provedores devem remover publicações **idênticas** a partir de notificação (judicial ou extrajudicial), sem nova decisão.
4. **Crimes graves** (lista exemplificativa: golpe de Estado, abolição do Estado Democrático de Direito, terrorismo, instigação a suicídio/automutilação, racismo, homofobia, crimes contra mulheres e crianças): responsabilização por **falha sistêmica** se o provedor não adotar medidas adequadas de prevenção/remoção.
5. **Crimes em geral e atos ilícitos**: o provedor responde se, **após notificação (extrajudicial) de retirada, deixar de remover**. Vale também para **contas denunciadas como falsas**.
6. **Autorregulação obrigatória**: sistema de notificações, devido processo, relatórios anuais de transparência sobre notificações extrajudiciais, anúncios e impulsionamentos; canais permanentes, específicos, preferencialmente eletrônicos, acessíveis e divulgados.
7. Vencidos (mantinham art. 19 integral): Mins. André Mendonça, Nunes Marques e Edson Fachin.

**Implicações para o Monitor de Gravata:**
- Para a **ficha 360 gerada pelo próprio projeto** (dados oficiais curados), o projeto **é autor**, não intermediário — art. 19 não ajuda. Vale o B.1/B.2 (fato × juízo, fontes).
- Para **"casos comunitários"** (conteúdo enviado por terceiros): o projeto é provedor de aplicação. Para se beneficiar do regime mais protetivo (só ordem judicial em crime contra a honra) e não cair em "falha sistêmica": (a) canal de notificação **permanente e visível** (`/denunciar-conteudo` + e-mail + issue template); (b) **devido processo** documentado (acusar recebimento, prazo, decisão motivada, recurso); (c) **relatório de transparência** público (contagem de notificações, remoções, motivos) — pode ser um `TRANSPARENCY.md` atualizado por CI; (d) revisão humana obrigatória (2 aprovações) antes de publicar qualquer caso comunitário — na prática, o projeto **assume** o conteúdo ao publicar, então o padrão de prova é o mesmo da ficha oficial; (e) remover conteúdo idêntico a algo já declarado ilícito por decisão judicial mediante simples notificação.

### B.7 SLAPP (ações estratégicas para silenciar) e assédio judicial

- Cenário: político ou empresa citada move dezenas de ações de dano moral em comarcas diferentes contra pessoas físicas do projeto (típico: R$ 10-50 mil cada, valor não afirmado, apenas ordem de grandeza ilustrativa).
- Mitigações jurídicas: (1) **entidade jurídica** (associação sem fins lucrativos ou fiscal sponsor) titular do domínio, do repositório e do deploy, para que a legitimidade passiva não recaia em voluntários; (2) **anonimato opcional dos contribuidores** — commits via conta do projeto ou pseudônimo (GitHub permite), mas com **rastreabilidade interna** para não caracterizar anonimato vedado pela CF art. 5º, IV; (3) **transparência do processo editorial** (log de decisões, fontes) como prova de boa-fé objetiva; (4) reserva de defesa: mapear previamente advogados/entidades de liberdade de expressão e transparência dispostos a atuar pro bono; (5) **evitar hospedar em pessoa física** (Vercel/GitHub em conta de organização); (6) política clara de **direito de resposta** (Lei 13.188/2015) que atenda em 72h — muitos juízes ponderam a conduta pós-notificação; (7) o STJ tem jurisprudência consolidada sobre interesse público e figuras públicas (não citada aqui por número para não inventar; a equipe jurídica deve levantar precedentes atualizados antes do lançamento).
- Assédio judicial reconhecido: o CNJ e o STF já trataram do tema (ADI 6.792/ADI 7.055 sobre pulverização de ações contra jornalistas — **verificar** números e teor antes de citar publicamente; não confirmado nesta pesquisa).

### B.8 Outros riscos jurídicos rápidos

| Risco | Mitigação |
|---|---|
| Uso indevido de logo/brasão de partidos, TSE, órgãos | Não usar brasões oficiais no app; nomes em texto. |
| Scraping em portais que proíbem em ToS | Preferir APIs/dados abertos com licença explícita; registrar licença de cada fonte no catálogo (`fonte.licenca`). |
| Direito autoral em textos de terceiros (jornais) | Não copiar matérias; linkar e citar título/veículo/data. Nunca notícia como fonte primária de "fato". |
| Dado desatualizado tratado como atual | Exibir `data_coleta` e `data_documento` em toda ficha; job de revalidação; badge "verificado há N dias". |
| Falsa afirmação de "não há registros" | Dizer "não localizado nas bases X, Y em DD/MM/AAAA" — nunca "ficha limpa" como afirmação do app. |
| Uso partidário do app por terceiros | Licença CC-BY para dados exige atribuição; marca do projeto não pode ser usada para endossar candidatura (adicionar cláusula de marca no README). |

---

## Custo da corrupção — não afirmado

Este dossiê **não cita** número de "custo da corrupção no Brasil": as estimativas circulantes (FIESP, ONU, FMI) variam de metodologia e ano e não foram verificadas em fonte primária durante esta pesquisa. Referência institucional verificada (HTTP 200) que pode ser usada apenas como **link**, sem número: Índice de Percepção da Corrupção da Transparência Internacional Brasil — https://transparenciainternacional.org.br/ipc/ e https://www.transparencyinternational.org/cpi. Antes de citar qualquer valor no app, buscar o relatório-fonte e linkar.

---

## Índice de URLs verificadas (2026-08-18)

- CF/88: https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm — 200
- LAI 12.527/2011: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm — 200
- Dec. 8.777/2016: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/decreto/d8777.htm — 200
- Lei 14.129/2021: https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14129.htm — 200
- Lei 14.133/2021: https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm — 200
- Lei 12.846/2013: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12846.htm — 200
- Lei 8.429/1992: https://www.planalto.gov.br/ccivil_03/leis/l8429.htm — 200
- Lei 14.230/2021: https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14230.htm — 200
- LC 64/1990: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp64.htm — 200
- LC 135/2010: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp135.htm — 200
- Lei 13.608/2018: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13608.htm — 200
- Lei 13.964/2019: https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm — 200
- Marco Civil 12.965/2014: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm — 200
- LGPD 13.709/2018: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm — 200
- Código Penal: https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm — 200
- Lei 13.188/2015: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13188.htm — 200
- Lei 13.869/2019: https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13869.htm — 200
- Código Eleitoral 4.737/65: https://www.planalto.gov.br/ccivil_03/leis/l4737compilado.htm — 200
- Lei 9.504/97: https://www.planalto.gov.br/ccivil_03/leis/l9504.htm — 200
- STF notícia art. 19 (26/06/2025): https://noticias.stf.jus.br/postsnoticias/stf-define-parametros-para-responsabilizacao-de-plataformas-por-conteudos-de-terceiros/ — 200
- STF Tema 987: https://portal.stf.jus.br/jurisprudenciaRepercussao/verAndamentoProcesso.asp?incidente=5160549&numeroProcesso=1037396&classeProcesso=RE&numeroTema=987 — 200
- STF Tema 483 (ARE 652.777): https://portal.stf.jus.br/jurisprudenciaRepercussao/verAndamentoProcesso.asp?incidente=4121428&numeroProcesso=652777&classeProcesso=ARE&numeroTema=483 — 200
- TSE Res. 23.610/2019, 23.732/2024, 23.755/2026 e notícia abril/2026 — **403 para robôs (Akamai)**; URLs confirmadas por indexação; abrir em navegador.
- ANPD: https://www.gov.br/anpd/pt-br — 200 · Portal da Transparência: https://portaldatransparencia.gov.br/ — 200 · Dados abertos TSE: https://dadosabertos.tse.jus.br/ — 200 · DataJud CNJ: https://www.cnj.jus.br/sistemas/datajud/ — 200
