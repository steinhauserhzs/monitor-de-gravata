# Ficha 360 — dimensões, fontes, status

Legenda: **auto** = ao vivo hoje · **chave** = requer `PORTAL_TRANSPARENCIA_KEY` · **lote** = job em lote (roadmap) · **comun.** = comunidade com fonte

| Dimensão | Deputado | Senador | Candidato (TSE) | Fonte / endpoint | Status |
|---|---|---|---|---|---|
| Identidade, foto, partido, UF | ✓ | ✓ | ✓ | Câmara `/deputados/{id}` · Senado `/senador/{cod}` · TSE `/candidatura/buscar/...` | auto |
| Linha do tempo (mandatos, filiações, ocupações) | ✓ | ✓ | ✓ (candidaturas) | Câmara `/historico`, `/mandatosExternos`, `/ocupacoes` · Senado `/mandatos`, `/filiacoes` · Wikidata P39/P102 | auto |
| Gastos (CEAP/CEAPS por tipo/fornecedor/mês + red flags) | ✓ | ✓ | — | Câmara `/despesas?ano=` · Senado adm-dadosabertos `/senadores/despesas_ceaps/{ano}` e `/senadores/{cod}/recursos-utilizados` | auto |
| Presença | ✓ (plenário) | ✓ (registrou voto/presente/missão) | — | Câmara `/eventos` × `/eventos?codTipoEvento=110&idOrgao=180` · Senado `/votacoes` | auto |
| Votações + coerência com partido | ✓ (últimas 10 nominais) | ✓ (histórico) | — | Câmara `/votacoes/{id}/votos`, `/orientacoes` · Senado `/votacoes` | auto |
| Produtividade (proposições por tipo) | ✓ (amostra) | ✓ (autorias) | — | Câmara `/proposicoes?idDeputadoAutor` · Senado `/autorias` | auto |
| Leis de autoria transformadas em norma | — | — | — | varrer tramitação de cada PL (Câmara `/proposicoes/{id}`) | lote |
| Comissões, cargos, frentes | ✓ | ✓ | — | Câmara `/orgaos`, `/frentes` · Senado `/comissoes` | auto |
| Discursos | ✓ | — | — | Câmara `/discursos` | auto |
| Emendas parlamentares (valor, destino) | ✓ | — | — | Portal Transparência `/emendas?nomeAutor` | chave |
| Patrimônio declarado + evolução | — | — | ✓ | TSE `bens[]` por eleição, casamento por nome/UF | auto |
| Financiamento (origem das receitas) | — | — | ✓ | TSE `/prestador/consulta/...` (2026: a partir de set.) | auto |
| Doadores nominais × fornecedores públicos | — | — | — | TSE receitas detalhadas × PNCP/Portal | lote |
| Processos (TSE: cassação; certidões) | — | — | ✓ | TSE `processosCassacao`, `arquivos` | auto |
| Processos judiciais (DataJud) | — | — | — | CNJ DataJud (chave pública) por nome/CPF mascarado | lote |
| Sanções em empresas ligadas (CEIS/CNEP) | — | — | — | QSA (Receita) × Portal Transparência | chave + lote |
| Vínculos a verificar (sobrenome × servidores/fornecedores/candidatos) | ✓ | — | ✓ | heurística + links (Portal, PNCP, Querido Diário) + listas TSE; a API `/servidores` do Portal exige órgão/CPF (sem busca por nome) | auto (hipótese) |
| Equipe de gabinete / nepotismo | link | link | — | Câmara pessoal-gabinete · Senado transparência | comun. |
| Notícias (manchetes) | ✓ | ✓ | ✓ | Google News RSS | auto |
| Checagens (ClaimReview) | — | — | — | Google Fact Check Tools API | roadmap |
| Propaganda paga | — | — | — | Meta Ad Library API (token) | roadmap |
| Votações-chave marcadas com fonte | — | — | — | comunidade (`data/votacoes-chave.json`) | comun. |
| Promessas × entregas | — | — | — | comunidade com fonte | comun. |
| Ranking objetivo (fórmula pública) | — | — | — | métricas acima | roadmap |
| Comparar dois políticos | — | — | — | UI | roadmap |
| Perguntas geradas pelos dados | — | — | ✓ | red flags + lacunas | auto |

Modelo de dados canônico (TypeScript) para a v2 está em `lib/` conforme os tipos por fonte; a unificação (`Politico`, `Mandato`, `Voto`, `Despesa`, `Bem`, `Doacao`, `Processo`, `Sancao`, `Noticia`, `EventoTimeline`, `Vinculo{tipo, grau_confianca, fonte, verificado_por}`) entra com os jobs em lote.
