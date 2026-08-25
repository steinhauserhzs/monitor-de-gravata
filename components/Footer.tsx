import Link from "next/link";
import { Gravata } from "./Logo";

export function Footer() {
  return (
    <footer className="ink-block mt-24 border-t border-paper/15">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Gravata className="h-10 w-5 text-stamp" />
            <div className="font-display text-2xl leading-none">MONITOR DE GRAVATA</div>
          </div>
          <p className="font-serif italic text-paper/80 mt-3 text-lg">o pesadelo de Brasília</p>
          <p className="mt-4 max-w-md text-sm text-paper/70 leading-relaxed">
            Dados públicos, regras abertas e comunidade auditando o poder. Todo dado exibido tem
            fonte oficial, data de coleta e link. Hipóteses comunitárias são marcadas como
            hipóteses. Ninguém é culpado até o trânsito em julgado — e nada aqui é acusação.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="stamp stamp--flat">Código MIT</span>
            <span className="stamp stamp--flat stamp--verde">Dados CC-BY 4.0</span>
            <span className="stamp stamp--flat stamp--azul">Fontes primárias</span>
          </div>
        </div>
        <FooterCol
          title="Módulos"
          links={[
            ["/politicos", "Ficha do político"],
            ["/candidatos", "Manual do candidato 2026"],
            ["/contratos", "Radar de contratos"],
            ["/empresas", "Ficha da empresa"],
            ["/precos", "Comparador de preços"],
            ["/cruzamentos", "Cruzamentos (cota × contratos)"],
            ["/radar", "Motor de red flags"],
            ["/casos", "Casos da comunidade"],
          ]}
        />
        <FooterCol
          title="Base viva"
          links={[
            ["/apis", "Catálogo de APIs públicas"],
            ["/contribuir", "Como contribuir"],
            ["/sobre", "Manifesto e regras"],
            ["/sobre#juridico", "Base legal e limites"],
            ["/sobre#seguranca", "Segurança e ameaças"],
          ]}
        />
        <FooterCol
          title="Fora daqui"
          links={[
            ["https://github.com/steinhauserhzs/monitor-de-gravata", "GitHub ↗"],
            ["https://github.com/steinhauserhzs/monitor-de-gravata/issues/new/choose", "Abrir caso / denúncia ↗"],
            ["https://portaldatransparencia.gov.br", "Portal da Transparência ↗"],
            ["https://pncp.gov.br", "PNCP ↗"],
            ["https://divulgacandcontas.tse.jus.br", "DivulgaCand TSE ↗"],
          ]}
        />
      </div>
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-paper/60">
          <span>Projeto comunitário · sem partido · sem dono · sem anúncio</span>
          <span>Projeto pessoal de Hairã Steinhauser · 2026</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-marker mb-3">{title}</div>
      <ul className="text-sm">
        {links.map(([href, label]) => (
          <li key={href}>
            {href.startsWith("http") ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block py-1.5 hover:underline underline-offset-4 decoration-stamp">
                {label}
              </a>
            ) : (
              <Link href={href} className="inline-block py-1.5 hover:underline underline-offset-4 decoration-stamp">
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
