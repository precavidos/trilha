import { PainelCoordenacao } from "./painel";

export default function Coordenacao() {
  return (
    <div className="space-y-8">
      <section aria-labelledby="titulo" className="space-y-3">
        <h1 id="titulo" className="text-3xl font-bold">
          Coordenação e NDE
        </h1>
        <p className="text-lg text-muted">
          Onde o PPC deixa de contemplar competências exigidas pelas profissões-alvo e quão atual
          está a bibliografia. Toda situação tem evidências em &ldquo;Por que isto?&rdquo;.
        </p>
      </section>
      <PainelCoordenacao />
    </div>
  );
}
