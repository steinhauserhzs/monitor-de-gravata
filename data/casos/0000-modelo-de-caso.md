---
titulo: "Modelo de caso — como registrar uma hipótese no Monitor de Gravata"
status: publicado
tipo: modelo
esfera: federal
uf: BR
entidades: []
regras: [fornecedor-cnpj-recem-aberto, contrato-valor-global-elevado]
fontes:
  - titulo: "PNCP — API de consulta"
    url: "https://pncp.gov.br/api/consulta/swagger-ui/index.html"
    coletado_em: "2026-08-17"
  - titulo: "Política editorial do projeto"
    url: "https://github.com/steinhauserhzs/monitor-de-gravata/blob/main/docs/POLITICA-EDITORIAL.md"
autores: [monitor-de-gravata]
revisores: [monitor-de-gravata]
criado_em: "2026-08-17"
atualizado_em: "2026-08-17"
resumo: "Este arquivo é o gabarito. Copie, renomeie com número sequencial + slug, preencha com FATOS e FONTES, abra um PR. Nunca acuse: descreva o que o dado mostra e o que falta verificar."
---

## O que é um "caso"

Um caso é uma **hipótese documentada**: um conjunto de dados públicos que, cruzados, produzem um sinal que merece atenção humana. Não é denúncia, não é acusação, não é sentença. É o começo de uma pergunta.

## Estrutura obrigatória

1. **Fato observado** — o que o dado mostra, com número, data e link da fonte primária.
2. **Cruzamento** — quais bases foram cruzadas e como (ex.: CNPJ do fornecedor no PNCP × data de abertura na Receita).
3. **Red flags acionadas** — ids do catálogo (`data/red-flags.json`).
4. **O que NÃO sabemos** — explicitamente. Hipóteses alternativas legítimas.
5. **Próximo passo verificável** — pedido LAI, leitura do edital, consulta ao TCE, contato com a assessoria para direito de resposta.

## Exemplo (fictício, para ilustrar o formato)

> **Fato:** O contrato `00000000000000-2-000001/2026` (R$ 12,4 mi, obra) foi assinado em 2026-03-10 com a empresa X, cujo CNPJ foi aberto em 2025-11-02 (128 dias antes). Fonte: PNCP (coletado 2026-08-17), BrasilAPI/Receita (coletado 2026-08-17).
>
> **Red flags:** `fornecedor-cnpj-recem-aberto` (alta), `contrato-valor-global-elevado` (baixa).
>
> **O que não sabemos:** se a empresa é sucessora de outra (mesmos sócios), se houve mais de um licitante, se o preço está dentro da referência.
>
> **Próximo passo:** baixar o edital e a ata (PNCP → arquivos), verificar nº de propostas e QSA dos sócios em empresas anteriores.

## Ciclo de vida

`rascunho` → `em-revisao` (2 revisores) → `publicado` → pode virar `contestado` (direito de resposta) → `corrigido` ou `arquivado`. Toda mudança fica no histórico do git.
