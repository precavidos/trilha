import { TrilhaDePassos } from "@/components/trilha/TrilhaDePassos";
import { Aviso } from "@/components/ui/Aviso";
import { FluxoDiscente } from "./fluxo";

export const metadata = { title: "Discente · Trilha" };

const PASSOS = [
  {
    titulo: "Envie o histórico do SIGAA",
    texto:
      "O PDF é lido em memória e não é gravado. Nome, matrícula, notas e demais dados pessoais são descartados na leitura.",
  },
  {
    titulo: "Escolha até duas profissões-alvo",
    texto: "As mesmas seis profissões que a coordenação analisa, ligadas aos itinerários formativos do curso.",
  },
  {
    titulo: "Receba optativas e eletivas elegíveis",
    texto:
      "Respeitando pré-requisitos, equivalências e as regras dos grupos de componentes da sua estrutura curricular (Diurno 2010.1, 2013.2 ou 2025.1; Noturno 2013.2, 2016.1, 2016.1A ou 2025.1).",
  },
  {
    titulo: "Veja por que cada sugestão",
    texto:
      "Competências da profissão que a ementa contempla, itinerário formativo e grupo. A ordem é calculada sem IA generativa.",
  },
];

export default function Discente() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-[820px] flex-col gap-4">
        <h1 className="font-display m-0 text-[32px] leading-9 font-extrabold tracking-[-0.01em] md:text-[40px] md:leading-11">
          Planeje sua trajetória rumo à profissão que você quer
        </h1>
        <Aviso tom="info">
          Protótipo para o curso de Sistemas e Mídias Digitais (Diurno e Noturno). A recomendação apoia, mas não
          substitui, a orientação do Grupo de Professores Tutores e da coordenação.
        </Aviso>
      </div>

      <TrilhaDePassos passos={PASSOS} nivelDoTitulo="h2" />

      <FluxoDiscente />
    </div>
  );
}
