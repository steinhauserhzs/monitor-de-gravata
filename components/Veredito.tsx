import Link from "next/link";
import { brl } from "@/lib/format";
import type { Estatisticas, Faixa, EstatisticaFaixa } from "@/lib/precos";

/**
 * O veredito do comparador em UMA frase, para quem não é do ramo.
 * Regra de honestidade: a comparação principal é sempre dentro da MESMA faixa de quantidade
 * (comprar 1 unidade não é comparável a comprar 1.000 — varejo × atacado).
 */
export function Veredito({
  preco,
  quantidade,
  faixa,
  estFaixa,
  estGeral,
  nomeItem,
}: {
  preco: number;
  quantidade: number;
  faixa: Faixa;
  estFaixa: Estatisticas | null;
  estGeral: Estatisticas;
  nomeItem: string;
}) {
  const ref = estFaixa ?? estGeral;
  const usouGeral = !estFaixa;
  const razao = preco / ref.mediana;
  const dif = (razao - 1) * 100;
  const nivel = razao <= 1.3 ? "normal" : razao <= 1.7 ? "atencao" : razao <= 2.5 ? "alto" : "muito-alto";
  const cor = nivel === "normal" ? "border-verde" : nivel === "atencao" ? "border-marker" : "border-stamp";
  const frase =
    nivel === "normal"
      ? "Está dentro do que outros órgãos pagam por esta quantidade."
      : nivel === "atencao"
        ? "Está acima do normal para esta quantidade. Vale abrir a licitação e conferir a especificação."
        : nivel === "alto"
          ? "Está bem acima do que outros órgãos pagaram por quantidade parecida."
          : "Está muito acima do praticado. Confira a especificação, a unidade (caixa × unidade) e se houve disputa.";

  return (
    <div className={`card border-l-8 ${cor} p-6 md:p-8 rise`}>
      <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink-3">Veredito · {nomeItem}</div>
      <div className="mt-3 grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
        <div>
          <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">pagaram</div>
          <div className="font-display text-4xl md:text-6xl leading-none">{brl(preco)}</div>
          <div className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3 mt-1">
            por unidade · {quantidade > 1 ? `${quantidade.toLocaleString("pt-BR")} unidades` : "quantidade não informada"}
          </div>
        </div>
        <div>
          <div className={`font-display text-3xl md:text-5xl leading-none ${nivel === "normal" ? "text-verde" : "text-stamp"}`}>
            {dif >= 0 ? "+" : ""}
            {dif.toFixed(0)}%
          </div>
          <p className="mt-1 text-lg leading-snug">
            {dif >= 0 ? "acima" : "abaixo"} do que outros órgãos pagaram comprando <strong>{faixa.rotulo}</strong> — mediana {brl(ref.mediana)}.
          </p>
          <p className="mt-2 text-sm text-ink-2">{frase}</p>
          {usouGeral && (
            <p className="mt-2 text-[0.72rem] text-ink-3">
              Não havia compras suficientes nessa faixa de quantidade; comparamos com todas as quantidades — leia com essa ressalva.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Tabelinha simples: mediana por faixa de quantidade (varejo → atacado). */
export function FaixasQuantidade({ faixas, faixaAtual }: { faixas: EstatisticaFaixa[]; faixaAtual?: string }) {
  const comDados = faixas.filter((f) => f.est && f.itens >= 3);
  if (!comDados.length) return null;
  return (
    <div className="card p-5">
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-3">Preço muda com a quantidade</div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {comDados.map(({ faixa, est, itens }) => (
          <div key={faixa.id} className={`border p-3 ${faixa.id === faixaAtual ? "border-ink bg-paper-2" : "border-linha"}`}>
            <div className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-3">{faixa.rotulo}</div>
            <div className="font-display text-2xl leading-none mt-1">{brl(est!.mediana)}</div>
            <div className="text-[0.68rem] text-ink-3 mt-1">
              mediana de {itens} compra(s) · de {brl(est!.min)} a {brl(est!.max)}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[0.7rem] text-ink-3">
        Quem compra mais costuma pagar menos por unidade. Por isso o veredito acima compara sempre dentro da mesma faixa —
        um preço de compra unitária não prova nada contra uma compra de mil unidades.
      </p>
    </div>
  );
}

export function ComoLer() {
  return (
    <details className="card p-4">
      <summary className="cursor-pointer font-mono text-[0.65rem] uppercase tracking-[0.16em]">Como ler estes números (e o que eles não provam)</summary>
      <ul className="mt-3 text-sm text-ink-2 space-y-2 list-disc pl-5">
        <li><strong>Mediana</strong> é o preço do meio: metade das compras custou menos, metade custou mais. Resiste a valores absurdos melhor que a média.</li>
        <li><strong>Faixa de quantidade</strong> importa: atacado é mais barato por unidade. Comparamos sempre dentro da mesma faixa.</li>
        <li><strong>Unidade de fornecimento</strong> engana: "caixa com 100" e "unidade" aparecem no mesmo padrão de material. Confira na linha da compra.</li>
        <li>Preço acima da mediana <strong>não é crime</strong>. Pode ser urgência, especificação melhor, entrega em local difícil — ou erro de digitação do órgão ao publicar.</li>
        <li>O que isso serve: <strong>saber onde perguntar</strong>. Abra a licitação, leia o edital e, se fizer sentido, <Link href="/contribuir" className="underline">documente um caso</Link>.</li>
      </ul>
    </details>
  );
}
