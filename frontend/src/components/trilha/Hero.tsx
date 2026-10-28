import { Painel } from "@/components/ui/Painel";

const ROTA = "M40 250 C 140 262, 118 172, 220 170 S 300 92, 380 110 S 452 70, 470 50";

const PILULAS = [
  { texto: "Toda conclusão com evidência", cor: "bg-lime text-on-lime" },
  { texto: "A IA só redige justificativas", cor: "bg-cream text-on-lime" },
  { texto: "Nenhum dado pessoal enviado", cor: "bg-sky text-ink" },
];

/** Abertura da página inicial: promessa do produto e o caminho do PPC às profissões. */
export function Hero() {
  return (
    <Painel
      as="section"
      relevo
      className="relative grid items-end gap-6 overflow-hidden p-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:p-14"
    >
      <div className="flex flex-col gap-5">
        <p className="m-0 inline-flex items-center gap-2 text-sm leading-5 font-bold tracking-[.06em] text-lime uppercase">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/trilha.svg" alt="" width={28} height={28} />
          Sistemas e Mídias Digitais · UFC
        </p>
        <h1 className="font-display m-0 text-[40px] leading-[42px] font-extrabold tracking-[-0.03em] text-cream md:text-[64px] md:leading-[60px]">
          Do PPC de hoje às profissões do futuro
        </h1>
        <p className="m-0 max-w-[520px] text-lg leading-7 text-on-panel-muted">
          O Trilha confronta o PPC com as competências exigidas pelas profissões contemporâneas e
          mostra a evidência de cada passo do caminho.
        </p>
        <ul aria-label="Princípios" className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
          {PILULAS.map((p) => (
            <li
              key={p.texto}
              className={`inline-flex min-h-9 items-center rounded-full px-4 text-sm leading-5 font-bold ${p.cor}`}
            >
              {p.texto}
            </li>
          ))}
        </ul>
      </div>
      <svg viewBox="0 0 520 300" aria-hidden="true" className="block h-auto w-full overflow-visible">
        <path d={ROTA} fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-lime" />
        <path
          d={ROTA}
          transform="translate(0 18)"
          fill="none"
          strokeWidth="2"
          strokeDasharray="2 10"
          strokeLinecap="round"
          opacity=".8"
          className="stroke-cream"
        />
        <circle cx="40" cy="250" r="12" className="fill-cream" />
        <circle cx="470" cy="50" r="13" strokeWidth="5" className="fill-panel stroke-cream" />
        <text x="20" y="290" className="fill-on-panel text-sm font-bold">
          PPC de hoje
        </text>
        <text x="400" y="22" className="fill-on-panel text-sm font-bold">
          profissões-alvo
        </text>
        <rect x="170" y="128" width="84" height="26" rx="13" className="fill-lime" />
        <text x="184" y="146" className="fill-on-lime text-[13px] font-bold">
          lacunas
        </text>
        <rect x="318" y="62" width="100" height="26" rx="13" className="fill-lime" />
        <text x="332" y="80" className="fill-on-lime text-[13px] font-bold">
          evidências
        </text>
      </svg>
    </Painel>
  );
}
