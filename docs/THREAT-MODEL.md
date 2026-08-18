# Threat model (v1)

| Ativo | Ameaça | Impacto | Prob. | Controle | Dono |
|---|---|---|---|---|---|
| Integridade de `data/` (regras/casos/APIs) | poisoning por PR malicioso; edição de limiar para poupar/atacar alguém | alto | média | branch protection; 2 aprovações em `data/casos`; CODEOWNERS; CI valida schema/linguagem/CPF; diff público | mantenedores |
| Código/regras | supply chain (npm), typosquatting, sequestro de conta GitHub/Vercel | alto | baixa-média | lockfile; dependabot; secret scanning; 2FA obrigatório; ≥3 mantenedores; deploy só da `main` | mantenedores |
| Chaves (`PORTAL_TRANSPARENCIA_KEY`) | vazamento → abuso de rate limit/atribuição | médio | baixa | só env de servidor; nunca no cliente; rotação | mantenedores |
| Disponibilidade | DDoS/scraping abusivo quando viralizar; APIs de origem fora do ar | médio | alta | cache ISR; timeouts; `safe()`; WAF/rate limit Vercel; o repo é o backup do site | infra |
| Reputação | deepfake/print falso "do Monitor"; homônimo exibido como se fosse o político | alto | média | cada número linka a fonte; aviso de homônimo; direito de resposta; changelog público | editorial |
| Contribuidores/denunciantes | doxxing, assédio, SLAPP | alto | média | v1 sem login/PII; contribuição por conta anônima permitida; canal privado via Security Advisories; orientação a não enviar dado sigiloso; nunca prometer anonimato que não podemos garantir | mantenedores |
| Citados | exposição indevida (dado sensível, CPF completo) | alto | baixa | CI bloqueia CPF; política editorial; revisão dupla; remoção rápida com registro | editorial |
| Legal | ordem judicial de remoção; notificações | médio | média | fluxo documentado; log público de moderação (sem dado sensível); entidade jurídica (roadmap) | mantenedores |

## Checklist de configuração (GitHub/Vercel)
- [ ] Branch protection `main`: PR obrigatório, 1 aprovação geral, "Require review from Code Owners", status check `validar` obrigatório, sem force-push.
- [ ] Ruleset extra: 2 aprovações para `data/casos/**`.
- [ ] Secret scanning + push protection; Dependabot alerts/updates.
- [ ] 2FA obrigatório para todos com write.
- [ ] Vercel: env `PORTAL_TRANSPARENCIA_KEY` só em Production/Preview (server); Attack Challenge Mode disponível para incidentes; headers de segurança (CSP/HSTS) via `next.config.ts` (roadmap imediato).
- [ ] Backup: espelho do repositório (GitLab/Codeberg) + Software Heritage (roadmap).
- [ ] Runbook de incidente: quem responde, em quanto tempo, como comunicar (docs/RUNBOOK.md — roadmap).

Referências: OWASP ASVS/Top 10, OpenSSF Scorecard, NIST CSF 2.0; práticas de OKBR (Querido Diário/Serenata) e Transparência Brasil.
