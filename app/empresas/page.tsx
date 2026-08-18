import { redirect } from "next/navigation";
import { PageHead, Section, Notice } from "@/components/ui";
import { onlyDigits, validCNPJ } from "@/lib/format";

export const metadata = { title: "Ficha da empresa" };

export default async function Empresas({ searchParams }: PageProps<"/empresas">) {
  const sp = await searchParams;
  const q = Array.isArray(sp.cnpj) ? sp.cnpj[0] : sp.cnpj;
  if (q) {
    const d = onlyDigits(q);
    if (d.length === 14) redirect(`/empresas/${d}`);
  }
  const invalido = q ? !validCNPJ(q) : false;
  return (
    <>
      <PageHead
        kicker="Módulo 04"
        title="Ficha da empresa"
        stamp="Receita ao vivo"
        stampTone="verde"
        lead="Digite um CNPJ para ver quem é a empresa (sócios, idade, capital, situação, CNAE), que contratos públicos ela venceu no PNCP e se aparece em cadastros de sanção."
        right={
          <form className="card p-4 flex gap-2 items-end min-w-[20rem]">
            <label className="block flex-1"><span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">CNPJ</span><input name="cnpj" className="input" placeholder="00.000.000/0001-91" defaultValue={q ?? ""} /></label>
            <button className="btn" type="submit">Abrir ficha</button>
          </form>
        }
      />
      <Section>
        {invalido && <Notice tone="error" title="CNPJ inválido">O número informado não passa na validação de dígitos verificadores.</Notice>}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Quem é", "Razão social, fantasia, situação cadastral, data de abertura, capital social, porte, MEI/Simples, CNAE, sede e quadro societário (CPF mascarado, como a Receita publica)."],
            ["O que venceu", "Contratos e editais no PNCP em que aparece como fornecedor (busca do índice do PNCP). Com chave do Portal da Transparência: contratos federais desde 2013 e pagamentos recebidos."],
            ["Sinais", "CNPJ recém-aberto vencendo contrato, capital social simbólico, situação irregular, sede em outra UF, MEI acima do limite, sanções CEIS/CNEP."],
          ].map(([t, d]) => (
            <div key={t} className="card p-5"><div className="font-display text-xl">{t}</div><p className="mt-2 text-sm text-ink-2">{d}</p></div>
          ))}
        </div>
      </Section>
    </>
  );
}
