# Política de segurança

## Reportar vulnerabilidade

Use **GitHub Security Advisories** (aba *Security → Report a vulnerability*) neste repositório — o relato fica privado até a correção.
Se não puder usar GitHub, abra uma issue pedindo um canal de contato sem detalhar a falha; um mantenedor responde com endereço e chave PGP.

Prazo-alvo: confirmação em 72h; correção de alta severidade em 14 dias. Não publique antes da correção (divulgação coordenada). Não é necessário provar exploração em produção — descrição + passos bastam.

## Escopo

- Este código (Next.js) e o deploy em `monitor-de-gravata.vercel.app`.
- Integridade dos dados em `data/` (poisoning via PR, bypass da CI).
- Vazamento de chave (`PORTAL_TRANSPARENCIA_KEY`) ou de dados de contribuidores.

Fora de escopo: as APIs de terceiros/governo (reporte ao órgão), rate limit deles, indisponibilidade das fontes.

## Postura

- v1 sem login, sem PII, sem chave no cliente; fetch só server-side.
- Branch protection na `main`; 2 aprovações para `data/casos/`; CODEOWNERS; CI valida schema, linguagem e CPF.
- Dependabot + secret scanning ativos; lockfile commitado.
- Threat model completo: [docs/THREAT-MODEL.md](docs/THREAT-MODEL.md).

## Denúncias (não são vulnerabilidades)

Suspeita de irregularidade pública **não** vai por aqui: abra um *caso* (issue "caso") com fontes públicas, ou — se envolver risco pessoal — use os canais oficiais (Fala.BR/CGU, MPF, TCU, MP do seu estado). Não nos envie documentos sigilosos.
