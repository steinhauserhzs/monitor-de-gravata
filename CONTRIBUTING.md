# Como contribuir

Obrigado por chegar. Este repositório é o banco de dados do Monitor de Gravata: **dados, regras, casos e código** vivem aqui, e o histórico do git é a trilha de auditoria.

## O básico

1. Fork → branch → PR pequeno e focado. Descreva **o quê** e **por quê**; anexe a fonte de tudo que for dado.
2. `npm install && npm run validar` antes de abrir o PR (a CI roda o mesmo).
3. Linguagem factual sempre (ver [docs/POLITICA-EDITORIAL.md](docs/POLITICA-EDITORIAL.md)). Português.
4. Não sabe por onde começar? Issues marcadas `boa-primeira-issue`.

## Tipos de contribuição

### 1. Nova API / fonte de dado (`data/apis/*.json`)
Copie uma entrada de `data/apis/00-nucleo-verificado.json` (schema em [research/SCHEMA-API.md](research/SCHEMA-API.md)). Campos obrigatórios: `id` (kebab-case único), `nome`, `orgao`, `esfera`, `base_url`, `auth`, `endpoints_chave` (≥1), `utilidade_anticorrupcao`, `status_verificado` **com data e resultado real do teste** (`curl`). Se só existe download, `auth: "bulk-download"`. Não invente URL.

### 2. Red flag (`data/red-flags.json` + opcionalmente `lib/rules/index.ts`)
Adicione ao JSON: `id`, `nome`, `categoria` (contratacao|parlamentar|eleitoral|empresa|servidor|obra|municipal), `descricao` (o que o sinal significa e o que **não** significa), `fonte` (metodologia: OCP, Rosie, OPS, TCU, CGU, lei…), `dados_necessarios`, `apis`, `severidade`, `logica` (pseudocódigo), `implementada: false`. Para implementar, crie uma `Rule` em `lib/rules/index.ts` com o **mesmo id**, registre em `RULES` e marque `implementada: true`. A `check` deve devolver **evidência factual com número e fonte** ou `null` — nunca adjetivo.

### 3. Caso (`data/casos/NNNN-slug.md`)
Copie `data/casos/0000-modelo-de-caso.md`. Frontmatter: `titulo`, `status: rascunho`, `tipo`, `esfera`, `uf`, `entidades`, `regras`, `fontes` (título, url, coletado_em), `autores`, `criado_em`, `resumo`. Corpo com as 5 seções: **Fato observado · Cruzamento · Red flags acionadas · O que NÃO sabemos · Próximo passo verificável**. Publicação exige 2 revisores (`revisores:`), que checam cada fonte. Nada de CPF completo, endereço, dado vazado, familiares não-públicos, adjetivos.

### 4. Interface (UI)
Antes de mexer em tela, leia [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md): tokens de cor, tipografia, componentes prontos, regras anti-quebra (`.quebra`, `.url`, `.linhas-N`, tabela sempre em `overflow-x-auto`), movimento e voz. Rode `npm run design` — ele barra hex fora dos tokens, tabela sem rolagem, `min-w` fixo, `<img>` sem alt e linguagem não factual. O checklist final está no fim do documento.

### 4b. Código
Next.js 16 (App Router, server components), TypeScript estrito, Tailwind v4. Padrões:
- Toda chamada externa passa por `lib/fetcher.ts` (`getJSON` com timeout/cache/UA; `safe()` para nunca derrubar a página).
- Cada bloco de dado na UI mostra **fonte + link** (`<Source>`).
- Nada de chave no cliente. Env só no servidor.
- Rode `npm run build` (inclui a validação de dados) antes do PR.

### 5. Jobs em lote (`scripts/`, `data/derivados/`)
Índices que não cabem em request (ex.: CATMAT, CEAPS anual, leis por autor) são gerados por script Node com fonte declarada e gravados em `data/derivados/` com `gerado_em`. Documente como regenerar (`npm run <nome>`).

## Revisão

- APIs e regras: 1 mantenedor.
- Casos: 2 revisores independentes; qualquer citado pode contestar (issue "direito de resposta"), e a resposta é anexada em 72h.
- Discordância técnica: ADR em `docs/adr/`.

## Governança
Papéis, decisões e neutralidade em [GOVERNANCE.md](GOVERNANCE.md). Conduta em [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
