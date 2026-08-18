# Design System — Monitor de Gravata

> Um dossiê forense, não um dashboard. Papel, tinta, carimbo e marca-texto.
> A regra de ouro: **o dado é o herói**. Se um efeito visual disputa atenção com o número e a fonte, o efeito sai.

Este documento é normativo. Se um componente novo não seguir o que está aqui, ele quebra o padrão — e a CI/checklist deve pegar.

---

## 1. Tokens (CSS custom properties)

Definidos em `app/globals.css` no `:root`. **Nunca escreva um hex direto no componente.**

| Token | Valor | Uso |
|---|---|---|
| `--paper` | `#f3ede0` | fundo geral (papel) |
| `--paper-2` | `#e9e0cb` | fundo de destaque, aba, barra vazia |
| `--paper-3` | `#ddd2b8` | fundo mais escuro (raro) |
| `--ink` | `#141210` | texto e blocos escuros |
| `--ink-2` | `#37322c` | texto secundário |
| `--ink-3` | `#6b635a` | rótulos, metadados, microcopy |
| `--stamp` | `#c8102e` | **alerta e ênfase máxima** (carimbo). Nunca decorativo |
| `--marker` | `#ffd400` | marca-texto, atenção média |
| `--verde` | `#1f6f50` | "sem sinal", situação regular |
| `--azul` | `#1f4e79` | informação neutra, hipótese |
| `--linha` | `rgba(20,18,16,.14)` | bordas e divisórias |

**Semântica de cor (não invente outra):**
- vermelho `--stamp` = severidade alta / valor acima do esperado / red flag
- amarelo `--marker` = atenção, hipótese a verificar, destaque de leitura
- verde `--verde` = nenhum sinal, dentro do padrão, fonte disponível
- azul `--azul` = contexto/metodologia, "isto é uma hipótese"
- tinta `--ink` = neutro

Cor **nunca** é o único sinal: acompanhe sempre de texto (`alta`, `média`, `+38%`), por daltonismo.

## 2. Tipografia

| Papel | Fonte | Classe | Onde |
|---|---|---|---|
| Display | **Anton** | `font-display` | H1/H2, números grandes, veredito |
| Texto | **Archivo** | (padrão) | parágrafos, tabelas |
| Mono | **IBM Plex Mono** | `font-mono` | rótulos em caixa alta, dados, IDs, URLs, valores |
| Serifada | **Instrument Serif** | `font-serif` | subtítulo poético ("o pesadelo de Brasília"), citações |

Escala: `text-[0.58rem]` (metadado) · `0.62–0.68rem` (rótulo mono) · `text-sm` (corpo denso) · `text-base` (corpo) · `text-lg/xl` (lead) · display `text-2xl → text-[7rem]`.
Rótulos mono são **sempre** `uppercase tracking-[0.12em~0.2em] text-ink-3`.

## 3. Espaçamento e layout

- Container: `mx-auto max-w-7xl px-4`. Seção: componente `<Section>` (py-10).
- Grid de cards: `grid gap-2/3/4` + `sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.
- Ficha: `grid gap-6 lg:grid-cols-[1.3fr_1fr]` (conteúdo principal + coluna lateral).
- Ritmo vertical dentro de painel: `space-y-6`.

## 4. Componentes (use, não recrie)

| Componente | Arquivo | Para quê |
|---|---|---|
| `<PageHead>` | `components/ui.tsx` | cabeçalho de página: kicker, título, lead, carimbo, formulário à direita |
| `<Section>` | `components/ui.tsx` | seção com kicker + título |
| `<Notice tone>` | `components/ui.tsx` | aviso: `info` (azul), `warn` (amarelo), `error` (vermelho), `ok` (verde) |
| `<Sev level>` | `components/ui.tsx` | etiqueta de severidade |
| `<Source url label at>` | `components/ui.tsx` | **obrigatório** em todo painel com dado externo |
| `<Empty>` | `components/ui.tsx` | estado vazio explicado |
| `<Crumbs>` | `components/ui.tsx` | trilha |
| `<KPI>` | `components/ficha.tsx` | número grande + rótulo + dica |
| `<Bars>` | `components/ficha.tsx` | ranking horizontal (valor absoluto) |
| `<Panel kicker title right>` | `components/ficha.tsx` | painel numerado (§1, §2…) |
| `<Flags>` | `components/ficha.tsx` | lista de red flags |
| `<Timeline>` | `components/ficha.tsx` | linha do tempo |
| `<Veredito>` | `components/Veredito.tsx` | conclusão em uma frase (comparador) |

Classes utilitárias próprias: `.card` `.card--hover` `.card--dark` `.btn` `.btn--ghost` `.btn--stamp` `.input` `.table` `.tab` `.stamp` `.sev` `.marker` `.ruled` `.ink-block` `.prose-mg`.

## 5. Regras anti-quebra (o que impede o layout de estourar)

Estas classes existem para isso — **use-as**:

| Classe | Quando |
|---|---|
| `.quebra` | qualquer texto vindo de API (objeto de contrato, ementa, lógica de regra) |
| `.url` | URL, CNPJ formatado, id longo, endpoint |
| `.linhas-2` / `.linhas-3` | título/descrição em card de grade |
| `.rolagem` (ou `overflow-x-auto`) | **toda** tabela e bloco de código |
| `min-w-0` | item de `grid`/`flex` que contém texto longo (já aplicado globalmente) |

Regras globais já ativas: `html, body { overflow-x: hidden }`, `.card { min-width: 0 }`, `.card table { max-width: 100% }`.

**Proibido:** `min-w-[Xrem]` sem `w-full sm:` antes (quebra no celular) · `white-space: nowrap` em texto de usuário · largura fixa em px em contêiner · tabela sem contêiner de rolagem.

## 6. Movimento (`.vivo`, `.pulso`, `.cascata`, `.ticker`, `.bater`, `.marker-anim`, `.barra-anim`)

- Só CSS. A CSP proíbe script externo — **nada de bibliotecas de animação**.
- Movimento com propósito: entrada de dado (`pulso`), hierarquia (`cascata`), leitura (`marker-anim`), veredito (`bater`).
- Duração 120–700 ms; easing `cubic-bezier(.2,.8,.2,1)`.
- **Obrigatório**: tudo dentro de `@media (prefers-reduced-motion: reduce)` é desligado. Já está.
- Nunca animar algo que atrase a leitura do número.

## 7. Acessibilidade (não negociável)

- Contraste mínimo AA; vermelho `--stamp` sobre papel passa em texto ≥ 14px bold ou ≥ 18px.
- `:focus-visible` com contorno vermelho de 3px — já global.
- Toda imagem decorativa com `alt=""`; foto de pessoa com alt descritivo ("Foto oficial de X").
- Ícone/mapa clicável precisa de `aria-label` e `<title>`.
- Ordem de leitura = ordem visual; nada de `tabindex` positivo.
- Alvo de toque ≥ 32px de altura nos chips e botões.

## 8. Voz e microcopy (é design também)

- Fato, nunca juízo: "recebeu 62% da cota de um CNPJ", jamais "é suspeito".
- Toda tela com dado externo mostra **fonte + data de coleta**.
- Estado vazio explica o motivo ("a Câmara publica com atraso"), nunca só "sem dados".
- Erro de fonte é dito na cara: "a API não respondeu — a lista pode estar incompleta".
- Números em `pt-BR` (`brl()`, `num()`, `pct()` de `lib/format.ts`). Datas via `dateBR()`.
- Verbos permitidos: consta, registra, recebeu, declarou, assinou, aparece. Proibidos: suspeito, esquema, escândalo, corrupto, ladrão.

## 9. Checklist antes de abrir PR de UI

- [ ] Sem hex fora dos tokens
- [ ] Texto de API com `.quebra` / `.url` / `.linhas-N`
- [ ] Tabela dentro de `overflow-x-auto`
- [ ] Formulário `w-full sm:min-w-[...]`
- [ ] `<Source>` no painel com dado externo
- [ ] Estado vazio e estado de erro escritos
- [ ] Testado em 375px de largura
- [ ] `npm run design` passa (verificador automático)
- [ ] `npm run build` passa
