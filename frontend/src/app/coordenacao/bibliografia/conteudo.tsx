"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ErroDaApi } from "@/components/ui/ErroDaApi";
import { Kpi } from "@/components/ui/Kpi";
import { LinhaBibliografia } from "@/components/trilha/LinhaBibliografia";
import type { IdadeBibliografia, Resumo } from "@/lib/api";
import {
  contarBibliografiasAntigas,
  EIXO_INICIO,
  extremosDaBibliografia,
} from "@/lib/calculos";
import { useApi } from "@/lib/use-api";

/** Idade da bibliografia: KPIs e linha do tempo dos anos de publicação por componente. */
export function Conteudo() {
  const resumo = useApi<Resumo>("/api/resumo");
  const bibliografia = useApi<IdadeBibliografia[]>("/api/bibliografia");

  if (resumo.erro)
    return <ErroDaApi erro={resumo.erro} aoTentarDeNovo={resumo.recarregar} />;
  if (bibliografia.erro)
    return (
      <ErroDaApi
        erro={bibliografia.erro}
        aoTentarDeNovo={bibliografia.recarregar}
      />
    );
  if (!resumo.dados || !bibliografia.dados)
    return <p aria-busy="true">Carregando bibliografias…</p>;

  const r = resumo.dados;
  const linhas = bibliografia.dados;
  const ano = r.metadados.anoDeReferencia;
  const extremos = extremosDaBibliografia(linhas);
  const passo = (ano - EIXO_INICIO) / 3;
  const rotulosEixo = [0, 1, 2, 3].map((i) =>
    Math.round(EIXO_INICIO + passo * i),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-[760px] flex-col gap-2">
        <Link href="/coordenacao" className="text-sm font-bold">
          ← Lacunas por profissão-alvo
        </Link>
        <h1 className="font-display m-0 text-[32px] leading-9 tracking-[-0.01em] md:text-[40px] md:leading-11">
          Idade da bibliografia
        </h1>
        <p className="text-ink-muted m-0">
          Anos de publicação das referências básicas e complementares de cada
          componente curricular, segundo o PPC. Cálculo simples, sem nenhum
          modelo de IA. Ano de referência: {ano}.
        </p>
      </div>

      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4 p-0">
        <li className="*:h-full">
          <Kpi
            variante="painel"
            valor={contarBibliografiasAntigas(linhas)}
            denominador={linhas.length}
            rotulo="componentes com metade ou mais das referências acima de 10 anos"
          />
        </li>
        <li className="*:h-full">
          <Kpi
            valor={r.medianaGeralDaBibliografia ?? "—"}
            rotulo="mediana dos anos medianos por componente"
          />
        </li>
        <li className="*:h-full">
          <Kpi
            valor={extremos?.maisAntiga ?? "—"}
            rotulo="referência datada mais antiga"
          />
        </li>
        <li className="*:h-full">
          <Kpi
            variante="lima"
            valor={extremos?.maisRecente ?? "—"}
            rotulo="referência datada mais recente"
          />
        </li>
      </ul>

      <Card as="section" className="flex flex-col gap-4 p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="m-0 text-2xl leading-[30px] font-bold">
            Por componente, mais antigas primeiro
          </h2>
          <ul className="m-0 flex list-none flex-wrap gap-4 p-0 text-sm leading-5">
            <li className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="bg-green h-2.5 w-7 rounded-[5px]"
              />
              intervalo dos anos
            </li>
            <li className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="bg-ink h-[18px] w-1 rounded-sm"
              />
              ano mediano
            </li>
            <li className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="border-lacuna h-[18px] w-0 border-l-2 border-dashed"
              />
              corte de 10 anos ({ano - 10})
            </li>
          </ul>
        </div>
        <div
          aria-hidden="true"
          className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_auto] gap-4 px-2 md:grid"
        >
          <span />
          <div className="text-ink-muted flex justify-between text-xs leading-4">
            {rotulosEixo.map((a) => (
              <span key={a}>{a}</span>
            ))}
          </div>
          <span />
        </div>
        <ol className="m-0 list-none p-0">
          {linhas.map((l) => (
            <LinhaBibliografia key={l.codigo} linha={l} anoDeReferencia={ano} />
          ))}
        </ol>
      </Card>
    </div>
  );
}
