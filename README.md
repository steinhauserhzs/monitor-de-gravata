<p align="center">
  <img src="public/gravata.svg" width="72" alt="Gravata vermelha — símbolo do Monitor de Gravata" />
</p>

<h1 align="center">Monitor de Gravata</h1>
<p align="center"><em>o pesadelo de Brasília</em></p>

<p align="center">
  <strong>Portal da Transparência 2.0, open source e comunitário.</strong><br/>
  Ficha 360 de políticos e candidatos · Radar de contratos com red flags · Comparador de preços · Ficha da empresa · Catálogo de APIs públicas · Casos documentados pela comunidade
</p>

<p align="center">
  <a href="https://monitor-de-gravata.vercel.app">🌐 monitor-de-gravata.vercel.app</a> ·
  <a href="#-comece-a-contribuir-em-10-minutos">🤝 Contribuir</a> ·
  <a href="#-módulos">🧭 Módulos</a> ·
  <a href="docs/TESE.md">📜 Tese</a> ·
  <a href="docs/ARQUITETURA.md">🏗️ Arquitetura</a> ·
  <a href="docs/POLITICA-EDITORIAL.md">⚖️ Política editorial</a>
</p>

<p align="center">
  <img alt="Licença MIT" src="https://img.shields.io/badge/c%C3%B3digo-MIT-141210?style=flat-square" />
  <img alt="Dados CC-BY 4.0" src="https://img.shields.io/badge/dados-CC--BY%204.0-1f6f50?style=flat-square" />
  <img alt="Sem partido" src="https://img.shields.io/badge/partido-nenhum-c8102e?style=flat-square" />
  <img alt="Fontes primárias" src="https://img.shields.io/badge/fontes-100%25%20oficiais-1f4e79?style=flat-square" />
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-141210?style=flat-square" />
</p>

---

> **Nada aqui é acusação.** Todo dado exibido vem de uma API ou arquivo de órgão público, com link e data de coleta. Red flags são sinais objetivos calculados por regras públicas — perguntas, não sentenças. Hipóteses da comunidade são marcadas como hipóteses, revisadas por pares e têm direito de resposta. Ninguém é culpado antes do trânsito em julgado.

## Por que existe

O Brasil publica mais dado público do que qualquer cidadão consegue ler: milhões de notas da cota parlamentar, contratos de 5.570 prefeituras no PNCP, bens e doações de cada candidato no TSE, preços homologados de cada compra federal, processos no DataJud. **O problema nunca foi falta de dado — é que ele está espalhado, sem cruzamento e sem gente olhando.**

O Monitor de Gravata é a camada que **cruza** e **convida**:

1. **Dado oficial entra automático** — APIs públicas consultadas ao vivo (Câmara, Senado, TSE, PNCP, Receita, CGU, Compras.gov.br, Wikidata).
2. **Regras calculam sinais** — red flags como código, com fórmula pública, severidade e fonte metodológica (OCP, Serenata/Rosie, OPS, TCU, CGU).
3. **Comunidade documenta** — casos com fontes primárias, abertos por pull request, revisados por duas pessoas.
4. **Quem é citado responde** — direito de resposta em 72h, registrado publicamente no mesmo lugar.
5. **Tudo fica no git** — o repositório *é* o banco de dados: histórico imutável de quem mudou o quê, quando e por quê.

Não temos lado. A mesma regra roda para todo partido, todo órgão, toda empresa.

## 🧭 Módulos

| # | Módulo | O que faz hoje | Fontes ao vivo |
|---|--------|----------------|----------------|
| 01 | **[Ficha 360 do político](https://monitor-de-gravata.vercel.app/politicos)** | Deputados e senadores: cota parlamentar nota a nota (por tipo, fornecedor, mês), **presença** em sessões deliberativas, **como votou** nas últimas votações nominais e coerência com o partido, **produtividade** (proposições por tipo), comissões e frentes, **linha do tempo** (mandatos, filiações, ocupações + Wikidata), emendas (com chave), **vínculos a verificar** por sobrenome (hipóteses), **notícias** e red flags | Câmara API v2 · Senado Dados Abertos · Wikidata · Google News RSS · Portal da Transparência (chave) |
| 02 | **[Manual do Candidato 2026](https://monitor-de-gravata.vercel.app/candidatos)** | Todo candidato registrado no TSE por UF/cargo: situação, bens item a item, **evolução patrimonial** vs. eleições anteriores, receitas por origem (fundo/PF/próprios), processos e certidões, outros candidatos com o mesmo sobrenome na UF, notícias, perguntas geradas pelos dados | TSE DivulgaCandContas · Wikidata · Google News |
| 03 | **[Radar de contratos](https://monitor-de-gravata.vercel.app/contratos)** | Contratos, dispensas e inexigibilidades de União, estados e municípios publicados no PNCP; busca por objeto/órgão/CNPJ; página do contrato cruza fornecedor com a Receita (idade do CNPJ, capital, sócios, situação) e sanções; itens com preço unitário → comparador | PNCP (consulta, detalhe, busca) · BrasilAPI/Receita · CGU (chave) |
| 04 | **[Ficha da empresa](https://monitor-de-gravata.vercel.app/empresas)** | CNPJ, QSA, CNAE, capital, situação; contratos e editais no PNCP; contratos federais e sanções CEIS/CNEP (chave); red flags | BrasilAPI/minhareceita · PNCP · Portal da Transparência (chave) |
| 08 | **[Compra/licitação](https://monitor-de-gravata.vercel.app/precos)** | Clicando em qualquer preço você abre a compra: itens, unidades, quantidades, fornecedor, objeto da licitação, links para o acompanhamento no Compras.gov.br e para os editais/contratos correspondentes no PNCP | Compras.gov.br · PNCP |
| 07 | **[Comparador de preços](https://monitor-de-gravata.vercel.app/precos)** | *"Esse notebook de R$ 10 mil custa R$ 4 mil em outros órgãos?"* — busca em 15 mil padrões CATMAT e mostra os preços realmente homologados (fornecedor, marca, órgão, UF, data) com mediana/quartis; classifica o preço informado (normal / atenção / alto / muito alto) | Compras.gov.br Dados Abertos (módulo pesquisa de preço) |
| 05 | **[Motor de red flags](https://monitor-de-gravata.vercel.app/radar)** | 81 regras catalogadas (24 automatizadas em código, 1 no comparador, 56 no backlog): contratação, parlamentar, eleitoral, empresa, servidor, obra, municipal — cada uma com lógica, dados, APIs, fonte e severidade | `data/red-flags.json` + `lib/rules/index.ts` |
| 06 | **[Casos da comunidade](https://monitor-de-gravata.vercel.app/casos)** | Hipóteses documentadas em Markdown com frontmatter, ciclo de vida (rascunho → revisão → publicado → contestado → corrigido/arquivado), fontes com data de coleta, direito de resposta | `data/casos/*.md` |
| — | **[Catálogo de APIs](https://monitor-de-gravata.vercel.app/apis)** | Todas as fontes de dado público que o Monitor conhece, com URL base, docs, auth, endpoints-chave, utilidade anticorrupção e **status testado com data** | `data/apis/*.json` |

## 🧠 Como o "cérebro vivo" funciona

```
┌────────────────────────── repositório (fonte da verdade) ──────────────────────────┐
│  data/apis/*.json        catálogo de APIs (comunidade adiciona/testa)              │
│  data/red-flags.json     regras legíveis (comunidade propõe)                       │
│  lib/rules/index.ts      regras executáveis (mesmo id; devs implementam)           │
│  data/casos/*.md         hipóteses com fontes (revisão dupla, direito de resposta) │
│  data/derivados/*.json   índices gerados por script (ex.: 15 mil PDMs do CATMAT)   │
│  scripts/validar-dados   CI: schema, ids únicos, linguagem, CPF proibido           │
└─────────────────────────────────────┬──────────────────────────────────────────────┘
                                      │ build / ISR
┌─────────────────────────────────────▼──────────────────────────────────────────────┐
│  app (Next.js 16, server components)                                               │
│  lib/camara · senado · tse · pncp · cnpj · transparencia · precos · wikidata ·     │
│  noticias · vinculos → fetch server-side com cache, timeout, UA — sem CORS,        │
│  sem chave no cliente                                                              │
│  runRules(contexto) → Finding[] { regra, evidência factual, severidade, fonte }    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

* **Sem banco de dados na v1.** O repo é o banco. Sem login, sem PII. Isso é uma escolha de segurança e de governança (ver [docs/THREAT-MODEL.md](docs/THREAT-MODEL.md)).
* **Sem IA gerando "fatos".** IA (agentes/LLM) é usada apenas para *pesquisar e testar* fontes e para *sugerir* regras — tudo o que aparece no site é dado oficial ou regra determinística com fonte. Ver [docs/POLITICA-EDITORIAL.md](docs/POLITICA-EDITORIAL.md).
* **Banco (v2, opcional):** `DATABASE_URL` (Postgres/Neon) guarda apenas **índices derivados** gerados por jobs em lote — cruzamentos nacionais, séries históricas e busca. Sem a variável o app funciona igual, consultando as APIs ao vivo. Schema em `lib/db.ts`, aplicado com `npm run db:migrar`.
* **Chaves opcionais** destravam mais: `PORTAL_TRANSPARENCIA_KEY` (grátis, [cadastro aqui](https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email)) liga sanções CEIS/CNEP, contratos federais por CNPJ e emendas por parlamentar (o endpoint de servidores exige órgão ou CPF — sem busca por nome). `GOOGLE_FACTCHECK_KEY` (Google Cloud, gratuita) liga a aba de **checagens de fatos** com cobertura completa; sem ela o app já mostra checagens via RSS de Aos Fatos e Comprova.

## 🚀 Rodando localmente

```bash
git clone https://github.com/steinhauserhzs/monitor-de-gravata.git
cd monitor-de-gravata
npm install
cp .env.example .env.local   # opcional: PORTAL_TRANSPARENCIA_KEY=...
npm run dev                  # http://localhost:3000
```

Outros comandos: `npm run validar` (valida os dados), `npm run catmat` (regenera o índice CATMAT a partir do Compras.gov.br), `npm run build`.

## 🤝 Comece a contribuir em 10 minutos

Não precisa ser dev. A maior parte do trabalho é JSON, Markdown ou ler um edital com atenção.

| Você é… | Faça isto |
|---|---|
| **Cidadão / leitor** | Viu algo estranho? [Abra um caso](https://github.com/steinhauserhzs/monitor-de-gravata/issues/new?template=caso.yml) com o link e o que viu. |
| **Jornalista / pesquisador** | Transforme uma apuração num caso: copie [`data/casos/0000-modelo-de-caso.md`](data/casos/0000-modelo-de-caso.md), preencha as 5 seções (fato, cruzamento, red flags, o que não sabemos, próximo passo), abra PR. |
| **Contador / auditor / servidor** | [Proponha uma red flag](https://github.com/steinhauserhzs/monitor-de-gravata/issues/new?template=red-flag.yml) com fórmula e limiar (fracionamento, aditivo, sobrepreço…). |
| **Dev** | Implemente uma regra do backlog em [`lib/rules/index.ts`](lib/rules/index.ts); conecte a API da sua câmara municipal (SAPL) ou do seu TCE em [`data/apis/`](data/apis/); ajude nos jobs em lote (CEAPS do Senado, leis aprovadas por autor, DataJud). Ver [CONTRIBUTING.md](CONTRIBUTING.md). |
| **Designer / UX** | Ficha 360 legível para quem não é do ramo; comparação de candidatos; acessibilidade. |
| **Jurídico / segurança** | Revise [POLITICA-EDITORIAL](docs/POLITICA-EDITORIAL.md), [THREAT-MODEL](docs/THREAT-MODEL.md), fluxos de resposta/takedown; ajude a montar a entidade e as parcerias. |

**Regras inegociáveis:** fonte primária ou não entra · linguagem factual (número, data, link; sem adjetivo) · distinguir investigado / réu / condenado 1ª inst. / colegiado / trânsito em julgado · nunca dado sensível, CPF completo, endereço, família não-pública, dado vazado · mesma régua para todos os partidos.

## 🗺️ Roadmap (90 dias)

* **Sprint 1 — agora:** v1 no ar (este repo). Ficha 360 Câmara/Senado, Manual do Candidato 2026, Radar PNCP, Empresas, Comparador de preços, 81 red flags, catálogo de APIs, casos.
* **Sprint 2:** jobs em lote (GitHub Actions → `data/derivados/`): CEAPS do Senado, presença consolidada por legislatura, *leis de autoria transformadas em norma*, votações-chave marcadas pela comunidade, DataJud por nome/CPF mascarado, doadores × fornecedores (TSE × PNCP), média da bancada por UF para benchmark de gastos.
* **Sprint 3:** Ficha para governadores/prefeitos/vereadores via TSE + SAPL das câmaras; grafo de vínculos (partido, empresas, doadores, fornecedores) com grau de confiança; comparar dois políticos; "o que fez pelo meu município"; entidade jurídica, conselho editorial, parcerias, auditoria externa das regras; v2 com Supabase (login opcional, anotações, alertas por e-mail).

Tudo o que ainda não está automatizado aparece marcado como **backlog** no próprio site — nunca como se estivesse pronto.

## 📚 Bases públicas mapeadas

Núcleo verificado hoje: Câmara (API v2), Senado (Dados Abertos), TSE (DivulgaCandContas REST + CKAN + CDN), PNCP (consulta/detalhe/busca), Compras.gov.br (catálogo CATMAT + preços praticados), Receita/CNPJ (BrasilAPI, minhareceita), Portal da Transparência (chave), Querido Diário, Wikidata, Google News RSS. O catálogo completo (federal, legislativo, eleitoral, judiciário, controle, estados, municípios, econômico, sociedade civil) vive em [`data/apis/`](data/apis/) e na página [/apis](https://monitor-de-gravata.vercel.app/apis) — cada entrada com status testado e data. **Se está lá, foi testado. Se não foi testado, está escrito.**

## ⚖️ Base legal (resumo)

LAI 12.527/2011 · Decreto 8.777/2016 · Lei 14.133/2021 (PNCP) · Lei 12.846/2013 · Lei 8.429/92 (c/ 14.230/2021) · LC 135/2010 · Lei 9.504/97 art. 11 · LGPD 13.709/2018 (art. 7º §3º/§4º, art. 23) · CF art. 5º XXXIII/LVII e art. 37 · Lei 13.188/2015 (direito de resposta) · Marco Civil 12.965/2014 (e a decisão do STF sobre o art. 19, jun/2025). Detalhes e limites: [docs/JURIDICO.md](docs/JURIDICO.md).

## 🔐 Segurança

Sem login, sem PII, sem chave no cliente. Branch protection, revisão dupla em `data/casos`, CI que valida schema/linguagem/CPF, dependabot, secret scanning. Reporte vulnerabilidades pelo [SECURITY.md](SECURITY.md). Threat model em [docs/THREAT-MODEL.md](docs/THREAT-MODEL.md).

## 🙏 Ombros de gigantes

Operação Serenata de Amor / Rosie / Jarbas (OKBR), Querido Diário (OKBR), OPS — Operação Política Supervisionada, Brasil.io, Base dos Dados, Ranking dos Políticos, Transparência Brasil, Open Contracting Partnership (red flags), TCU/CGU (Alice e trilhas de risco), Perfil Político. Ver [docs/pesquisa/](docs/pesquisa/) (projetos semelhantes, dossiê jurídico, threat model, spec da Ficha 360, as 79 bases mapeadas).

## 📄 Licenças

Código: [MIT](LICENSE). Dados e textos deste repositório: [CC-BY 4.0](LICENSE-DADOS.md) — cite o órgão de origem e o Monitor. Dados de terceiros mantêm suas licenças (indicadas no catálogo).

<p align="center"><sub>Projeto pessoal de <a href="https://github.com/steinhauserhzs">Hairã Steinhauser</a>, 2026 · sem partido · sem dono · sem anúncio</sub></p>
