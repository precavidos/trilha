import { Configuracao } from "./configuracao";

export const metadata = { title: "Sobre a IA · Trilha" };

export default function SobreIa() {
  return (
    <article className="max-w-3xl space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">Sobre a IA neste sistema</h1>
        <p className="text-lg text-muted">
          O que o Trilha faz com inteligência artificial, com quais dados, e onde ele pode errar.
        </p>
      </header>

      <section aria-labelledby="como" className="space-y-3">
        <h2 id="como" className="text-2xl font-bold">Como as conclusões são produzidas</h2>
        <ol className="list-decimal space-y-3 pl-6">
          <li>
            <strong>Extração do PPC.</strong> Um programa lê o PDF do PPC e separa ementas e
            bibliografias de cada componente curricular. A equipe revisa o resultado.
          </li>
          <li>
            <strong>Vocabulário de competências.</strong> As exigências de cada profissão-alvo vêm da
            taxonomia europeia ESCO. As competências de IA, que a ESCO não cobre, foram propostas
            pela equipe (Extensão IA).
          </li>
          <li>
            <strong>Similaridade semântica, sem IA generativa.</strong> Um modelo de embeddings
            multilíngue, executado localmente, compara o texto de cada competência com todas as
            ementas. A situação (coberta, parcial ou lacuna) é calculada por limiares fixos: o mesmo
            PPC sempre produz o mesmo resultado.
          </li>
          <li>
            <strong>Justificativa com IA generativa, sob demanda.</strong> No botão &ldquo;Por que
            isto?&rdquo;, um modelo de linguagem recebe só a competência e as ementas recuperadas
            (técnica conhecida como RAG) e redige uma explicação que deve citá-las pelo código. Ele
            não altera a situação calculada.
          </li>
          <li>
            <strong>Idade da bibliografia.</strong> Cálculo simples sobre os anos de publicação das
            referências; nenhum modelo de IA é usado.
          </li>
        </ol>
      </section>

      <section aria-labelledby="dados" className="space-y-3">
        <h2 id="dados" className="text-2xl font-bold">Dados tratados e privacidade</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Só documentos institucionais públicos são enviados ao modelo de linguagem: ementas do PPC
            e descrições de competências. Nenhum dado pessoal sai do computador onde o Trilha roda.
          </li>
          <li>
            O módulo discente, em desenvolvimento, lê o histórico do SIGAA localmente e descarta
            nome, matrícula, notas e demais dados pessoais antes de qualquer processamento.
          </li>
          <li>O sistema não exige login e não guarda dados de quem o utiliza.</li>
        </ul>
      </section>

      <Configuracao />

      <section aria-labelledby="limites" className="space-y-3">
        <h2 id="limites" className="text-2xl font-bold">Limitações conhecidas</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            A similaridade semântica pode associar uma competência a uma ementa por proximidade de
            vocabulário, não de conteúdo. Por isso toda situação mostra as evidências, e a precisão
            foi medida com rótulos humanos (ver memorial).
          </li>
          <li>
            O PPC analisado não traz ementa para parte dos componentes; esses componentes não podem
            cobrir nenhuma competência.
          </li>
          <li>
            Os rótulos da ESCO em português estão no padrão europeu (&ldquo;utilizador&rdquo;,
            &ldquo;conceção&rdquo;) e foram mantidos como na fonte.
          </li>
          <li>
            A demanda de mercado vem da ESCO, uma referência institucional; a coleta de vagas
            brasileiras fica como trabalho futuro.
          </li>
          <li>
            O Trilha é uma ferramenta de apoio à decisão. Não substitui o NDE, o Grupo de Professores
            Tutores nem a coordenação do curso.
          </li>
        </ul>
      </section>

      <section aria-labelledby="desenvolvimento" className="space-y-3">
        <h2 id="desenvolvimento" className="text-2xl font-bold">IA no desenvolvimento do Trilha</h2>
        <p>
          O código foi escrito com apoio de IA generativa (Claude Code). As decisões de projeto, a
          revisão dos dados e a validação são da equipe, e estão registradas no repositório.
        </p>
      </section>
    </article>
  );
}
