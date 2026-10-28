import { Aviso } from "@/components/ui/Aviso";
import { FluxoDiscente } from "./fluxo";

export const metadata = { title: "Discente · Trilha" };

export default function Discente() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-[900px] flex-col gap-2">
        <p className="text-ink-muted m-0 text-sm leading-5 font-bold tracking-[.06em] uppercase">
          Discente · Sistemas e Mídias Digitais
        </p>
        <h1 className="font-display m-0 text-[32px] leading-9 font-extrabold tracking-[-0.01em] md:text-[40px] md:leading-11">
          Sua trilha até a profissão que você quer
        </h1>
        <p className="text-ink-muted m-0">
          Optativas e eletivas que aproximam sua trajetória das profissões-alvo, com o porquê de cada sugestão. Leva uns
          dois minutos.
        </p>
      </div>

      <FluxoDiscente />

      <Aviso tom="info">
        A recomendação apoia, mas não substitui, a orientação do Grupo de Professores Tutores e da coordenação.
      </Aviso>
    </div>
  );
}
