# Arquitetura

## Visão
Next.js 16 (App Router, server components, ISR) + Tailwind v4. **Sem banco na v1** — o repositório é a fonte da verdade (`data/`); as APIs públicas são consultadas ao vivo no servidor com cache (`revalidate`) e timeout.

```
data/                     ← "cérebro": editável por PR, validado na CI
  apis/*.json             catálogo de fontes (schema: research/SCHEMA-API.md)
  red-flags.json          catálogo de regras (id ↔ lib/rules)
  casos/*.md              hipóteses com frontmatter + 5 seções
  glossario.json          status processual (linguagem obrigatória)
  derivados/*.json        índices gerados por scripts (ex.: CATMAT 15k PDMs)
lib/
  fetcher.ts              getJSON (timeout, cache, UA de navegador, erro legível) + safe()
  camara.ts senado.ts tse.ts pncp.ts cnpj.ts transparencia.ts precos.ts wikidata.ts noticias.ts vinculos.ts
  rules/index.ts          motor: Rule<K>{id, aplicaA, check(ctx) → Finding|null}; runRules(contexto)
  data.ts                 loaders de data/ (fs), parser de frontmatter
app/
  page.tsx                home
  politicos/ deputado/[id] senador/[codigo]
  candidatos/ [ano]/[uf]/[id]
  contratos/ [cnpj]/[ano]/[seq]
  empresas/ [cnpj]
  precos/  radar/  casos/[slug]  apis/  contribuir/  sobre/  buscar/
components/ ui.tsx ficha.tsx Header Footer Logo
scripts/  validar-dados.mjs  gerar-catmat.mjs
```

## Fluxo de uma ficha (deputado)
1. `getDeputado(id)` → identidade.
2. Em paralelo (`Promise.all` + `safe`): despesas CEAP do ano (todas as páginas), órgãos, frentes, proposições (amostra), sessões deliberativas do plenário no período, eventos do deputado, votações do plenário, discursos, mandatos externos, histórico, ocupações, notícias (Google News RSS), Wikidata (busca → claims P39/P102), emendas (se chave).
3. Derivações: `analisarCEAP` (por tipo/fornecedor/mês, concentração), presença = |eventos ∩ sessões| / |sessões|, coerência = votos iguais à orientação do partido nas últimas nominais, timeline = união de fontes ordenada.
4. `runRules("deputado", ctx)` → red flags com evidência factual.
5. Render com `<Source>` em cada bloco e `coletado em` no rodapé.

## Contextos do motor de regras
`contrato` (PNCP + empresa + itens + sanções) · `contratacao` (licitação/dispensa) · `deputado` (CEAP + análise) · `empresa` (Receita + contratos + sanções) · `candidato` (TSE + prestação + eleições anteriores). Novos contextos: adicionar em `lib/rules/types.ts`.

## Cache e limites
- `revalidate` por fonte (10 min contratos, 30 min CEAP, 1 h fichas, 24 h referências).
- `maxDuration = 60` nas páginas pesadas; toda fonte falha isoladamente (`safe`) e a UI mostra o erro da fonte, nunca 500.
- PNCP `/api/search` exige UA de navegador (feito no fetcher). Câmara `/despesas` teve instabilidade em 17/08/2026 (retorna vazio) — fallback documentado (arquivos anuais).

## Banco de dados (v2) — índice derivado, não fonte da verdade

Postgres (Neon, região sa-east-1) entra **só** para o que não cabe em uma requisição: cruzamentos nacionais
(doador × fornecedor), séries históricas (cota, presença, leis por autor), busca e alertas. Regras:

1. Toda linha guarda `fonte_url` + `coletado_em`. Se o banco sumir, o site continua de pé com as APIs ao vivo.
2. Só jobs em lote escrevem (GitHub Actions). O app **lê**; nunca grava.
3. `lib/db.ts` devolve `null` sem `DATABASE_URL` — o app funciona igual sem banco.
4. Schema em `lib/db.ts` (`SCHEMA_SQL`), aplicado com `npm run db:migrar`.

Tabelas: `derivado_meta`, `doacao`, `fornecedor_contratos`, `doador_fornecedor`, `cota_parlamentar`.

## Roadmap técnico
- **Jobs em lote** (GitHub Actions cron → `data/derivados/`): CEAPS Senado (CSV anual), presença consolidada, leis por autor (varrer tramitação), média de gasto por bancada/UF, DataJud por nome, doadores × fornecedores.
- **v2**: Supabase (auth opcional, anotações, alertas), busca full-text (Meilisearch), grafo de vínculos.
- **v3**: federação (instâncias por estado/TCE), assinatura de dados (proveniência), espelho IPFS/Software Heritage.
