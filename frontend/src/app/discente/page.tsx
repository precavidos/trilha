export const metadata = { title: "Discente · Trilha" };

export default function Discente() {
  return (
    <article className="max-w-3xl space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">Discente</h1>
        <p role="status" className="rounded border-2 border-parcial bg-parcial-bg p-4 font-bold text-parcial">
          Módulo em desenvolvimento: ainda não disponível neste protótipo.
        </p>
      </header>

      <section aria-labelledby="planejado" className="space-y-3">
        <h2 id="planejado" className="text-2xl font-bold">O que está projetado</h2>
        <ol className="list-decimal space-y-2 pl-6">
          <li>
            Você envia o histórico em PDF emitido pelo SIGAA. Ele é lido localmente; nome, matrícula,
            notas e demais dados pessoais são descartados antes de qualquer processamento.
          </li>
          <li>Você escolhe até duas profissões-alvo.</li>
          <li>
            O Trilha sugere optativas e eletivas que respeitam pré-requisitos, as regras dos grupos de
            componentes da sua estrutura curricular (2013.2 ou 2025.1) e a carga horária que ainda
            falta, falando a língua dos itinerários formativos do curso.
          </li>
          <li>
            Cada sugestão vem com as evidências: trecho da ementa, competência e profissão. A ordem das
            sugestões é calculada sem IA generativa; o modelo de linguagem só redige a explicação.
          </li>
        </ol>
        <p className="text-muted">
          A recomendação apoia, mas não substitui, a orientação do Grupo de Professores Tutores e da
          coordenação.
        </p>
      </section>
    </article>
  );
}
