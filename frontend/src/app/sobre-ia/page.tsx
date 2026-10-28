import { TrilhaDePassos } from "@/components/trilha/TrilhaDePassos";
import { Card } from "@/components/ui/Card";
import { Painel } from "@/components/ui/Painel";
import { Configuracao } from "./configuracao";

export const metadata = { title: "Sobre a IA · Trilha" };

const PASSOS = [
  {
    titulo: "Extração do PPC e dos programas",
    texto:
      "Um programa lê o PPC e os programas de disciplina e separa ementas, objetivos e bibliografias. A equipe revisa o resultado.",
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
    texto:
      "Coberta, parcial ou lacuna por limiares fixos; linguagens, frameworks e programas com nome, por onde o nome aparece. O mesmo PPC sempre dá o mesmo resultado.",
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
              O módulo discente lê o histórico do SIGAA em memória e descarta nome, matrícula, notas
              e nomes de docentes na leitura; nada é gravado.
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
          <li>
            23 dos 80 componentes não têm ementa no PPC. Em 12 deles, a ementa vem do programa da
            disciplina (formulário da PROGRAD); os outros 11 não podem cobrir nenhuma competência.
          </li>
          <li>
            Para linguagens, frameworks e programas com nome (C#, Python, WordPress…), a
            similaridade engana. Nesses casos vale onde o nome aparece no PPC e nos programas.
            Quando não aparece, a situação é “não documentada”, não lacuna: o professor escolhe as
            ferramentas a cada semestre, e a ementa raramente as registra.
          </li>
          <li>
            Os rótulos da ESCO em português seguem o padrão europeu (“utilizador”, “conceção”) e
            foram mantidos como na fonte.
          </li>
          <li>
            A demanda de mercado vem das competências que a ESCO associa a cada ocupação; a coleta
            de vagas brasileiras fica como trabalho futuro.
          </li>
          <li>
            Validação com rótulos humanos (<code>docs/validacao/revalidacao/resultado.md</code>): 60
            julgamentos de dois avaliadores da equipe (kappa de Cohen de 0,76 na primeira rodada e
            0,85 na segunda). Quando o sistema diz <em>coberta</em>, acerta 89% das vezes; quando
            diz <em>lacuna</em>, 50%. <em>Parcial</em> é a situação menos confiável: em 13 de 23
            casos, os avaliadores disseram que o componente não trata do tema. Das tecnologias{" "}
            <em>não documentadas</em>, 8 de 9 foram julgadas como não tratadas.
          </li>
          <li>
            Ementas muito curtas atraem competências genéricas. A de Concepção de Cenários e
            Personagens (“Concept art. Design de personagens. Criação de cenários. Projetos
            práticos.”) é o único registro da disciplina e errou em 4 de 7 pares avaliados. É um
            limite da documentação, não só do método.
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
