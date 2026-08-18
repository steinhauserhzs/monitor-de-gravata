# Governança

## Princípios
1. **Neutralidade verificável** — mesmas regras para todos; sem editorial; rankings só por métrica objetiva com fórmula pública; mudanças de limiar por PR justificado.
2. **Fonte primária ou nada** — dado oficial com link e data; hipóteses marcadas como hipóteses.
3. **Transparência da transparência** — decisões em ADRs (`docs/adr/`), changelog de moderação, métricas públicas (casos abertos/publicados/contestados/corrigidos).
4. **Direito de resposta** — 72h, mesmo destaque, histórico preservado.

## Papéis
- **Mantenedores** (≥3, 2FA obrigatório): merge, releases, segurança, ADRs. Nenhum mantenedor pode ser candidato, dirigente partidário ou assessor de mandato enquanto exercer o papel.
- **Revisores**: aprovam APIs/regras (1) e casos (2). Declaram conflito de interesse por caso.
- **Contribuidores**: qualquer pessoa, por PR/issue.
- **Auditores** (roadmap): externos, revisam anualmente regras e moderação; relatório público.
- **Conselho editorial** (roadmap): 5 pessoas de organizações da sociedade civil/academia/jornalismo, sem filiação partidária ativa; decide contestações não resolvidas.

## Decisões
- Técnicas: PR + revisão. Estruturais: ADR com 7 dias de comentário público.
- Remoções/takedown: registradas em `docs/moderacao/CHANGELOG.md` (o quê, por quê, quem pediu — sem dado sensível).

## Ciclo de vida de caso
`rascunho` → `em-revisao` → `publicado` → (`contestado`) → `corrigido` | `arquivado`. Estados e prazos em [docs/POLITICA-EDITORIAL.md](docs/POLITICA-EDITORIAL.md).

## Financiamento
Sem doação de partido, candidato, campanha ou empresa com contrato público em disputa. Fontes aceitas: doações individuais transparentes, editais de fomento a tecnologia cívica, parcerias com organizações da sociedade civil — todas listadas publicamente.
