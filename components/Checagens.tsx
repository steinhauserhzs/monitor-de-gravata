import type { Checagem } from "@/lib/checagens";

export function Checagens({ dados, nome }: { dados: { itens: Checagem[]; via: string; nota: string }; nome: string }) {
  return (
    <div>
      {!dados.itens.length && <p className="text-sm text-ink-3">{dados.nota}</p>}
      <ul className="divide-y divide-linha">
        {dados.itens.map((c, i) => (
          <li key={i} className="py-2.5">
            <a href={c.url} target="_blank" rel="noopener noreferrer nofollow" className="text-sm hover:underline decoration-stamp underline-offset-2">
              {c.texto}
            </a>
            <div className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">
              {c.veiculo}
              {c.veredito ? ` · veredito: ${c.veredito}` : ""}
              {c.data ? ` · ${new Date(c.data).toLocaleDateString("pt-BR")}` : ""}
            </div>
          </li>
        ))}
      </ul>
      {dados.itens.length > 0 && <p className="mt-2 text-[0.68rem] text-ink-3">{dados.nota} Quando há veredito, ele é do checador — nunca do Monitor. Busca pelo nome “{nome}”: pode incluir pessoas apenas citadas na matéria.</p>}
    </div>
  );
}
