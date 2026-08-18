# Notas — Coletânea de mídia, checagem e agregadores (Monitor de Gravata)

Data da pesquisa: 2026-08-18 (eleições 04/10/2026). Catálogo: `apis-midia-agregadores.json` (30 entradas, 28 testadas ok).

## 1. O que existe (resumo do teste)

| Camada | Fonte | Situação |
|---|---|---|
| Índice/agregador | Google News RSS | OK, 100 itens/consulta, mas copyright restringe a "personal, non-commercial use" |
| Índice/agregador | GDELT DOC 2.0 | OK, `sourcelang:por sourcecountry:BR`, 1 req/5 s, sem restrição de uso, títulos às vezes sem acento |
| Checagem agregada | Google Fact Check Tools API | Vivo, exige API key (403 sem chave) |
| Identidade | Wikidata (search/EntityData/SPARQL) + Wikipédia PT + Pageviews | OK — QID é a chave de desambiguação |
| Oficial (domínio público) | Agência Câmara (RSS por editoria), Agência Senado (`/noticias/RSS`), Agência Brasil (CC BY) | OK |
| Veículos (só metadados) | Poder360, Congresso em Foco, g1, Folha, Estadão, Metrópoles, CNN, JOTA, Nexo, Pública, Intercept, BBC | OK |
| Checagem (RSS) | Aos Fatos, Lupa, Comprova (`/publicações/feed/`), g1 Fato ou Fake, Boatos.org, E-farsas | OK |
| Ranking terceiros | Ranking dos Políticos API (`/parlamentares?nome=`, `/partidos`, `/votacoes`) | OK, sem detalhe individual por id |
| Propaganda paga | Meta Ad Library API (token), Google Political Ads (bundle CSV/BigQuery), TSE despesas de campanha (impulsionamento) | Meta exige token; demais OK |

Falhas/lacunas: Estadão Verifica sem feed dedicado confirmado; UOL Confere = 403; O Globo `/rss/politica/` = 400 (só `/rss.xml` vazio); Senado `/noticias/feed` devolve HTML.

## 2. Pipeline de coletânea por político

```
entrada: { nome, variantes[], cargo, uf, qid?, id_camara?, id_senado? }
   │
   ├─ 1. Resolver identidade (Wikidata wbsearchentities → QID → P39/P102/P18, ids externos)
   │     — se >1 candidato, exigir cargo/UF do usuário (homônimos: "José Silva", "João Campos")
   │
   ├─ 2. Montar queries
   │     q1 = "\"NOME COMPLETO\""                     (frase exata)
   │     q2 = "\"NOME URNA\" (deputado OR senador OR prefeito OR governador OR vereador)"
   │     q3 = "\"NOME URNA\" UF|cidade"              (para nomes comuns)
   │     variantes: nome civil, nome de urna, apelido ("Lira", "Bolsonaro" → SEMPRE com cargo/UF)
   │
   ├─ 3. Consultar em paralelo (server-side, com cache)
   │     Google News RSS (q1..q3, when:30d)  → título+link+veículo+data
   │     GDELT artlist (q1 sourcelang:por sourcecountry:BR, timespan=3m) + timelinevolinfo
   │     RSS diretos (poder360, congresso em foco, g1, folha, estadão, metrópoles, jota…) → filtro por regex do nome no título/descrição
   │     RSS checagem (aos fatos, lupa, comprova, fato ou fake) + Fact Check Tools (claims:search)
   │     Agência Câmara/Senado (por nome) — oficial, texto reproduzível
   │
   ├─ 4. Normalizar → { titulo, url_final, veiculo, data_iso, fonte_indice, tipo: noticia|checagem|oficial }
   │     — Google News: título vem "Título - Veículo" → separar pelo último " - "; link é redirect (news.google.com/rss/articles/…) — resolver p/ URL canônica com HEAD e cache; NÃO seguir se falhar, mostrar o redirect
   │     — GDELT: usar `domain` como veículo; corrigir acentos só via re-fetch do <title> (opcional)
   │
   ├─ 5. Dedupe
   │     chave = url canônica sem utm/query + fallback hash(normalize(título)) ; janela ±48 h para mesmo título em veículos diferentes (agregar como "cobertura em N veículos")
   │
   ├─ 6. Score de relevância/homônimo
   │     +2 nome completo no título; +1 cargo/UF no título/descrição; −3 sinais de outro domínio (ex.: "Lira" + "música"), listas de exclusão por político
   │     abaixo de limiar → "possivelmente homônimo" (colapsado na UI)
   │
   └─ 7. Exibir só título + link + veículo + data (+ selo checagem c/ veredito) — nunca corpo, nunca imagem do veículo
```

## 3. Regras de copyright / uso justo (BR)

- **Google News RSS**: o próprio feed diz que é só para "personal, non-commercial use" em leitor pessoal. Projeto é open-source sem fins lucrativos, mas é público → tratar como *índice de descoberta*, não como fonte exibida em massa. Mitigar: (a) preferir RSS diretos dos veículos + GDELT; (b) usar Google News apenas para "buscar agora" acionado pelo usuário, com cache curto; (c) nunca redistribuir o feed.
- **Veículos**: manchete + link + data = uso amplamente aceito (Lei 9.610/98, art. 46; jurisprudência de agregadores). Nunca reproduzir lead/corpo/foto. Respeitar `robots.txt` e não fazer scraping de página de artigo.
- **Domínio público/CC**: Agência Câmara, Agência Senado, Agência Brasil (CC BY), Agência Pública (CC BY-ND) — podem ter trecho reproduzido com crédito.
- **Wikidata CC0; Wikipédia CC BY-SA** (atribuir).
- **Meta Ad Library / Google Ads**: termos proíbem redistribuir dados brutos em massa; exibir agregados (gasto total por período, top anunciantes) com link para a biblioteca oficial.
- **Ranking dos Políticos**: opinião de OSC com critérios próprios (viés declarado liberal); rotular como "avaliação de terceiro".

## 4. Cache e limites

| Fonte | Cache sugerido | Limite |
|---|---|---|
| Google News RSS | 30–60 min por query | não documentado; 429/captcha em abuso |
| GDELT | 15 min; fila global 1 req/5 s (mutex) | resposta de erro é texto plano → tratar como retry |
| Fact Check Tools | 6 h | cota GCP (~1000/dia padrão) |
| RSS veículos | 15–30 min por feed (feed único, filtro local por nome) | educar UA; ETag/If-Modified-Since |
| Wikidata/Wikipédia | 24 h por QID | UA obrigatório na SPARQL |
| Pageviews | 24 h | 100 req/s |
| Ranking API | 24 h (paginar 1100 pág. só em job noturno) | não documentado |
| Meta Ad Library | 6 h | Graph API por app |

Estratégia: um *worker* consome os ~20 feeds a cada 15 min e grava itens normalizados em tabela `midia_itens` (título, url, veículo, data, hash). A busca por político é feita **localmente** (FTS/regex sobre título) + on-demand Google News/GDELT quando o usuário abre a ficha. Assim o tráfego externo independe do número de usuários.

## 5. Viés e rotulagem

- Cada fonte recebe `linha_editorial` (ex.: institucional, mainstream, investigativo, checagem, opinião OSC) e `observacao_vies` (Agência Brasil = estatal; Intercept = progressista declarado; Ranking dos Políticos = liberal declarado; Poder360/Congresso em Foco = especializados; JOTA = jurídico).
- Sempre mostrar **pluralidade**: agrupar por veículo e destacar quando um fato só aparece em 1 fonte.
- Checagens: mostrar veredito textual do checador (Falso/Enganoso/Verdadeiro) com o nome da agência; nunca reescrever o veredito.
- Ausência de notícia negativa ≠ ficha limpa; deixar isso explícito na UI.

## 6. Notas técnicas específicas

- **Google News RSS**: `q` aceita `when:7d`, `after:2026-01-01`, `site:`, aspas; `hl=pt-BR&gl=BR&ceid=BR:pt-419` obrigatório para pt-BR; item traz `<source url=...>`. Máx 100 itens.
- **GDELT**: `mode=artlist|timelinevol|timelinevolinfo|tonechart|wordcloudimagetags`, `format=json|csv|rss`, `maxrecords<=250`, `timespan=7d|3m` ou `startdatetime/enddatetime` (YYYYMMDDHHMMSS). Query com só operadores → erro; precisa termo.
- **Wikidata**: P39 (cargo) c/ qualificadores P580/P582/P768 (circunscrição); P102 (partido) c/ P580/P582; P4348 (ID deputado Câmara), P18 (foto CC). Q23904977 = Arthur Lira (verificado).
- **Senado RSS**: usar `https://www12.senado.leg.br/noticias/RSS` (o `/feed` é HTML).
- **Comprova**: usar `/publicações/feed/` (URL-encoded); `/feed/` raiz só tem "Test Document" 2019.
- **Ranking API**: Laravel paginate; `?nome=` funciona, `?search=/?uf=/?cargo=` ignorados; sem endpoint de detalhe por id/slug.
- **TSE**: gasto com impulsionamento está no CSV de despesas contratadas (prestação de contas eleitorais), coluna `DS_ORIGEM_DESPESA` / fornecedor (Facebook Serviços Online do Brasil, Google Brasil Internet) — não é dataset separado.
- **Meta Ad Library**: além do token, exige verificação de identidade do desenvolvedor para `POLITICAL_AND_ISSUE_ADS`; começar o processo com antecedência (dias).

## 7. Próximos passos

1. Criar chave do Google Fact Check Tools + iniciar verificação da Meta Ad Library.
2. Confirmar feed do Estadão Verifica (ou usar Fact Check Tools com `reviewPublisherSiteFilter=estadao.com.br`) e alternativa p/ UOL Confere.
3. Testar `?s=NOME&feed=rss2` nos WordPress (Poder360, Congresso em Foco, Metrópoles, Pública, Boatos) para busca por nome sem baixar feed inteiro.
4. Definir lista de exclusão de homônimos por político (curadoria comunitária).
