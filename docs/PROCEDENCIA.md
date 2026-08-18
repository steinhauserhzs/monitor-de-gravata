# Procedência dos dados exibidos

> **Para que serve este documento.** O Monitor de Gravata só publica dado público. Mas dado público
> exibido fora de contexto vira informação enganosa — e enganar é pior do que não publicar.
> Este documento é a **regra de ouro do produto**: nenhum campo entra em tela sem uma linha aqui
> declarando (a) de onde ele vem, (b) se é autodeclarado, (c) se é amostra ou universo,
> (d) como está rotulado hoje e (e) como deveria estar rotulado.
>
> **Regra:** se um campo não está nesta tabela, ele não pode ser exibido.
> **Regra:** se o rótulo atual difere do recomendado, o campo está em dívida e a correção é prioritária.
>
> Última auditoria: **18/08/2026**. Verificação feita contra as páginas em produção
> (`monitordegravata.vercel.app`) e contra as APIs de origem.

## Legenda das colunas

| Coluna | O que responde |
|---|---|
| **Autodeclarado?** | O dado foi **preenchido pela própria pessoa/empresa** (registro no TSE, formulário) ou **apurado por um órgão** (empenho no SIOP, votação em plenário)? |
| **Amostra ou universo?** | O número exibido é **tudo o que existe** ou só a **fatia que a API devolveu** (página 1, últimos N, primeiros 15)? |
| **Rótulo recomendado** | O texto que deve aparecer em tela para o leitor não entender mais do que a fonte garante. |

Estados de saúde usados abaixo:
🔴 **mente** (o rótulo afirma algo que a fonte não garante) · 🟠 **incompleto** (verdadeiro mas sem o contexto que muda a leitura) · 🟢 **ok**.

---

## Página: `/candidatos/[ano]/[uf]/[id]` — ficha do candidato

Fonte principal: **TSE DivulgaCandContas** (`divulgacandcontas.tse.jus.br/divulga/rest/v1`).
Complementos: Wikidata, Câmara/Senado dados abertos, Portal da Transparência (CGU), Google Notícias RSS, RSS de checadores.

### Cabeçalho e KPIs

| Campo exibido | Fonte oficial | Autodeclarado? | Amostra ou universo? | Rótulo atual | Rótulo recomendado |
|---|---|---|---|---|---|
| Nome de urna, nome completo, partido, coligação, nº | TSE `candidatura/buscar` | Não (registro validado) | Universo (este registro) | `NOME · PARTIDO (…)` | 🟢 manter |
| Ocupação, grau de instrução, nascimento, cor/raça | TSE `candidatura/buscar` | **Sim** — declarados no registro | Universo | texto corrido, sem marca | 🟠 `ocupação (autodeclarada ao TSE)` |
| Situação do registro (`Deferido` / `Indeferido` / `Aguardando julgamento`) | TSE, campo `descricaoSituacao` | Não | Universo | selo colorido | 🟠 acrescentar `situação em <dataUltimaAtualizacao>` — situação de registro muda |
| Totalização (`Eleito`, `Concorrendo`, `Não eleito`) | TSE, campo `descricaoTotalizacao` | Não | Universo | selo `stamp--ink` | 🟠 `resultado apurado (<ano>)` — hoje aparece congelado sem data |
| **Bens declarados `<ano>`** | TSE, `totalDeBens` | **Sim** | Universo dos bens declarados | `Bens declarados 2022` + `N item(ns)` | 🟠 `Bens declarados ao TSE (autodeclarado, valor de aquisição)` |
| **Eleição anterior** | TSE `candidatura/listar` de anos anteriores | Sim (mesmo campo) | **Amostra**: só 2 anos anteriores × 3 cargos, UF forçada a `BR` quando cargo=1 | `sem candidatura anterior localizada (mesmo nome/UF)` | 🔴 `nenhuma candidatura encontrada em <anos> para <cargos> em <UF>` — e distinguir de "fonte indisponível" |
| **Variação patrimonial** | TSE (dois `totalDeBens`, anos diferentes) | **Sim, duas vezes** | Universo dos dois registros | `Variação patrimonial · -7%` (sem hint) | 🔴 `Variação nominal do total declarado (2018→2022)` + hint `valores de aquisição autodeclarados, sem correção pela inflação; casamento por nome completo + UF` |
| **Receitas de campanha** | TSE `prestador/consulta` → `dadosConsolidados.totalRecebido` | Sim (prestação do candidato) | Universo do que foi prestado até `dataUltimaAtualizacaoContas` | `Receitas de campanha` + `2% de partido/fundo · 15% de PF` | 🟠 `Receitas declaradas na prestação de contas (parcial até <data>)`; percentuais precisam da base (`% do total recebido`) |
| **Red flags** | Regras próprias (`lib/rules`) | n/a | Só o que as regras cobrem | `Red flags · 0` / `nenhum sinal automático` | 🟠 `Sinais automáticos acionados · 0` + `só cobre as N regras publicadas` — "0 red flags" lê como "nada errado" |

### §0 — "O que já fez com o mandato"

| Campo exibido | Fonte oficial | Autodeclarado? | Amostra ou universo? | Rótulo atual | Rótulo recomendado |
|---|---|---|---|---|---|
| Todo o painel (existência) | Câmara `/deputados?nome=` ou Senado `/lista/atual` | Não | **Match por nome, por substring** | `O que já fez com o mandato` + selo `vínculo provável` | 🔴 com `confianca !== "exata"`, **não renderizar número nenhum** — só o card "possível homônimo: `<nome>` (`<partido>`-`<uf>`), confira" |
| Ausência do painel | idem, mas `safe()` converte **falha de rede em `null`** | — | — | `Sem mandato federal em exercício — Não localizamos X entre os deputados federais e senadores em exercício` | 🔴 três estados distintos: `localizado` / `não localizado nas bases consultadas` / `fonte indisponível agora`. Nunca afirmar ausência de mandato |
| Votou a favor / Votou contra | Câmara `/votacoes` nominais dos ~9 meses recentes | Não | **Amostra** (só votações nominais recentes; maioria é simbólica) | valor + hint `de N votações nominais localizadas (varredura de ~9 meses)` | 🟢 hint já é honesto — manter e nunca remover |
| **Verba pública movimentada** | cota CEAP do ano corrente + `valorPago` de emendas | Não | **Amostra e períodos misturados**: cota de **um** ano + emendas de **todos** os anos que couberam na página 1 | `Verba pública movimentada R$ 96.638.898,00` | 🔴 separar em dois números: `Cota parlamentar <ano>` e `Emendas pagas <faixa de anos> (lista parcial)` |
| Presença no plenário | Câmara `/eventos` × `/sessões deliberativas` | Não | Universo do ano corrente | `92% (60/65 sessões deliberativas)` | 🟠 acrescentar o ano: `em <ano>` |
| **Pautas que apresenta (temas)** — Câmara | Câmara `/proposicoes/{id}/temas` | Não | **Amostra: 12 primeiras proposições** | `Pautas que apresenta (temas das proposições de autoria)` | 🟠 `temas das 12 proposições mais recentes de autoria` |
| **Pautas que apresenta (temas)** — **Senado** | Senado `/autorias` → `Materia.Sigla` = **tipo de documento** (RQS, PEC, PL) | Não | Universo das autorias | `Pautas que apresenta (temas…)` + `Temas classificados pela própria Câmara/Senado` | 🔴 `Tipos de matéria que assina (não é classificação temática)` e **remover** a legenda sobre temas — o endpoint não devolve tema |
| **Emendas parlamentares** | Portal da Transparência `/emendas?nomeAutor=` | Não | **Amostra: página 1 = até 15 emendas**, match por nome em texto livre do SIOP | `Total empenhado localizado: R$ 114.623.640,53` | 🔴 `primeiras 15 emendas localizadas para o autor "<NOME>" (lista parcial, página 1 do Portal)` — ou paginar até o fim |
| Destinos das emendas (barras) | idem | Não | Amostra (10 primeiras da página 1) | barras sem qualificação | 🟠 `10 primeiras da amostra` |

### §1 a §8

| Campo exibido | Fonte oficial | Autodeclarado? | Amostra ou universo? | Rótulo atual | Rótulo recomendado |
|---|---|---|---|---|---|
| §1 Patrimônio — lista e barras por tipo | TSE `bens[]` | **Sim** | Universo do declarado (tabela corta em 25 itens) | `Patrimônio declarado` | 🟠 `Patrimônio declarado ao TSE (autodeclarado, valor de aquisição — não é valor de mercado)`; avisar quando a tabela corta |
| §1 Evolução declarada (barras) | TSE, dois anos | **Sim** | Amostra (até 2 eleições anteriores) | `Evolução declarada` | 🟠 `valores nominais, sem correção pela inflação` |
| §3 Barras de origem da receita | TSE `dadosConsolidados` | Sim | **Decomposição incompleta**: `totalDoacaoFcc`, `totalDoacaoAplicacaoFinanceira`, `totalReceitaComercializacao`, `totalDoacaoBensMoveisImoveis` **não são exibidos** | barras que somam bem menos que o total, sem aviso | 🔴 mapear todos os campos `total*` + barra `Outras origens = total − soma exibida`; **nunca publicar decomposição que não fecha** |
| **§3 Gasto declarado (1º turno)** | TSE, campo `gastoCampanha1T` = **`limiteDeGasto1T`**, o **teto legal do cargo/UF/ano** | Não — é norma, não despesa | Universo (é uma constante do cargo) | `Gasto declarado (1º turno) — R$ 88.944.030,80` | 🔴 `Limite legal de gastos (1º turno)` + `teto do TSE para o cargo, não é o que este candidato gastou`. Gasto real: `despesas.totalDespesasPagas` / `totalDespesasContratadas` |
| §3 CNPJ de campanha | TSE `prestador/consulta.cnpj` | Não | Universo | `CNPJ de campanha` | 🟢 |
| §4 Linha do tempo — candidaturas | TSE (ano + situação) | parcialmente | Universo do que foi localizado | `2018 → atual · candidatura Presidente · Indeferido` | 🔴 candidatura é **evento pontual**: exibir só o ano, nunca `→ atual` |
| §4 Linha do tempo — cargos/partidos | Wikidata (`P39`, `P102`) | Comunitário (Wikidata é editável) | Universo do item Wikidata | `2023-02-01 → atual · cargo deputado federal` + fonte `Wikidata` | 🟠 `→ atual` só é válido aqui; acrescentar `fonte comunitária, pode estar desatualizada` |
| §5 Processos de registro / DRAP / prest. contas | TSE | Não | Universo deste registro | número puro | 🟢 |
| **§5 Cassação/desconstituição registradas** | TSE `processosCassacao` + `processosDesconstituicao` **deste registro** | Não | **Escopo estreito**: só processos atrelados a ESTA candidatura | `Cassação/desconstituição registradas: **0**` (negrito) | 🔴 `Processos atrelados a ESTE registro de candidatura (DivulgaCand)` e exibir `—` (não `0`) quando o campo não vier no payload |
| **§5 Certidões anexadas** | TSE `arquivos[]`, filtro por **nome de arquivo** (`/certid\|TRF\|TJ\|justi/i`) | **Sim** (o candidato sobe os PDFs) | **Amostra enviesada**: quem sobe `11_1659542402298.pdf` some da lista | `23 certidões anexadas ao registro` / **nada** | 🔴 classificar por `codTipo` (campo oficial) e sempre exibir `N arquivos anexados ao registro`, mesmo sem tipo reconhecido |
| §5 Plano de governo (PDF) | TSE `arquivos[]` codTipo 5 | **Sim** | Universo | botão | 🟢 |
| **§5b Sobrenome(s) menos comum(ns)** | heurística própria (`lib/vinculos.ts`) sobre o nome do TSE | — | heurística, não base | `Sobrenome(s) menos comum(ns): JOSE` | 🔴 `JOSE`/`ANTONIO`/`EDINHO` são **prenomes**; a função pega todas as palavras após a primeira. Filtrar prenomes e exigir raridade real, ou omitir o bloco |
| §5b Outros candidatos com o mesmo sobrenome | TSE `candidatura/listar` do ano/UF | Não | Universo dos cargos consultados | `Outros candidatos 2026 em SP com o mesmo sobrenome (108)` + aviso "não prova parentesco" | 🟠 aviso existe e é bom; acrescentar `cargos consultados: <lista>` |
| §5c Links declarados | TSE campo `sites` | **Sim** | Universo | painel com `Notice tone="warn"` explicando que é autodeclarado e não verificado | 🟢 **este é o padrão-ouro do projeto** — replicar em todos os blocos acima |
| **§6 Na mídia (manchetes recentes)** | Google Notícias RSS, query `"NOME" candidato UF`, **sem filtro** | Não | **Amostra textual**: casa por nome, não por pessoa | `Na mídia (manchetes recentes)` + aviso cinza 0,68rem **no rodapé** | 🔴 `Resultados de busca por este nome (podem ser outra pessoa)`, aviso **no topo**, descartar itens com nome próprio divergente/outra UF; para nome ambíguo, esconder e só oferecer o link da busca |
| §6 Estado vazio | idem — `noticiasGoogle` devolve `[]` em qualquer erro | — | — | `Nenhuma manchete recente encontrada para "X"` | 🔴 separar `nenhum resultado` de `feed indisponível` |
| **§6b Checagens de fatos** | 1º Google Fact Check (ClaimReview, tem veredito) · 2º **RSS de Aos Fatos/Comprova** (reportagem comum, **sem veredito**) | Não | Amostra; filtro = todas as palavras >3 letras do nome em título+descrição | `Checagens de fatos` + `O veredito é do checador, não do Monitor` | 🔴 no modo RSS: `Matérias de checadores que citam este nome` (≠ "checagem sobre") e **não falar em veredito**; exigir o nome como expressão contígua no título |
| §7 Perguntas para fazer ao candidato | derivadas das red flags | — | — | lista | 🟠 vem logo depois de §6/§6b — se o painel de mídia tem homônimo, a proximidade sugere ligação |

---

## Página: `/politicos/deputado/[id]`

| Campo exibido | Fonte oficial | Autodeclarado? | Amostra ou universo? | Rótulo atual | Rótulo recomendado |
|---|---|---|---|---|---|
| Cota parlamentar `<ano>` | Câmara `/deputados/{id}/despesas` | Não (nota fiscal reembolsada) | Universo do ano | `Cota parlamentar 2026` + `N notas · M fornecedores` | 🟢 |
| Presença no plenário | Câmara `/eventos` × sessões deliberativas | Não | Universo do ano | `X/Y sessões deliberativas em <ano>` | 🟢 |
| Coerência c/ partido | Câmara `/votacoes` + orientações | Não | **Amostra**: últimas nominais | `N/M nas últimas votações nominais` | 🟢 |
| Proposições (amostra) | Câmara `/proposicoes?idDeputadoAutor=` | Não | **Amostra: 50 últimas** | `Proposições (amostra)` + `(amostra das 50 últimas)` | 🟢 rótulo honesto |
| **§8 Emendas parlamentares** | Portal da Transparência `/emendas` **página 1** | Não | **Amostra: até 15** | título `Emendas parlamentares (todas as que constam no SIOP)` — mas rodapé diz `Página 1 (até 15 emendas)` | 🔴 **título e rodapé se contradizem**: trocar o título para `Emendas localizadas no SIOP (página 1, até 15)` |
| §8b Vínculos por sobrenome | heurística própria | — | heurística | idem ficha do candidato | 🔴 mesma correção de prenomes |
| §9 Na mídia / §9b Checagens | Google Notícias RSS / RSS checadores | Não | Amostra textual | idem ficha do candidato | 🔴 mesma correção |

## Página: `/politicos/senador/[codigo]`

| Campo exibido | Fonte oficial | Autodeclarado? | Amostra ou universo? | Rótulo atual | Rótulo recomendado |
|---|---|---|---|---|---|
| Cota (CEAPS) `<ano>` | Senado dados abertos administrativos | Não | Universo do ano | `Cota (CEAPS) 2026` | 🟢 |
| Votações registradas / Registrou voto / Presente sem votar | Senado `/senador/{cod}/votacoes` | Não | **Últimas 25** no painel §1 | `últimas 25 votações do Plenário` | 🟢 |
| Matérias de autoria | Senado `/autorias` | Não | Universo | `Matérias de autoria` + `N como autor principal` | 🟢 |
| Painel §0 na ficha do **candidato** (temas) | Senado `/autorias` → `Materia.Sigla` | Não | Universo | `Pautas que apresenta (temas…)` | 🔴 ver correção acima — é tipo de documento, não tema |

## Página: `/empresas/[cnpj]`

| Campo exibido | Fonte oficial | Autodeclarado? | Amostra ou universo? | Rótulo atual | Rótulo recomendado |
|---|---|---|---|---|---|
| Razão social, CNAE, capital social, QSA | BrasilAPI / Minha Receita (base da Receita Federal, atualização mensal) | Declarado à Receita | Universo | `Fonte: BrasilAPI (Receita Federal)` | 🟠 acrescentar `base atualizada mensalmente — pode não refletir alteração recente` |
| Contratos no PNCP | PNCP índice | Não | **Universo a partir de 2024** | `Contratos no PNCP` + `nos N mais recentes` + texto explicando o corte 2024 | 🟢 |
| Sanções (CEIS/CNEP) | Portal da Transparência | Não | **Página 1 de cada base** | `Sanções · N` + `CEIS n · CNEP m` | 🟠 `sanções na página 1 de cada base` — hoje `N` lê como total |
| Cota parlamentar recebida | arquivo anual da Câmara, processado em lote | Não | Universo do(s) ano(s) ingerido(s) | `Cota parlamentar recebida` + `N deputado(s) · M nota(s)` | 🟠 declarar **quais anos** foram ingeridos |
| §6 Na mídia | Google Notícias RSS | Não | Amostra textual | idem | 🟠 mesmo aviso de homônimo (empresas com nome genérico) |

## Página: `/precos` e `/precos/compra/[id]` — comparador de preços

| Campo exibido | Fonte oficial | Autodeclarado? | Amostra ou universo? | Rótulo atual | Rótulo recomendado |
|---|---|---|---|---|---|
| Preço típico (mediana), mínimo, máximo | Compras.gov.br, preços **homologados** por PDM/CATMAT | Não | **Amostra**: até N páginas de 200 | `Compras analisadas: X de Y publicadas` | 🟢 a razão amostra/universo é explícita |
| Referência de varejo | fonte de varejo | Não | Amostra | `Varejo não é contrato: pode incluir garantia, instalação…` | 🟢 |
| Comparação unitária entre compras | Compras.gov.br | Não | Amostra | `Cuidados: o mesmo PDM cobre especificações diferentes… quantidade grande baixa o unitário` | 🟢 **modelo de honestidade** — o aviso sobre escala de compra já está lá |
| Cobertura das bases | Compras.gov.br/PNCP | — | **Universo parcial do país** | `Estados/municípios com sistema próprio podem não aparecer` | 🟢 |
| Valor destes itens | `unitário × quantidade homologada` | Não | Amostra do PDM selecionado | `preço unitário × quantidade homologada` | 🟢 |

## Página: `/contratos` — radar PNCP

| Campo exibido | Fonte oficial | Autodeclarado? | Amostra ou universo? | Rótulo atual | Rótulo recomendado |
|---|---|---|---|---|---|
| Lista de contratos/dispensas/inexigibilidades | PNCP | Não | **Universo a partir de 2024**, janela de N dias | `O que o radar cobre: … desde 2024 … Estaduais antigos: TCEs` | 🟢 |
| Coluna "Sinais" | regras próprias | — | só as regras publicadas | `Uma red flag é um sinal calculado por regra pública. Não é irregularidade nem acusação.` | 🟢 |
| Erro da API | PNCP | — | — | `A API do PNCP não respondeu: <erro>` | 🟢 **padrão correto de falha** — replicar nos blocos do candidato |

## Página: `/cruzamentos`

| Campo exibido | Fonte oficial | Autodeclarado? | Amostra ou universo? | Rótulo atual | Rótulo recomendado |
|---|---|---|---|---|---|
| Empresas nas duas pontas | índice derivado (Postgres) de cota + PNCP | Não | **Amostra**: depende da janela de ingestão | `Nenhuma empresa nas duas bases ainda — rode a ingestão com janela maior` | 🟢 |
| Soma no ranking de cota | idem | Não | Amostra | `apenas os listados abaixo` | 🟢 base explícita |

---

## Padrões que o projeto deve copiar de si mesmo

Três blocos já acertam e devem virar template:

1. **§5c Links declarados** (ficha do candidato) — painel com aviso de "autodeclarado, não verificado" **antes** da lista.
2. **`/precos`** — `X de Y publicadas`, aviso de que quantidade muda o unitário, aviso de cobertura parcial.
3. **`/contratos`** — mostra o erro literal da API em vez de fingir lista vazia.

## Checklist obrigatório antes de exibir qualquer campo novo

- [ ] O rótulo diz **exatamente** o que a fonte mede? (`gastoCampanha1T` ≠ "gasto declarado")
- [ ] O dado é autodeclarado? Se sim, a palavra "declarado/autodeclarado" está **no rótulo**, não só no rodapé.
- [ ] É amostra? Se sim, o rótulo diz o tamanho e o critério (`primeiras 15`, `últimos 9 meses`, `desde 2024`).
- [ ] Se é uma decomposição (barras, percentuais), **a soma fecha com o total**? Se não, existe linha "Outras origens"?
- [ ] Percentual tem base declarada (`% de quê`)?
- [ ] O casamento com a pessoa é por **identificador** (id da Câmara, CPF, CNPJ) ou por **nome**? Se por nome, o bloco não pode exibir números.
- [ ] Estado vazio: a UI distingue `não existe` de `fonte falhou`? (`safe()` devolve `null` nos dois casos — a UI **não pode** tratar igual.)
- [ ] Nenhum rótulo emite juízo ("suspeito", "irregular") onde só há sinal estatístico.
- [ ] Há fonte e data de coleta no bloco.
