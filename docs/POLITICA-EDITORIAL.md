# Política editorial

## Linguagem
- Número, data, link. Verbos neutros: *consta, registra, recebeu, declarou, assinou*.
- Proibido: adjetivos e rótulos (*suspeito, esquema, escândalo, corrupto, laranja*), ironia, insinuação, "todo mundo sabe".
- Sempre o status processual exato (glossário em `data/glossario.json`): investigado · denunciado/réu · condenado em 1ª instância · condenado por colegiado · trânsito em julgado. Improbidade ≠ crime.
- Sinal ≠ irregularidade ≠ crime. Uma red flag é uma pergunta.

## Fontes
- Primárias ou não entra: portais .gov.br/.jus.br/.leg.br, diários oficiais, documento do próprio órgão, decisão judicial pública, prestação de contas TSE.
- Imprensa: só como manchete com link (nunca como prova). Wikidata: secundária, sempre linkada.
- Toda fonte com `url` + `coletado_em`. Dados de API mostram "coletado em".

## O que nunca publicar
CPF completo (o site mascara mesmo quando a fonte não mascara), endereço residencial, telefone pessoal, dados de saúde/orientação/religião, familiares que não sejam agentes públicos, menores, dado vazado ou obtido sem autorização, conteúdo sob sigilo judicial.

## Ciclo de vida do caso
| Estado | Quem | Prazo | O que acontece |
|---|---|---|---|
| rascunho | autor | — | arquivo em PR, com 5 seções |
| em-revisao | 2 revisores | 14 dias | checagem fonte a fonte; conflito de interesse declarado |
| publicado | mantenedor | — | aparece no site; citados notificados quando identificáveis |
| contestado | citado | 72 h para anexar | resposta no mesmo arquivo, mesmo destaque |
| corrigido / arquivado | mantenedor | — | histórico preservado; nunca apagar silenciosamente |

## Neutralidade
Mesma regra para todos. Nenhuma lista de exceção por nome/partido. Rankings só por métrica objetiva com fórmula pública. Em período eleitoral: dados oficiais como publicados, sem juízo, sem impulsionamento, sem doação de campanha.

## IA
Agentes/LLMs podem pesquisar fontes, testar endpoints e sugerir regras. Nunca escrevem um número que não venha de fonte, nunca redigem caso sem revisão humana, nunca "resumem" um processo judicial como fato.
