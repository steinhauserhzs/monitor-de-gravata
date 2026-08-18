# Política Editorial — Monitor de Gravata

> Texto pronto para ser copiado ao `CONTRIBUTING.md` (seção "Política editorial") e ao `README.md`. Base jurídica em `research/dossie-juridico.md`; controles técnicos em `research/threat-model.md`. Versão 1.0 — 2026-08-18.

## 1. Princípio

O Monitor de Gravata **não acusa, não opina e não recomenda voto**. Ele reúne, organiza e linka **registros públicos oficiais** sobre agentes públicos, candidatos, contratos e empresas, e sinaliza padrões (red flags) por **regras abertas e iguais para todos**. Quem julga é o leitor, o Ministério Público, os tribunais e a Justiça Eleitoral.

Neutralidade aqui é **verificável**, não declarada: mesma regra, mesmo schema, mesma fonte, mesmo destaque visual, para qualquer pessoa ou partido. Não há editorial, coluna de opinião, ranking de "piores" ou "melhores", nem endosso.

## 2. Linguagem obrigatória

- **Fato, não juízo.** Descreva o que o documento oficial diz, com o status exato e a data.
  - Certo: "Réu na ação penal nº 0000000-00.0000.0.00.0000 (TRF-1) por peculato; denúncia recebida em 12/03/2024. Fonte: [link]."
  - Errado: "Desviou dinheiro público."
- **Verbos permitidos:** consta, registra, responde a, foi denunciado por, é réu em, foi condenado em 1º grau por, foi condenado por órgão colegiado por, foi absolvido de, teve contas julgadas irregulares, assinou contrato de, recebeu doação de, foi sancionada por, está impedida de contratar até.
- **Palavras proibidas em qualquer conteúdo do projeto** (bloqueadas por lint no CI): corrupto, ladrão, bandido, criminoso (como adjetivo), desviou, roubou, fraudou (sem "acusado de"/"condenado por" + fonte), esquema, quadrilha, máfia, mafioso, safado, sujo, ficha suja, ficha limpa (como afirmação nossa), "todo mundo sabe", "obviamente", "suspeito" (como adjetivo do projeto), "provavelmente", qualquer emoji.
- **Sem adjetivos, sem advérbios de intensidade, sem manchete.** Títulos são descritivos: "Contrato nº 12/2025 — Prefeitura de X — R$ 1,2 mi — 3 red flags automáticas".
- **Status processual** só com os termos do glossário (dossiê, B.2): investigado, denunciado, réu, absolvido, condenado_1_grau, condenado_colegiado, transitado_em_julgado, arquivado, prescrito, extinta_punibilidade, improbidade_*, contas_irregulares, sancionada. Sempre com **data** e **órgão**.
- **Simetria:** absolvição, arquivamento, reforma, prescrição e resposta do citado entram com o **mesmo destaque** da acusação e são atualizados no mesmo ciclo.
- **"Não localizado" ≠ "não existe":** a UI diz "não localizado nas bases X, Y em DD/MM/AAAA". Nunca "sem processos", "ficha limpa", "nada consta".
- **Red flag é sinal, não conclusão:** todo red flag exibe a regra que o disparou (ex.: "dispensa de licitação acima do limite do art. 75 da Lei 14.133/2021", "fornecedor com CNPJ aberto há menos de 6 meses") e o texto padrão "Indício estatístico; não implica irregularidade. Verifique a fonte."
- **IA:** resumos gerados por IA são permitidos apenas como rascunho para revisão humana e, se publicados, carregam o rótulo "resumo gerado por IA a partir de [documento]; confira o original". IA **nunca** preenche campos estruturados nem gera imagem, áudio ou vídeo de pessoas.

## 3. Fontes: só primárias

**Aceitas** (allowlist no CI; propostas de novas fontes via issue `fonte-nova`):
- Portais oficiais `.gov.br`, `.jus.br`, `.leg.br`, `.mp.br`, `.tc.br`/tribunais de contas, `.def.br`; PNCP/Compras.gov, Portal da Transparência (federal, estaduais, municipais), TSE (DivulgaCand, dados abertos, repositório de prestação de contas), CNJ (DataJud, CNCIAI), CGU (CEIS, CNEP, e-Sanções, Fala.BR), TCU/TCEs, diários oficiais, Câmara/Senado/Assembleias (dados abertos), Receita Federal (CNPJ), Banco Central (quando aplicável).
- Decisões judiciais: link para o inteiro teor no tribunal ou número CNJ + tribunal + data, com PDF hasheado quando disponível.

**Não aceitas como fonte de fato:** notícias, blogs, redes sociais, vídeos, "print", denúncia anônima, wiki, agregadores, IA. Notícia pode ser **contexto** (`tipo: contexto`) com título/veículo/data/link, sem transcrição, e nunca sustenta um status processual ou red flag.

**Cada registro** tem: `fonte_url` (primária), `orgao_emissor`, `data_documento`, `data_coleta`, `hash_documento` (se arquivo), `licenca_fonte`, `status_coleta`.

## 4. Identidade: nunca só pelo nome

- Pessoa: CPF parcial + `SQ_CANDIDATO` (TSE) e/ou título/matrícula funcional mascarados, + cargo/UF/ano. Empresa: CNPJ completo. Processo: número CNJ.
- Se a fonte não permite vincular com segurança (só nome), o registro fica `vinculo: nao_confirmado` e **não é publicado**.
- Parentes, sócios e terceiros só aparecem quando a **própria fonte oficial** faz o vínculo (ex.: quadro societário da Receita, doação registrada no TSE).

## 5. Ciclo de vida de um caso comunitário

`proposto → em_triagem → em_verificacao → publicado → (atualizado | contestado) → (mantido | corrigido | despublicado | arquivado)`

1. **Proposto** — issue com template `caso-novo.yml`: entidade (CNPJ/SQ), fatos em frases neutras, **link primário por fato**, red flags sugeridas. Sem dados do remetente; sem sigilo prometido (denúncias sigilosas vão ao Fala.BR/ouvidorias — Lei 13.608/2018).
2. **Em triagem** (≤7 dias) — um curador confirma: fontes na allowlist, links respondem, identidade desambiguada, linguagem OK. Fora disso: fecha com motivo padronizado.
3. **Em verificação** — PR em `data/casos/`; CI (schema, PII, linguagem, links, CNPJ/CNJ); **2 aprovações de CODEOWNERS distintos**, ao menos uma de quem **não** propôs. Checklist no PR: fato × juízo, status com data, simetria (há absolvição/resposta a incluir?), homônimo, PII, período eleitoral.
4. **Publicado** — com `data_publicacao`, versão, hash de commit; espaço de resposta ativo (Lei 13.188/2015) e link `/takedown`.
5. **Atualizado / contestado** — nova decisão, resposta do citado ou pedido de correção → mesmo fluxo (2 reviews) em ≤72h; log em `TAKEDOWN-LOG.md`.
6. **Corrigido / despublicado / arquivado** — erro factual ou homônimo: despublicar em <2h, corrigir depois; arquivamento judicial/prescrição: registrar, não apagar histórico (git). Ordem judicial: cumprir, logar, contestar se cabível.

**Congelamento eleitoral:** de 15/09 a 30/10 de anos eleitorais não entram casos novos nem mudanças de regras de red flag; só correções, atualizações de status oficiais e takedowns.

## 6. O que nunca publicar

- Opinião, editorial, recomendação ou desaconselhamento de voto, comparação de "quem é pior", ranking pessoal, "índice de corrupção" por pessoa.
- Imputação de crime sem decisão/registro oficial correspondente e linkado; termos da lista proibida.
- CPF completo, endereço residencial, telefone, e-mail pessoal, dados sensíveis (saúde, orientação, religião, biometria), dados de menores, dados de cidadãos privados sem função pública.
- Conteúdo cuja fonte é notícia, rede social, print, áudio vazado, denúncia sem documento.
- Mídia sintética (imagem/voz/vídeo por IA) de qualquer pessoa; caricaturas; montagens.
- Conteúdo já declarado ilícito por decisão judicial (mesmo replicado de outro lugar).
- Textos protegidos por direito autoral copiados (matérias inteiras, trechos longos).
- Qualquer coisa nas 72h antes/24h depois da votação que não seja atualização oficial ou correção.

## 7. Direito de resposta e correção

- Toda pessoa/empresa citada pode enviar resposta pela rota `/resposta` (Lei 13.188/2015): publicamos, em até 72h, com **o mesmo destaque** do conteúdo, resposta proporcional; não editamos o texto salvo trechos ofensivos a terceiros/ilícitos (registrado).
- Pedido de correção (`/takedown`): acuso em 24h, decisão em 72h, log público sem dados do solicitante.
- Erro nosso: correção + nota "corrigido em DD/MM — o que dizia / o que passou a dizer".

## 8. Licenças e atribuição

- **Código:** MIT (arquivo `LICENSE`).
- **Dados e textos em `data/` e conteúdo do site:** Creative Commons **CC-BY 4.0** (`data/LICENSE-CC-BY-4.0`) — livre uso com atribuição "Monitor de Gravata (URL) — dados de fontes oficiais listadas em cada registro". Fontes originais mantêm suas licenças (registradas em `licenca_fonte`); dados abertos governamentais seguem LAI/Decreto 8.777/2016.
- **Marca:** atribuição não é endosso; é vedado usar o nome/logo do projeto em propaganda eleitoral, material partidário ou para sugerir apoio/oposição a candidatura.
- Contribuições: ao abrir PR você licencia código sob MIT e dados/textos sob CC-BY 4.0 (DCO — `Signed-off-by`).

## 9. Governança editorial mínima

- Curadoria de dados e curadoria de casos são times separados no CODEOWNERS; ninguém aprova o próprio PR; 2 aprovações em `data/**`.
- Conflito de interesse: quem é filiado, candidato, assessor, fornecedor ou parente até 3º grau de pessoa/empresa citada **declara e se abstém** de revisar aquele conteúdo (arquivo `MAINTAINERS.md` com declarações voluntárias).
- Decisões editoriais controversas vão para issue pública com etiqueta `editorial` e prazo de 7 dias para comentários; a decisão fica registrada.
- Relatório de transparência trimestral: pedidos de correção/takedown/resposta por tipo e desfecho; casos publicados/despublicados; fontes adicionadas/removidas.

## 10. Frase-padrão de rodapé (todas as fichas)

> Este conteúdo reúne registros públicos oficiais linkados em cada campo. Situação processual pode ter mudado após a data de coleta indicada. Investigação, denúncia ou ação em curso não significam culpa (CF, art. 5º, LVII). Sinalizações automáticas são indícios estatísticos, não conclusões. Erros? Correção em até 72h: [/takedown]. Direito de resposta: [/resposta].
