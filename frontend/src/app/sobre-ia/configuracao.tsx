"use client";

import type { Metadados } from "@/lib/api";
import { useApi } from "@/lib/use-api";

type Sobre = {
  metadados: Metadados;
  modeloDeLinguagem: string;
  limiares: {
    cobertaSimilaridade: number;
    cobertaEscore: number;
    parcialSimilaridade: number;
    parcialEscore: number;
  };
};

/** Configuração em uso, lida do backend para não divergir do que de fato produziu os resultados. */
export function Configuracao() {
  const { dados, erro } = useApi<Sobre>("/api/sobre");

  return (
    <section aria-labelledby="configuracao" className="space-y-3">
      <h2 id="configuracao" className="text-2xl font-bold">Configuração em uso</h2>
      {erro && <p className="text-lacuna">Não foi possível consultar o servidor ({erro}).</p>}
      {!dados && !erro && <p aria-busy="true">Consultando o servidor…</p>}
      {dados && (
        <>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[max-content_1fr]">
            <dt className="font-bold">Documento</dt>
            <dd>{dados.metadados.documento}</dd>
            <dt className="font-bold">Vocabulário</dt>
            <dd>{dados.metadados.vocabulario}</dd>
            <dt className="font-bold">Modelo de embeddings</dt>
            <dd>{dados.metadados.modeloDeEmbeddings} — executado localmente</dd>
            <dt className="font-bold">Modelo de linguagem</dt>
            <dd>{dados.modeloDeLinguagem} — só nas justificativas</dd>
            <dt className="font-bold">Análise gerada em</dt>
            <dd>{dados.metadados.geradoEm}</dd>
          </dl>
          <p>
            <strong>Regra de situação.</strong> &ldquo;Similaridade&rdquo; é a maior similaridade
            entre a competência e uma ementa; &ldquo;escore&rdquo; mede quanto essa ementa se destaca
            das demais para a mesma competência. <em>Coberta</em>: similaridade ≥{" "}
            {dados.limiares.cobertaSimilaridade} ou escore ≥ {dados.limiares.cobertaEscore}.{" "}
            <em>Parcial</em>: similaridade ≥ {dados.limiares.parcialSimilaridade} ou escore ≥{" "}
            {dados.limiares.parcialEscore}. <em>Lacuna</em>: abaixo disso.
          </p>
        </>
      )}
    </section>
  );
}
