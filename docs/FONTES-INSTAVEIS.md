# Fontes instáveis — o que quebra, por quê, e o que o site faz

> **Regra que rege este documento.** Uma fonte que não responde **não é** um registro que não
> existe. Confundir as duas coisas é a mesma falha de veracidade descrita em
> [PROCEDENCIA.md](./PROCEDENCIA.md): afirmar o que a fonte não garante.
>
> Última verificação: **25/08/2026**, contra produção (`monitordegravata.vercel.app`) e contra as
> APIs de origem, a partir de duas redes diferentes (Vercel e máquina do mantenedor).

## O bug que motivou este documento

Até 25/08/2026, toda ficha dinâmica fazia:

```ts
const dep = await safe(getDeputado(id));
if (!dep.data) notFound();   // ERRADO
```

`safe()` devolvia `data: null` para **qualquer** falha — 404, 403, 500, timeout. Resultado: quando
a fonte oficial caía, o leitor via **“404 · SEM REGISTRO — Esta página não existe”** sobre um
deputado que existe, uma empresa que existe, um candidato que existe.

Pior: como o Next envia HTTP 200 e o `notFound()` chega depois, no streaming, um rastreador de
links via **200 em 500 páginas** enquanto o usuário via 404 na tela. O bug era invisível para
qualquer verificação automática que só olhasse status HTTP.

**Correção:** `safe()` passou a devolver um `motivo` (`nao-encontrado` | `bloqueado` | `instavel` |
`timeout`). Só `nao-encontrado` vira `notFound()`. O resto renderiza
`<FonteIndisponivel/>` (página inteira) ou `<AvisoFonte/>` (painel parcial), que dizem o que
falhou, **o que isso não significa**, e oferecem o link para a fonte oficial.

## TSE — DivulgaCand

| | |
|---|---|
| **Host** | `divulgacandcontas.tse.jus.br/divulga/rest/v1` |
| **Proteção** | Akamai (`errors.edgesuite.net`) com limite de consultas automatizadas |
| **Da Vercel** | **403 em 100% das requisições**, todas as UFs, todos os cargos |
| **De uma máquina comum** | funciona por ~15 requisições; depois 403 por dezenas de minutos |
| **Tamanho** | a lista de SP para deputado federal tem **2,6 MB** |

Isso é o pior caso possível para a arquitetura antiga: buscar 2,6 MB ao vivo a cada page view,
de uma fonte que limita consultas. O módulo “Manual do Candidato 2026” ficava vazio em produção
enquanto funcionava perfeitamente em `npm run dev` — um “na minha máquina funciona” que passou
despercebido justamente porque só quebra no ambiente de produção.

**Não fazemos** rodízio de IP, proxy de contorno ou disfarce de cliente para furar o limite.
O que fazemos é o caminho previsto:

1. **Índice local.** `npm run candidatos [ano] [cargo] [uf]` roda **fora da produção** (máquina do
   mantenedor ou CI), com 3 s entre requisições e recuo de 30 s → 4 min quando bloqueado. Grava
   `data/derivados/candidatos-<ano>/<cargo>-<uf>.json` com só os campos da listagem, mais `fonte`
   e `coletado_em`. Um arquivo por UF/cargo: dá para regerar só o que falhou, e o script imprime
   a linha de comando exata de cada combinação que não veio.
2. **O site lê o índice primeiro** (`listCandidatos` em `lib/tse.ts`) e só cai para a API ao vivo
   se o arquivo não existir.
3. **A ficha individual continua ao vivo** — é uma requisição pequena, por candidato.
4. **A tela diz de onde veio.** Quando a lista sai do índice, aparece a data da coleta e o link
   para conferir no DivulgaCand. O índice é **derivado, nunca fonte da verdade**.

> **Cuidado ao rodar:** se o script começar a imprimir `[bloqueado, esperando …]` em toda
> combinação, pare. A fonte está pedindo recuo e insistir só estende o bloqueio. Espere e volte
> depois — o índice é incremental, o que já foi gravado continua valendo.

## As outras fontes

| Fonte | Como falha | O que o site faz |
|---|---|---|
| **Câmara** (`dadosabertos.camara.leg.br`) | `/despesas` já voltou vazio por dias; votações nominais somem em recesso | fallback pelo arquivo anual da cota (`npm run ceap`); votações varrem 3 trimestres |
| **Senado** (`legis.senado.leg.br`) | instabilidade pontual | `AvisoFonte` no painel afetado, resto da ficha continua |
| **PNCP** | rejeita `tamanhoPagina > 50`; a busca exige User-Agent de navegador | limites respeitados no `lib/pncp.ts` |
| **Portal da Transparência** | exige `PORTAL_TRANSPARENCIA_KEY`; `/servidores` não busca por nome | painel some quando não há chave, sem fingir ausência de dado |
| **Compras.gov.br** | lento sob carga | `AvisoFonte` na amostra de preços |

## O que o `fetcher` faz hoje

- **Classifica** a falha (`lib/fetcher.ts` → `MotivoFalha`), em vez de achatar tudo em `null`.
- **Reinsiste** com recuo exponencial em bloqueio/instabilidade — e **nunca** em `nao-encontrado`,
  porque “não existe” é resposta definitiva.
- **Resume o corpo do erro.** Página de WAF é HTML inteiro; despejar isso na tela era o que
  produzia `403 Forbidden — <HTML><HEAD><TITLE>Access Denied</TITLE>…` no meio do layout. Agora
  vira “a fonte recusou a consulta automatizada (bloqueio de borda)”.
- **Envia cabeçalhos de navegador completos** (`Sec-Fetch-*`, `sec-ch-ua`). Não é disfarce: o
  `User-Agent` identifica o projeto e o repositório. É requisição bem formada — vários portais
  públicos recusam cliente que não se apresenta assim.
