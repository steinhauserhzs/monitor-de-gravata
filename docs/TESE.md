# Tese — por que o Monitor de Gravata existe e por que agora

## 1. O diagnóstico

O Brasil não tem um problema de *falta* de transparência. Tem um problema de **transparência sem leitor**.

- A Câmara publica cada nota da cota parlamentar com CNPJ do fornecedor. Milhões de linhas. Ninguém lê.
- Desde a Lei 14.133 (2021) e a obrigatoriedade do PNCP (2024), **cada contrato de cada prefeitura** é publicado num único lugar, com itens e preços unitários. Ninguém cruza.
- O TSE publica bens, doadores, fornecedores de campanha e certidões de **todo candidato**. A cada dois anos, milhares de declarações que ninguém compara com a anterior.
- O Compras.gov.br publica o preço **realmente pago** por cada órgão, item a item, com marca e fornecedor. Uma base de referência de preços que raramente é usada por quem fiscaliza no município.
- A Receita publica o quadro societário de toda empresa. O Portal da Transparência publica quem está proibido de contratar. Raramente alguém cruza os dois com o PNCP.

O que falta não é dado. É **(a) cruzamento**, **(b) regra objetiva que aponte onde olhar** e **(c) gente organizada para olhar** — sem virar linchamento.

## 2. A aposta

> **Portal da Transparência 2.0 = dado oficial + regras públicas + comunidade com método + memória de git.**

Quatro escolhas que definem o projeto:

1. **Repo como banco de dados.** Catálogo de APIs, regras, casos e índices derivados são arquivos versionados. Não há "admin" que edita silenciosamente. A trilha de auditoria é o histórico do git — quem, quando, por quê. Isso é governança e é segurança (poisoning fica visível; takedown fica registrado).
2. **Regras como código, com fórmula pública.** Uma red flag não é opinião: é `valor / mediana > 1.3` com fonte metodológica (OCP, Rosie, OPS, TCU, CGU). Roda igual para todo partido. Quem discorda do limiar abre PR.
3. **Fato ≠ juízo.** O app nunca diz "corrupto". Diz "recebeu 62% da cota de um único CNPJ (fonte, data)". Isso é a defesa jurídica embutida no design (CP 138–140, presunção de inocência) — e é também o que torna o dado útil: uma pergunta objetiva que o citado pode responder.
4. **Comunidade com ciclo de vida.** Hipóteses viram *casos* com 5 seções obrigatórias (fato, cruzamento, red flags, o que não sabemos, próximo passo), revisão dupla e direito de resposta em 72h. Isso separa o Monitor de uma rede social de denúncias.

## 3. Por que 2026 é a janela

- **Eleições gerais em 04/10/2026.** Registro de candidaturas encerrou em 15/08; o DivulgaCand já lista todos os candidatos com bens e situação. A prestação de contas parcial começa em setembro. É o momento de máxima atenção pública e máxima disponibilidade de dado.
- **PNCP maduro.** Dois anos de obrigatoriedade universal: pela primeira vez dá para ver o contrato da prefeitura de Campo Erê/SC e o da União na mesma API.
- **Custo da inação.** Não citamos números de "custo da corrupção" sem fonte primária (estimativas variam muito e são disputadas). O que é mensurável: cada red flag automatizada que vira pergunta pública custa zero e escala para 5.570 municípios.

## 4. O que "pensar além" significou aqui

O pedido original era ficha do político + contratos + superfaturamento. As pontas e ramificações que preenchemos:

- **Ficha 360** com produtividade, votações + coerência partidária, presença em plenário, linha do tempo (Câmara + Wikidata), comissões, discursos, emendas, notícias, red flags — e um painel honesto de **vínculos a verificar** (sobrenomes raros × servidores × fornecedores × outros candidatos), sempre como hipótese.
- **Manual do Candidato** com evolução patrimonial casada por nome/UF entre eleições, receitas por origem, processos de cassação, certidões anexadas, e "perguntas para fazer ao candidato" geradas pelos dados.
- **Comparador de preços** ligado ao contrato: do item do PNCP para a mediana do que outros órgãos pagaram pelo mesmo padrão CATMAT.
- **Ficha da empresa** como pivô: do CNPJ para contratos, sócios, sanções — e de volta para políticos (busca por sócio).
- **Catálogo de APIs com status testado e data**, porque um portal que aponta para endpoint morto é pior que nenhum.
- **Governança e segurança desde o dia 1**: threat model, política editorial, direito de resposta, CI que barra CPF completo e linguagem não factual, mantenedores sem cargo político.

## 5. O que o Monitor não é

- Não é tribunal. Não é ranking de "melhor/pior político" com juízo de valor. Não é pesquisa eleitoral. Não é jornal.
- Não gera fatos com IA. IA serve para pesquisar fontes, testar endpoints e sugerir regras — nunca para "preencher" um número que não existe na fonte.
- Não tem lado. Se um dia tiver, falhou.

## 6. Como medir sucesso (12 meses)

- Nº de red flags automatizadas e % que viram caso com resposta do citado.
- Nº de APIs no catálogo com status "ok" verificado nos últimos 90 dias.
- Nº de casos publicados com revisão dupla × nº de correções (queremos correções: mostram que o processo funciona).
- Cobertura: municípios com contrato lido no Radar; candidatos com ficha aberta na eleição.
- Zero: dados sensíveis publicados; regras com exceção por nome.
