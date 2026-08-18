import Link from "next/link";
import { PageHead, Section, Notice } from "@/components/ui";
import { loadGlossario } from "@/lib/data";

export const metadata = { title: "Manifesto, regras e limites" };
const REPO = "https://github.com/steinhauserhzs/monitor-de-gravata";

export default function Sobre() {
  const glos = loadGlossario();
  return (
    <>
      <PageHead
        kicker="Sobre"
        title="Manifesto, regras e limites"
        stamp="imparcial"
        stampTone="azul"
        lead="O que o Monitor de Gravata é, o que não é, em que lei se apoia, como se protege e como protege quem aparece nele. Tudo aqui também vive no repositório — proponha mudanças por PR."
      />

      <Section id="manifesto" kicker="1" title="Manifesto">
        <div className="prose-mg">
          <p>
            <strong>Não temos lado.</strong> A mesma regra roda para todo partido, todo órgão, toda empresa. Não existe lista de exceção por
            nome, não existe editorial, não existe "nosso candidato". Quem quiser mudar um limiar abre um pull request e justifica em público.
          </p>
          <p>
            <strong>Só dado oficial, sempre com fonte e data.</strong> Cada número exibido vem de uma API ou arquivo de um órgão público (Câmara,
            Senado, TSE, PNCP, Receita, CGU, Compras.gov.br) e mostra o link de onde veio e quando foi coletado. Não geramos, não estimamos, não
            "completamos" dado. Quando não temos, dizemos que não temos.
          </p>
          <p>
            <strong>Sinal não é sentença.</strong> Uma red flag é uma pergunta objetiva calculada por regra pública. A resposta exige gente,
            edital, ata e a versão de quem é citado. Ninguém é culpado antes do trânsito em julgado — e o Monitor não julga nem antes nem depois.
          </p>
          <p>
            <strong>Cérebro vivo, memória de git.</strong> Dados, regras, casos e código são versionados. Toda mudança tem autor, data e motivo.
            Quem vigia os vigilantes? Qualquer um: o histórico é público, as decisões são ADRs, a moderação tem changelog.
          </p>
        </div>
      </Section>

      <Section id="juridico" kicker="2" title="Base legal e limites">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-5 prose-mg">
            <h3 className="!mt-0">O que sustenta o projeto</h3>
            <ul>
              <li><a href="https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm" target="_blank" rel="noopener noreferrer">Lei de Acesso à Informação (12.527/2011)</a> — transparência ativa; dados públicos são de todos.</li>
              <li><a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/decreto/d8777.htm" target="_blank" rel="noopener noreferrer">Decreto 8.777/2016</a> — Política de Dados Abertos do Executivo federal.</li>
              <li><a href="https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm" target="_blank" rel="noopener noreferrer">Lei 14.133/2021</a> — publicidade obrigatória de contratações no PNCP.</li>
              <li><a href="https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12846.htm" target="_blank" rel="noopener noreferrer">Lei Anticorrupção (12.846/2013)</a> e <a href="https://www.planalto.gov.br/ccivil_03/leis/l8429.htm" target="_blank" rel="noopener noreferrer">Lei de Improbidade (8.429/92, alterada pela 14.230/2021)</a>.</li>
              <li><a href="https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp135.htm" target="_blank" rel="noopener noreferrer">Ficha Limpa (LC 135/2010)</a> — condenações por órgão colegiado geram inelegibilidade.</li>
              <li><a href="https://www.planalto.gov.br/ccivil_03/leis/l9504.htm" target="_blank" rel="noopener noreferrer">Lei das Eleições (9.504/97)</a> — bens, doações e certidões de candidatos são públicos (art. 11).</li>
              <li><a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" target="_blank" rel="noopener noreferrer">LGPD (13.709/2018)</a> — permite tratar dados manifestamente públicos e de agentes públicos no exercício da função (art. 7º §3º/§4º, art. 23); o STF já assentou que a divulgação nominal de remuneração de servidores é legítima (ARE 652.777).</li>
              <li>Constituição, art. 5º XXXIII e art. 37 (publicidade), art. 5º LVII (presunção de inocência).</li>
            </ul>
          </div>
          <div className="card p-5 prose-mg">
            <h3 className="!mt-0">Onde estão os riscos — e como tratamos</h3>
            <ul>
              <li><strong>Calúnia, difamação, injúria (CP 138–140).</strong> Publicamos fato documentado com fonte, nunca juízo. "Fulano responde ao processo X (fonte, data)" ≠ "Fulano é corrupto". Adjetivo não entra.</li>
              <li><strong>Direito de resposta (Lei 13.188/2015).</strong> Qualquer citado responde; a resposta é anexada ao caso em até 72h, no mesmo lugar, com o mesmo destaque.</li>
              <li><strong>Responsabilidade por conteúdo de terceiros.</strong> Em junho/2025 o STF concluiu o julgamento sobre o art. 19 do Marco Civil (RE 1037396 e 1057258, Tema 987), ampliando deveres das plataformas após notificação. Por isso casos comunitários só são publicados após revisão dupla, com fontes primárias, e há fluxo de notificação/remoção com registro público. Confira a tese no <a href="https://portal.stf.jus.br" target="_blank" rel="noopener noreferrer">portal do STF</a>.</li>
              <li><strong>Período eleitoral (2026).</strong> Exibimos dados oficiais do TSE tais como publicados; não fazemos ranking com juízo de valor, não fazemos "pesquisa", não impulsionamos conteúdo, não recebemos doação de campanha nem de partido. Res. TSE 23.610 e resoluções sobre desinformação/IA são referência.</li>
              <li><strong>Homônimos.</strong> Manchetes e cruzamentos por nome podem misturar pessoas. Sinalizamos sempre; casos exigem identificação inequívoca (CPF mascarado + UF + data de nascimento).</li>
              <li><strong>Dados sensíveis / vazados.</strong> Nunca. CPF sempre mascarado; nada de endereço residencial, saúde, família não-pública. Só bases oficiais abertas ou LAI.</li>
              <li><strong>SLAPP</strong> (processos para intimidar). Mitigação: fontes primárias, linguagem factual, direito de resposta, entidade jurídica e parcerias com organizações da sociedade civil (roadmap).</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section id="editorial" kicker="3" title="Política editorial (resumo)">
        <div className="grid gap-4 md:grid-cols-3">
          <Notice tone="info" title="Linguagem">Número, data, link. Verbo neutro ("consta", "registra", "recebeu"). Sem "suspeito", "esquema", "escândalo". Distinguir sempre o status processual (glossário abaixo).</Notice>
          <Notice tone="info" title="Fontes">Primárias ou não entra: portais .gov.br/.jus.br/.leg.br, diários oficiais, documento do próprio órgão, decisão judicial. Imprensa entra só como manchete com link, nunca como prova.</Notice>
          <Notice tone="info" title="Ciclo de vida do caso">rascunho → em revisão (2 revisores) → publicado → contestado (resposta anexada) → corrigido/arquivado. Tudo no git. Correções nunca apagam o histórico.</Notice>
        </div>
        <div className="mt-6 card p-5">
          <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3 mb-3">Glossário de status (use exatamente estes termos)</div>
          <dl className="grid gap-x-6 gap-y-2 md:grid-cols-2 text-sm">
            {glos.map((g) => (
              <div key={g.termo}><dt className="font-semibold">{g.termo}</dt><dd className="text-ink-2">{g.definicao}{g.fonte ? <span className="font-mono text-[0.6rem] text-ink-3"> · {g.fonte}</span> : null}</dd></div>
            ))}
          </dl>
        </div>
      </Section>

      <Section id="seguranca" kicker="4" title="Segurança e ameaças">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-5 prose-mg">
            <h3 className="!mt-0">O que protegemos</h3>
            <ul>
              <li><strong>Integridade dos dados e regras</strong> — poisoning por contribuidor: branch protection, 2 aprovações em <code>data/casos</code>, CODEOWNERS, CI validando schema e proveniência, commits assinados.</li>
              <li><strong>Identidade de quem contribui/denuncia</strong> — v1 sem login e sem PII; canal seguro para denúncia sensível (issue anônima via conta descartável, ou e-mail com PGP quando publicado); logs mínimos.</li>
              <li><strong>Disponibilidade</strong> — cache agressivo das APIs, rate limit, WAF da Vercel; se derrubarem o site, o repositório é o site (backup espelhado + Software Heritage/IPFS no roadmap).</li>
              <li><strong>Supply chain</strong> — dependabot, secret scanning, lockfile, sem scripts pós-instalação de terceiros desconhecidos.</li>
              <li><strong>Reputação</strong> — deepfake atribuindo dado falso ao Monitor: cada número tem link direto para a fonte; qualquer um confere.</li>
            </ul>
          </div>
          <div className="card p-5 prose-mg">
            <h3 className="!mt-0">Referências</h3>
            <ul>
              <li>OWASP ASVS / Top 10; OpenSSF Scorecard; NIST CSF 2.0.</li>
              <li>Práticas de governança de Open Knowledge Brasil (Querido Diário, Serenata de Amor) e Transparência Brasil.</li>
              <li>Threat model completo em <a href={`${REPO}/blob/main/docs/THREAT-MODEL.md`} target="_blank" rel="noopener noreferrer">docs/THREAT-MODEL.md</a>; política de segurança em <a href={`${REPO}/blob/main/SECURITY.md`} target="_blank" rel="noopener noreferrer">SECURITY.md</a>.</li>
            </ul>
            <p>Achou uma vulnerabilidade? Reporte de forma responsável pelo canal descrito em SECURITY.md. Não publique antes da correção.</p>
          </div>
        </div>
      </Section>

      <Section id="resposta" kicker="5" title="Direito de resposta e correção">
        <div className="card p-6 ruled">
          <div className="prose-mg">
            <p>Você é (ou representa) alguém citado numa ficha, contrato ou caso e quer responder ou corrigir?</p>
            <ol>
              <li>Abra uma issue <a href={`${REPO}/issues/new?template=resposta.yml`} target="_blank" rel="noopener noreferrer">"direito de resposta / correção"</a> (ou envie por e-mail se preferir não usar GitHub — endereço em SECURITY.md).</li>
              <li>Diga o que está errado ou o que quer acrescentar, com documento quando houver.</li>
              <li>Em até 72h a resposta é anexada ao item, com o mesmo destaque, e o histórico fica público. Erro nosso é corrigido e marcado como corrigido — nunca apagado silenciosamente.</li>
            </ol>
            <p className="text-sm text-ink-3">Dados exibidos direto de API oficial (ex.: cota parlamentar) só podem ser corrigidos na fonte — indicamos onde. Um pedido de resposta não pausa a exibição de dado oficial, mas a resposta fica visível ao lado.</p>
          </div>
        </div>
      </Section>

      <Section id="quem" kicker="6" title="Quem faz">
        <div className="prose-mg">
          <p>
            Fundado por <strong>Hairã Steinhauser</strong>, com a comunidade que chegar. Sem partido, sem financiamento político,
            sem anúncio. Código MIT, dados CC-BY 4.0. Roadmap: entidade jurídica própria (associação), conselho editorial independente,
            parcerias com organizações de transparência, auditoria externa anual das regras.
          </p>
          <p><Link href="/contribuir" className="underline">Contribuir</Link> · <a href={REPO} className="underline" target="_blank" rel="noopener noreferrer">GitHub</a></p>
        </div>
      </Section>
    </>
  );
}
