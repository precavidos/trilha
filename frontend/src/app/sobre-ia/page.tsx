import { TrilhaDePassos } from "@/components/trilha/TrilhaDePassos";
import { Card } from "@/components/ui/Card";
import { Painel } from "@/components/ui/Painel";
import { Configuracao } from "./configuracao";

export const metadata = { title: "Sobre a IA · Trilha" };

const PASSOS = [
  {
    titulo: "Extração do PPC",
    texto: "Um programa lê o PDF e separa ementas e bibliografias. A equipe revisa o resultado.",
    tag: "sem IA",
  },
  {
    titulo: "Vocabulário de competências",
    texto: "Exigências de cada profissão-alvo vêm da ESCO; as de IA, da Extensão IA da equipe.",
    tag: "curadoria humana",
  },
  {
    titulo: "Similaridade semântica",
    texto:
      "Um modelo de embeddings, executado localmente, compara cada competência com todas as ementas.",
    tag: "IA local, não generativa",
  },
  {
    titulo: "Situação por limiares",
    texto: "Coberta, parcial ou lacuna por limiares fixos: o mesmo PPC sempre dá o mesmo resultado.",
    tag: "sem IA",
  },
  {
    titulo: "Justificativa, sob demanda",
    texto:
      "No “Por que isto?”, um modelo de linguagem recebe só as evidências e redige o texto. Não altera a situação.",
    tag: "IA generativa",
    tagGenerativa: true,
  },
];

const H2 = "m-0 text-2xl leading-[30px] font-bold";

export default function SobreIa() {
  return (
    <div className="flex flex-col gap-12">
      <header className="flex max-w-[760px] flex-col gap-2">
        <h1 className="font-display m-0 text-[32px] leading-9 font-extrabold tracking-[-0.01em] md:text-[40px] md:leading-11">
          Sobre a IA neste sistema
        </h1>
        <p className="m-0 text-lg leading-7 text-ink-muted">
          O que o Trilha faz com inteligência artificial, com quais dados, e onde ele pode errar.
        </p>
      </header>

      <section aria-labelledby="como" className="flex flex-col gap-4">
        <h2 id="como" className={H2}>
          Como as conclusões são produzidas
        </h2>
        <TrilhaDePassos passos={PASSOS} />
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Configuracao />
        <Painel as="section" aria-labelledby="dados" className="flex flex-col gap-4">
          <h2 id="dados" className={H2}>
            Dados tratados e privacidade
          </h2>
          <ul className="m-0 grid list-disc gap-2.5 pl-5">
            <li>
              Só documentos públicos vão ao modelo de linguagem: ementas do PPC e descrições de
              competências.
            </li>
            <li>
              O módulo discente lerá o histórico do SIGAA localmente e descartará nome, matrícula e
              notas antes de qualquer processamento.
            </li>
            <li>Sem login, e nada de quem usa o sistema é guardado.</li>
          </ul>
        </Painel>
      </div>

      <Card as="section" aria-labelledby="limites" className="flex flex-col gap-4 p-8">
        <h2 id="limites" className={H2}>
          Limitações conhecidas
        </h2>
        <ul className="m-0 grid list-disc gap-2.5 pl-5">
          <li>
            A similaridade pode aproximar uma competência de uma ementa por vocabulário, não por
            conteúdo. Por isso toda situação mostra as evidências, e a precisão foi medida com
            rótulos humanos.
          </li>
          <li>23 dos 80 componentes não têm ementa no PPC e não podem cobrir nenhuma competência.</li>
          <li>
            Os rótulos da ESCO em português seguem o padrão europeu (“utilizador”, “conceção”) e
            foram mantidos como na fonte.
          </li>
          <li>
            A demanda de mercado vem das competências que a ESCO associa a cada ocupação; a coleta
            de vagas brasileiras fica como trabalho futuro.
          </li>
          <li>
            Validação com rótulos humanos (<code>docs/validacao/resultado.md</code>): em 41
            julgamentos, a concordância entre os dois avaliadores da equipe foi de 0,76 (kappa de
            Cohen). Quando o sistema diz <em>coberta</em>, acerta 79% das vezes; quando diz{" "}
            <em>lacuna</em>, 57%. <em>Parcial</em> é a situação menos confiável: em 9 de 13 casos,
            os avaliadores disseram que a ementa não trata do tema.
          </li>
        </ul>
      </Card>

      <p className="m-0 text-sm text-ink-muted">
        O código foi escrito com apoio de IA generativa (Claude Code). Decisões de projeto, revisão
        dos dados e validação são da equipe.
      </p>
    </div>
  );
}
