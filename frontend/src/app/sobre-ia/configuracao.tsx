"use client";

import { Card } from "@/components/ui/Card";
import { ErroDaApi } from "@/components/ui/ErroDaApi";
import { PontoSituacao } from "@/components/ui/ChipSituacao";
import type { Sobre } from "@/lib/api";
import { dataBR, formatarDecimal, formatarSimilaridade } from "@/lib/formato";
import { useApi } from "@/lib/use-api";

const BLOCO = "rounded-md p-3.5";

/** Configuração em uso, lida do backend para não divergir do que de fato produziu os resultados. */
export function Configuracao() {
  const { dados, erro, recarregar } = useApi<Sobre>("/api/sobre");

  return (
    <Card as="section" className="flex flex-col gap-4 p-8" aria-labelledby="configuracao">
      <h2 id="configuracao" className="m-0 text-2xl leading-[30px] font-bold">
        Configuração em uso
      </h2>
      {erro && <ErroDaApi erro={erro} aoTentarDeNovo={() => recarregar()} />}
      {!dados && !erro && <p aria-busy="true">Consultando o servidor…</p>}
      {dados && (
        <>
          <dl className="m-0 grid min-w-0 grid-cols-[max-content_minmax(0,1fr)] gap-x-5 gap-y-2.5">
            <dt className="font-bold">Documento</dt>
            <dd className="m-0 [overflow-wrap:anywhere]">{dados.metadados.documento}</dd>
            <dt className="font-bold">Vocabulário</dt>
            <dd className="m-0 [overflow-wrap:anywhere]">{dados.metadados.vocabulario}</dd>
            <dt className="font-bold">Embeddings</dt>
            <dd className="m-0 [overflow-wrap:anywhere]">{dados.metadados.modeloDeEmbeddings}, executado localmente</dd>
            <dt className="font-bold">Linguagem</dt>
            <dd className="m-0 [overflow-wrap:anywhere]">{dados.modeloDeLinguagem}, só nas justificativas</dd>
            <dt className="font-bold">Análise gerada</dt>
            <dd className="m-0 [overflow-wrap:anywhere]">{dataBR(dados.metadados.geradoEm)}</dd>
          </dl>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className={`${BLOCO} bg-coberta-bg text-coberta`}>
              <b className="flex items-center gap-1.5">
                <PontoSituacao status="COBERTA" />
                Coberta
              </b>
              <span className="text-sm">
                similaridade ≥ {formatarSimilaridade(dados.limiares.cobertaSimilaridade)} ou escore ≥{" "}
                {formatarDecimal(dados.limiares.cobertaEscore)}
              </span>
            </div>
            <div className={`${BLOCO} bg-parcial-bg text-parcial`}>
              <b className="flex items-center gap-1.5">
                <PontoSituacao status="PARCIAL" />
                Parcial
              </b>
              <span className="text-sm">
                similaridade ≥ {formatarSimilaridade(dados.limiares.parcialSimilaridade)} ou escore ≥{" "}
                {formatarDecimal(dados.limiares.parcialEscore)}
              </span>
            </div>
            <div className={`${BLOCO} bg-lacuna-bg text-lacuna`}>
              <b className="flex items-center gap-1.5">
                <PontoSituacao status="LACUNA" />
                Lacuna
              </b>
              <span className="text-sm">abaixo disso</span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
