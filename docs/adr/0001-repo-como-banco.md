# ADR 0001 — Repositório como banco de dados na v1
Data: 2026-08-18 · Status: aceito

**Contexto.** Projeto comunitário anticorrupção precisa de trilha de auditoria, revisão por pares e resistência a manipulação; não pode expor PII de contribuidores; começa sem equipe de operações.

**Decisão.** Na v1, todo dado editável pela comunidade vive em arquivos versionados (`data/`), validados na CI, revisados por PR. Dados oficiais são lidos ao vivo das APIs (server-side, cache). Sem banco, sem login.

**Consequências.** + auditoria nativa (git), + zero PII, + backup trivial, + contribuição sem cadastro. − escala de escrita limitada (PRs), − sem personalização/alertas (v2 com Supabase), − índices grandes precisam de scripts (`data/derivados/`).
