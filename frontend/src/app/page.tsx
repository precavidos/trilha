import { Hero } from "@/components/trilha/Hero";
import { Aviso } from "@/components/ui/Aviso";
import { Botao } from "@/components/ui/Botao";
import { Card } from "@/components/ui/Card";
import { ChipSituacao } from "@/components/ui/ChipSituacao";

const ICONE =
  "grid size-14 place-items-center rounded-[14px] shadow-[inset_0_0_0_3px_var(--panel),inset_0_0_0_5px_var(--cream)] [&_svg]:size-5";

export default function Inicio() {
  return (
    <div className="flex flex-col gap-6">
      <Hero />
      <h2 className="font-display m-0 mt-4 text-[32px] leading-9 font-extrabold tracking-[-0.02em]">
        Por onde você começa?
      </h2>
      <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2">
        <Card as="li" className="flex flex-col gap-4 p-8">
          <span className={`${ICONE} bg-panel text-cream`}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 20h18M5 20V9l7-5 7 5v11M9 20v-6h6v6" />
            </svg>
          </span>
          <h3 className="m-0 text-2xl leading-[30px] font-bold">Coordenação e NDE</h3>
          <p className="m-0 text-ink-muted">
            Lacunas de competências do PPC por profissão-alvo, com uma lente transversal de IA, e a
            atualidade das bibliografias.
          </p>
          <div className="flex flex-wrap gap-2">
            <ChipSituacao status="LACUNA" />
            <ChipSituacao status="PARCIAL" />
            <ChipSituacao status="COBERTA" />
          </div>
          <Botao variante="painel" href="/coordenacao" className="mt-2 self-start">
            Analisar o PPC
          </Botao>
        </Card>
        <Card as="li" className="flex flex-col gap-4 p-8">
          <span className={`${ICONE} bg-lime text-on-lime`}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 19c4-1 4-7 8-8s5-5 8-6" />
              <circle cx="4" cy="19" r="1.5" />
              <circle cx="20" cy="5" r="1.5" />
            </svg>
          </span>
          <h3 className="m-0 text-2xl leading-[30px] font-bold">Discente</h3>
          <p className="m-0 text-ink-muted">
            Optativas e eletivas que aproximam sua trajetória da profissão que você deseja,
            respeitando pré-requisitos e a carga horária que falta.
          </p>
          <Aviso tom="info">Em desenvolvimento neste protótipo</Aviso>
          <Botao variante="fantasma" href="/discente" className="mt-2 self-start">
            Ver o que está projetado
          </Botao>
        </Card>
      </ul>
    </div>
  );
}
