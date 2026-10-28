import { TrilhaDePassos } from "@/components/trilha/TrilhaDePassos";
import { Aviso } from "@/components/ui/Aviso";
import { Painel } from "@/components/ui/Painel";

export const metadata = { title: "Discente · Trilha" };

const PASSOS = [
  {
    titulo: "Envie o histórico do SIGAA",
    texto:
      "O PDF é lido localmente. Nome, matrícula, notas e demais dados pessoais são descartados antes de qualquer processamento.",
  },
  {
    titulo: "Escolha até duas profissões-alvo",
    texto:
      "As mesmas seis profissões que a coordenação analisa, ligadas aos itinerários formativos do curso.",
  },
  {
    titulo: "Receba optativas e eletivas elegíveis",
    texto:
      "Respeitando pré-requisitos, as regras dos grupos de componentes da sua estrutura curricular (2013.2 ou 2025.1) e a carga horária que falta.",
  },
  {
    titulo: "Veja por que cada sugestão",
    texto:
      "Trecho da ementa, competência e profissão. A ordem é calculada sem IA generativa; o modelo de linguagem só redige a explicação.",
  },
];

const BLOCO = "rounded-md bg-panel-raised p-5";
const ITEM = "flex flex-wrap items-center gap-3 rounded-md bg-panel-raised px-5 py-4";
const CODIGO = "rounded-md bg-lime px-1.5 font-mono text-on-lime";

export default function Discente() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-[820px] flex-col gap-4">
        <h1 className="font-display m-0 text-[32px] leading-9 font-extrabold tracking-[-0.01em] md:text-[40px] md:leading-11">
          Planeje sua trajetória rumo à profissão que você quer
        </h1>
        <Aviso tom="atencao" role="status">
          Módulo em desenvolvimento: ainda não disponível neste protótipo. Abaixo, o que está
          projetado.
        </Aviso>
      </div>

      <TrilhaDePassos passos={PASSOS} nivelDoTitulo="h2" />

      <Painel as="section" relevo aria-labelledby="previa" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="previa" className="m-0 text-2xl leading-[30px] font-bold">
            Como a recomendação vai aparecer
          </h2>
          <span className="rounded-full bg-lime px-3 py-0.5 text-xs font-bold text-on-lime">
            ESBOÇO · SEM DADOS REAIS
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          <div className={BLOCO}>
            <span className="text-sm text-on-panel-muted">Carga horária optativa pendente</span>
            <b className="block text-[32px] leading-10">[___ h]</b>
          </div>
          <div className={BLOCO}>
            <span className="text-sm text-on-panel-muted">Estrutura curricular</span>
            <b className="block text-[32px] leading-10">[2025.1]</b>
          </div>
          <div className={BLOCO}>
            <span className="text-sm text-on-panel-muted">Profissões-alvo</span>
            <b className="block text-xl leading-10">[até duas]</b>
          </div>
        </div>
        <ol className="m-0 grid list-none gap-2 p-0">
          <li className={ITEM}>
            <span className={CODIGO}>[SMD____]</span>
            <b>[Componente optativo]</b>
            <span className="text-sm text-on-panel-muted">
              [itinerário] · [competência coberta] · [carga horária]
            </span>
            <span className="ml-auto text-sm font-bold">Por que isto?</span>
          </li>
          <li className={ITEM}>
            <span className={CODIGO}>[SMD____]</span>
            <b>[Componente eletivo]</b>
            <span className="text-sm text-on-panel-muted">
              [grupo de componentes] · [competência coberta]
            </span>
            <span className="ml-auto text-sm font-bold">Por que isto?</span>
          </li>
        </ol>
      </Painel>

      <p className="m-0 text-ink-muted">
        A recomendação apoia, mas não substitui, a orientação do Grupo de Professores Tutores e da
        coordenação.
      </p>
    </div>
  );
}
