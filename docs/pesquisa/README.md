# Pesquisa de fundação (2026-08-17/18)

Material produzido por agentes de pesquisa (Claude) **com teste real de endpoints via curl** e revisado pelo fundador. Serve de base estendida para os docs oficiais em `docs/`. Onde há divergência, vale o doc oficial; onde um dado não pôde ser verificado, o próprio arquivo diz.

- `dossie-juridico.md` — base legal, riscos, eleitoral 2026, LGPD (versão estendida de `../JURIDICO.md`)
- `threat-model.md` — STRIDE + checklist GitHub/Vercel (estendida de `../THREAT-MODEL.md`)
- `politica-editorial.md` — regras editoriais (estendida de `../POLITICA-EDITORIAL.md`)
- `ficha-360-spec.md` + `ficha-360-endpoints.json` — spec completa da Ficha 360 (dimensões, fórmulas, endpoints testados, modelo de dados)
- `projetos-semelhantes-br.md` — Serenata/Rosie (regras), OPS, Querido Diário, Brasil.io, Base dos Dados, robôs TCU/CGU/TCEs, o que reusar
- `notas-bases-A.md`, `notas-bases-B.md` — as 79 bases públicas listadas pelo fundador, família a família
- `notas-midia.md` — pipeline de coletânea de notícias e agregadores cívicos

Os JSONs de APIs gerados nessa pesquisa foram importados para `data/apis/` (após normalização de schema e deduplicação) e aparecem em `/apis` com o status testado e a data.
