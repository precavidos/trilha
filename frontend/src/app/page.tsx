import Link from "next/link";

export default function Inicio() {
  return (
    <div className="space-y-8">
      <section aria-labelledby="titulo-inicio" className="space-y-3">
        <h1 id="titulo-inicio" className="text-3xl font-bold">
          Currículos e trajetórias alinhados às profissões do futuro
        </h1>
        <p className="text-lg text-muted">
          O Trilha confronta o PPC de Sistemas e Mídias Digitais com as
          competências exigidas pelo mercado, sempre mostrando as evidências de
          cada conclusão.
        </p>
      </section>

      <ul className="grid gap-4 sm:grid-cols-2">
        <li className="rounded border border-border p-6 space-y-2">
          <h2 className="text-xl font-bold">Coordenação e NDE</h2>
          <p>Lacunas de competências do PPC e atualidade das bibliografias.</p>
          <Link href="/coordenacao" className="font-bold text-accent underline">
            Analisar o PPC
          </Link>
        </li>
        <li className="rounded border border-border p-6 space-y-2">
          <h2 className="text-xl font-bold">Discente</h2>
          <p>
            Optativas e eletivas que aproximam sua trajetória da profissão que
            você deseja.
          </p>
          <Link href="/discente" className="font-bold text-accent underline">
            Planejar minha trajetória
          </Link>
        </li>
      </ul>
    </div>
  );
}
