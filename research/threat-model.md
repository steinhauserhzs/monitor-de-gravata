# Threat Model — Monitor de Gravata

> Modelo de ameaças (STRIDE) para um app open source que publica fichas de políticos, red flags de contratos e casos comunitários, em pleno ano eleitoral (04/10/2026). Complementa `dossie-juridico.md`. Data: 2026-08-18.

## 0. Premissas e ativos

**Superfície:** repositório público no GitHub (código + `data/` versionado + `data/casos/`), deploy estático/SSR na Vercel, jobs de coleta em APIs públicas, canal de denúncia, domínio, contas dos mantenedores.

**Ativos (ordem de criticidade):**
1. **Integridade dos dados publicados** (uma ficha errada = dano a terceiro + risco jurídico + perda de confiança irrecuperável).
2. **Reputação/neutralidade** do projeto.
3. **Segurança pessoal e jurídica** dos mantenedores e contribuidores.
4. **Identidade de denunciantes** (Lei 13.608/2018).
5. Disponibilidade do site nas semanas da eleição.
6. Contas/segredos (GitHub org, Vercel, DNS, chaves de API).
7. Histórico/auditabilidade (git + logs de takedown).

**Adversários prováveis:** campanhas e assessorias (interesse em apagar/plantar), militância organizada (brigading, denúncias em massa, falsas contribuições), empresas citadas (SLAPP), oportunistas (defacement, phishing de mantenedores), bots de scraping/DDoS, e o **erro interno honesto** (o mais provável de todos).

## 1. Tabela STRIDE

Prob.: A=alta, M=média, B=baixa. Impacto: A/M/B.

| Ativo | Ameaça (STRIDE) | Descrição | Impacto | Prob | Controle |
|---|---|---|---|---|---|
| Dados `data/` | **S**poofing | Contribuidor falso (conta nova, sockpuppet) submete PR com "fonte" forjada ou link para PDF adulterado hospedado fora de domínio oficial | A | A | Fontes primárias só de allowlist de domínios (`.gov.br`, `.jus.br`, `.leg.br`, `.tse.jus.br`, PNCP, TCU/TCEs); CI rejeita `fonte_url` fora da lista; 2 reviews em `data/`; commits assinados; hash SHA-256 do documento-fonte armazenado |
| Dados `data/` | **T**ampering | Alteração maliciosa/erro em campo (`status_processual`, CNPJ, valor) via PR "inofensivo" ou via bot de coleta comprometido | A | A | Schema JSON validado no CI (`ajv`), diff semântico obrigatório no PR (`scripts/diff-data`), CODEOWNERS em `data/**`, branch protection, testes de consistência (CNPJ dígito verificador, número CNJ válido, datas), revisão humana de toda mudança em campos sensíveis |
| Casos comunitários | Tampering / Spoofing | Caso plantado contra adversário às vésperas da eleição; ou "caso" verdadeiro mas com homônimo | A | A | Ciclo de vida de caso com 2 aprovações independentes + checklist editorial (ver `politica-editorial.md`); congelamento 15/09–30/10 exceto correções; identidade por CPF parcial/CNPJ/SQ_CANDIDATO |
| Denunciantes | **I**nformation disclosure | Vazamento de identidade de quem enviou caso/denúncia (metadados, IP em logs Vercel, e-mail em issue) | A | M | **Não** operar canal próprio de denúncia sigilosa no MVP: orientar Fala.BR (Lei 13.608/2018) e ouvidorias; se houver formulário, sem coleta de IP/UA (desligar analytics na rota), sem anexos que preservem EXIF, chave PGP pública do projeto publicada; issues de caso **nunca** com dados do remetente |
| Terceiros citados | Information disclosure | PII além do necessário (CPF completo, endereço, parentes menores) copiada de fontes brutas | A | M | Lint de PII no CI (regex CPF completo, e-mail pessoal, telefone); campo `cpf` só parcial (`***.123.456-**`); revisão de dumps antes de commit; sem dados de saúde/sensíveis |
| Mantenedores | Information disclosure / doxxing | Exposição de identidade, endereço, empregador de voluntários; intimidação | A | M | Titularidade em entidade jurídica; contribuição pseudônima permitida; e-mails de commit `noreply`; sem WHOIS pessoal no domínio (privacy) |
| Site / mantenedores | **R**epudiation | "Nunca dissemos isso" / "vocês apagaram a prova" — sem trilha auditável, o projeto não consegue provar boa-fé nem o adversário provar má-fé | M | M | Git como log imutável; `TAKEDOWN-LOG.md` público (data, URL, motivo, decisão, tempo de resposta); snapshots periódicos no Software Heritage (https://archive.softwareheritage.org/save/) e Wayback (https://archive.org/); commits assinados (GPG/SSH) |
| Conta GitHub/Vercel/DNS | Spoofing / **E**levation of privilege | Phishing de mantenedor, token vazado, GitHub App maliciosa, dependência comprometida | A | M | 2FA obrigatório na org (hardware key para owners), secret scanning + push protection, Dependabot + `npm audit` no CI, `pnpm` com lockfile e `--frozen-lockfile`, permissões mínimas de token, revisão de GitHub Apps, deploy só de `main` protegido |
| Pipeline de coleta | Tampering | API pública muda formato/retorna erro e o job publica zeros ou "sem registros" (falso negativo = "ficha limpa" indevida) | A | A | Coleta grava `status_coleta` (`ok`/`erro`/`parcial`) por fonte; UI mostra "não localizado em X, Y em DATA" e nunca "sem registros"; alertas de queda de volume (>30% variação = bloqueio de merge) |
| Site | **D**enial of service | DDoS/brigading nas 72h antes da eleição; abuso de rotas de busca/API | M | M | Estático/ISR na Vercel (edge cache), rate limit por IP nas rotas dinâmicas (`/api/*`), sem endpoint de busca full-text sem cache, WAF da Vercel, mirror estático (IPFS/GitHub Pages) documentado |
| Site | Tampering (supply chain) | XSS via conteúdo de terceiros (casos), scripts externos, dependência com backdoor | A | B | CSP estrita (`default-src 'self'`; sem inline; nonce), HSTS + preload, `X-Content-Type-Options`, sanitização de markdown (`rehype-sanitize`), sem scripts de terceiros (analytics self-hosted ou nenhum), SRI se algo externo |
| Denúncias falsas em massa | Denial of service (editorial) | Militância entope o fluxo de takedown com pedidos frívolos para paralisar o time | M | A | Formulário de takedown estruturado (URL, campo, alegação, documento); triagem: só pedidos com documento/URL específica abrem prazo de 72h; relatório de transparência trimestral |
| Reputação | Repudiation / Spoofing | Clone do site com dados adulterados ("monitordegravata.com.br" falso), ou uso da marca em propaganda | A | M | Domínio + variantes registrados; assinatura dos datasets (checksum publicado); página "como verificar que este é o oficial"; cláusula de marca no README/CC-BY (atribuição não é endosso) |
| Contribuidores | Elevation of privilege | Maintainer "adormecido"/comprado aprova PR malicioso sozinho | A | B | 2 aprovações obrigatórias em `data/**` e `data/casos/**` de CODEOWNERS distintos; rotação/remoção de inativos; `require review from Code Owners`; `dismiss stale reviews` |
| Usuários | Information disclosure | Analytics/trackers vazam interesse político do visitante | M | M | Sem cookies de terceiros; sem Google Analytics; métricas agregadas (Vercel Analytics sem PII ou nenhuma); política de privacidade curta |
| Conteúdo gerado por IA | Tampering / desinformação | Resumo automático alucina ("condenado" onde era "réu"), ou geração de imagem/voz de candidato | A | M | IA só para **rascunho de resumo**, nunca para campos estruturados; rótulo "resumo gerado por IA — confira o original"; **proibição absoluta** de gerar/hospedar mídia sintética com imagem/voz de candidato (Res. TSE 23.610 art. 9º-C e alterações 2024/2026) |

## 2. Checklist de segurança operacional (GitHub + Vercel)

### GitHub (organização, não conta pessoal)
- [ ] Repositório em **organização** com 2+ owners; 2FA obrigatório; owners com chave de hardware.
- [ ] **Branch protection em `main`**: PR obrigatório; **2 aprovações** para paths `data/**` e `data/casos/**` (via CODEOWNERS + "require review from Code Owners"); 1 aprovação para código; `dismiss stale approvals`; `require status checks` (schema, lint PII, testes, build); `require linear history`; sem force-push; admins incluídos.
- [ ] **CODEOWNERS**: `data/** @org/curadoria-dados`, `data/casos/** @org/curadoria-casos`, `.github/** @org/infra`, `SECURITY.md TAKEDOWN-LOG.md @org/juridico`.
- [ ] **Commits assinados** obrigatórios (`require signed commits`) — GPG ou SSH signing.
- [ ] **Secret scanning + push protection** ativos; **Dependabot** (security + version updates); code scanning (CodeQL) semanal.
- [ ] `SECURITY.md` com canal de reporte de vulnerabilidade (e-mail + GitHub private vulnerability reporting) e SLA.
- [ ] Templates de issue: `caso-novo.yml`, `correcao-de-dado.yml`, `takedown.yml`, `direito-de-resposta.yml` — todos **sem** campos de dados pessoais do remetente.
- [ ] Actions com permissões mínimas (`permissions: contents: read`), actions pinadas por SHA, sem `pull_request_target` com checkout de fork.
- [ ] CI: validação de schema (ajv), lint de linguagem proibida, lint de PII, validação de CNPJ/número CNJ/datas, allowlist de domínios em `fonte_url`, verificação de link (HEAD 200) para fontes novas.
- [ ] Rotina: revisar membros/apps trimestralmente; remover inativos.

### Vercel / runtime
- [ ] Projeto em **team** da entidade, não conta pessoal; deploy automático só de `main`; previews com proteção por senha/SSO.
- [ ] Headers: `Content-Security-Policy` estrita (sem `unsafe-inline`; nonce para Next), `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` mínima, `X-Frame-Options: DENY`.
- [ ] **Rate limit** em `/api/*` (Vercel WAF/edge middleware ou upstash-ratelimit); cache/ISR agressivo nas páginas de ficha.
- [ ] Sem logs com IP em rotas de denúncia/takedown; log retention mínima; sem analytics de terceiros.
- [ ] Segredos só em env vars da Vercel; rotação semestral; nenhum segredo em `NEXT_PUBLIC_*`.
- [ ] Domínio com DNSSEC, CAA, WHOIS privacy; variantes `.com.br/.org/.app` registradas ou monitoradas.
- [ ] Página `/verificar` explicando como checar autenticidade (domínio oficial, checksum dos datasets, repositório).

### Dados e PII
- [ ] Nenhum CPF completo, endereço residencial, telefone, e-mail pessoal, dado sensível (LGPD art. 5º, II) em `data/`.
- [ ] Todo registro com `fonte_url`, `orgao_emissor`, `data_documento`, `data_coleta`, `hash_documento` (quando PDF).
- [ ] Datasets publicados com checksum e licença (CC-BY 4.0) e `CHANGELOG` de dados.

### Canal seguro de denúncia
- [ ] MVP: **não** prometer sigilo que não se pode garantir; orientar Fala.BR e ouvidorias (Lei 13.608/2018) para denúncias sigilosas; o projeto recebe **indicações de documentos públicos**, não segredos.
- [ ] Se houver formulário: sem coleta de IP/UA, sem cookies, sem anexos com metadados (strip EXIF), chave PGP publicada, orientação de OPSEC (não usar dispositivo do trabalho).

### Takedown / correção em 72h com log público
- [ ] Rota `/takedown` + template de issue; acusar recebimento em 24h; decisão em **72h** (remover, corrigir, manter com justificativa, ou publicar resposta — Lei 13.188/2015).
- [ ] `TAKEDOWN-LOG.md` público: id, data do pedido, URL/campo, tipo (erro factual / homônimo / PII / decisão judicial / direito de resposta / outro), decisão, data da decisão, hash do commit. Sem dados do solicitante.
- [ ] Ordens judiciais: cumprir no prazo da ordem; registrar no log; conteúdo idêntico a algo já declarado ilícito judicialmente sai mediante notificação (tese STF Temas 987/533).
- [ ] Relatório de transparência trimestral (contagem por tipo/decisão) — atende ao dever de autorregulação fixado pelo STF.

### Backups e resiliência
- [ ] **Software Heritage**: acionar "Save code now" a cada release (https://archive.softwareheritage.org/save/); badge SWHID no README.
- [ ] Wayback Machine (https://archive.org/) das páginas principais antes/depois de mudanças grandes.
- [ ] Mirror estático (export) publicado em IPFS/GitHub Pages; CID publicado no README; datasets também no Zenodo/dataverse com DOI (opcional).
- [ ] Bus factor: 3+ pessoas com acesso a DNS/Vercel/GitHub; runbook de sucessão.

## 3. Cenários prioritários (top 5) e resposta

1. **Homônimo publicado** → detectar (denúncia/CI) → despublicar em <2h (hotfix em `main` com 2 reviews expressas) → registrar em `TAKEDOWN-LOG` → post-mortem público.
2. **PR de dados envenenado nas 2 semanas pré-eleição** → congelamento editorial 15/09–30/10 (só correções); toda mudança em `data/` exige 2 owners e link primário verificado por HEAD 200 no CI.
3. **Coleta quebra e ficha aparece "limpa"** → status por fonte + texto "não localizado em X em DATA" + alerta de variação de volume.
4. **Conta de mantenedor comprometida** → 2FA hardware, tokens curtos, revogação em runbook, deploy só de `main` protegido, monitoramento de audit log da org.
5. **SLAPP/onda de ações** → entidade jurídica titular, contribuidores pseudônimos, log de boa-fé, direito de resposta em 72h, rede pro bono pré-mapeada.
