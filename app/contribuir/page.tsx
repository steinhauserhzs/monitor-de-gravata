import Link from "next/link";
import { PageHead, Section, Notice } from "@/components/ui";

export const metadata = { title: "Como contribuir" };
const REPO = "https://github.com/steinhauserhzs/monitor-de-gravata";

export default function Contribuir() {
  return (
    <>
      <PageHead
        kicker="Base viva"
        title="Como contribuir"
        stamp="sem cadastro"
        stampTone="verde"
        lead="O Monitor é um repositório público. Dados, regras, casos e código vivem no git — a trilha de auditoria é o próprio histórico. Não precisa ser dev: a maior parte das contribuições é JSON, Markdown ou leitura atenta de um edital."
        right={<a className="btn" href={REPO} target="_blank" rel="noopener noreferrer">Abrir o repositório ↗</a>}
      />
      <Section kicker="Trilhas" title="Escolha a sua">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            ["Cidadão / leitor", "Achou algo estranho numa ficha ou contrato? Abra uma issue 'caso' com o link e o que viu. Não precisa provar nada — precisa apontar a fonte.", `${REPO}/issues/new?template=caso.yml`, "Abrir caso"],
            ["Jornalista / pesquisador", "Transforme uma apuração em caso: 5 seções (fato, cruzamento, red flags, o que não sabemos, próximo passo). Revisão em par, direito de resposta embutido.", `${REPO}/blob/main/data/casos/0000-modelo-de-caso.md`, "Ver modelo"],
            ["Contador / auditor / servidor", "Proponha red flags com fórmula e limiar (fracionamento, sobrepreço, aditivo). Você conhece a lei; a comunidade implementa.", `${REPO}/issues/new?template=red-flag.yml`, "Propor regra"],
            ["Dev", "Implemente regras do backlog em lib/rules, conecte uma API nova (SAPL da sua câmara, TCE do seu estado), escreva o job de ingestão da CEAPS/DataJud.", `${REPO}/blob/main/CONTRIBUTING.md`, "Guia técnico"],
            ["Designer / UX", "Ficha 360 legível para quem não é do ramo. Visualização de linha do tempo, comparação de candidatos, acessibilidade.", `${REPO}/issues?q=label%3Adesign`, "Issues de design"],
            ["Jurídico / segurança", "Revise a política editorial, o threat model, os fluxos de takedown/resposta. Ajude a montar a entidade e as parcerias.", `${REPO}/blob/main/docs/POLITICA-EDITORIAL.md`, "Política editorial"],
          ].map(([t, d, h, l]) => (
            <div key={t} className="card p-5 flex flex-col">
              <div className="font-display text-xl">{t}</div>
              <p className="mt-2 text-sm text-ink-2 flex-1">{d}</p>
              <a className="btn btn--ghost mt-4 self-start" href={h} target="_blank" rel="noopener noreferrer">{l} ↗</a>
            </div>
          ))}
        </div>
      </Section>
      <Section kicker="Passo a passo" title="Sua primeira contribuição em 10 minutos">
        <div className="prose-mg">
          <ol>
            <li><strong>Fork</strong> o repositório e clone (<code>git clone …</code>), ou edite direto pelo GitHub (botão "propor correção" em cada caso/API).</li>
            <li>Para uma <strong>API nova</strong>: copie uma entrada de <code>data/apis/00-nucleo-verificado.json</code>, preencha (teste o endpoint com <code>curl</code>), rode <code>npm run validar</code>.</li>
            <li>Para uma <strong>red flag</strong>: adicione em <code>data/red-flags.json</code> (id kebab-case, lógica em pseudocódigo). Se souber TS, implemente em <code>lib/rules/index.ts</code> com o mesmo id.</li>
            <li>Para um <strong>caso</strong>: copie <code>data/casos/0000-modelo-de-caso.md</code>, nomeie <code>NNNN-slug.md</code>, status <code>rascunho</code>, fontes com URL e data de coleta.</li>
            <li>Abra o PR. A CI valida JSON/schema e links. Dois revisores aprovam casos; um aprova APIs/regras.</li>
          </ol>
          <h3>Regras inegociáveis</h3>
          <ul>
            <li>Fonte primária ou não entra (gov.br, .jus.br, .leg.br, diário oficial, documento do próprio órgão).</li>
            <li>Linguagem factual: número, data, link. Sem adjetivo, sem juízo, sem "suspeito de".</li>
            <li>Distinguir sempre <em>investigado / réu / condenado em 1ª instância / por colegiado / trânsito em julgado</em>.</li>
            <li>Nunca dados sensíveis, CPF completo, endereço, família não-pública, dado vazado.</li>
            <li>Mesma régua para todos os partidos. Quem quiser mudar um limiar, justifica no PR.</li>
          </ul>
        </div>
      </Section>
      <Section>
        <div className="grid gap-4 md:grid-cols-3">
          <Notice tone="info" title="Licenças">Código MIT. Dados e textos CC-BY 4.0. Você pode reusar tudo — cite a fonte original (o órgão) e o Monitor.</Notice>
          <Notice tone="warn" title="Segurança do contribuidor">Não use sua identidade real se isso te expõe. Denúncias sensíveis: veja o canal seguro em <Link href="/sobre#seguranca" className="underline">Segurança</Link>. Nunca envie dado não-público.</Notice>
          <Notice tone="ok" title="Governança">Mantenedores, revisores e auditores; decisões em ADRs públicos; changelog de moderação. Ver <code>GOVERNANCE.md</code>.</Notice>
        </div>
      </Section>
    </>
  );
}
