"use client";

import { useEffect, useRef, useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Card } from "@/components/ui/Card";
import { ChipSituacao } from "@/components/ui/ChipSituacao";
import { FiltroPilulas } from "@/components/ui/FiltroPilulas";
import { cx } from "@/lib/cx";
import type { ItemRecomendado, Recomendacao } from "@/lib/api";
import { filtrar, filtrosDisponiveis, type Filtro } from "@/lib/discente";
import { formatarSimilaridade, RELACOES } from "@/lib/formato";
import { TURNOS } from "./onde-voce-esta";
import { Rascunho } from "./rascunho";

/** "Essencial" → "essencial", "Transversal (IA)" → "transversal (IA)": só a inicial, para a sigla ficar. */
function minusculaInicial(t: string) {
  return t.charAt(0).toLowerCase() + t.slice(1);
}

export function nomeDaEstrutura(estrutura: string, turno: keyof typeof TURNOS | null) {
  return turno ? `${TURNOS[turno]} ${estrutura}` : estrutura;
}

const EVIDENCIAS_VISIVEIS = 5;

/** Etapa 03: sugestões com filtros, evidências e o rascunho de semestre ao lado. */
export function Sugestoes({
  recomendacao: r,
  filtro,
  aoFiltrar,
  rascunho,
  aoAlternar,
  comExtensao,
  chPendente,
  aoImprimir,
}: {
  recomendacao: Recomendacao;
  filtro: Filtro;
  aoFiltrar(f: Filtro): void;
  rascunho: ItemRecomendado[];
  aoAlternar(item: ItemRecomendado): void;
  comExtensao: boolean;
  chPendente: number | null;
  aoImprimir(): void;
}) {
  // Leva o foco ao título: anuncia o resultado sem ler a lista inteira numa região viva.
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => titulo.current?.focus(), [r]);

  const visiveis = filtrar(r.itens, filtro);
  const noRascunho = new Set(rascunho.map((i) => i.codigo));

  return (
    <section aria-labelledby="titulo-recomendacoes" className="flex flex-col gap-4">
      <div className="flex max-w-[860px] flex-col gap-1.5">
        <h2 id="titulo-recomendacoes" ref={titulo} tabIndex={-1} className="m-0 text-2xl leading-[30px] font-bold">
          <span className="font-display text-ink-muted mr-2 font-extrabold">03</span>Sugestões para{" "}
          {r.profissoes.join(" e ")}
        </h2>
        <p className="text-ink-muted m-0">
          {r.chOptativaPendente != null
            ? `Faltam ${r.chOptativaPendente} h de carga optativa (cerca de ${r.componentesSugeridos} componente${r.componentesSugeridos === 1 ? "" : "s"} de 64 h). `
            : ""}
          Só aparecem componentes da sua estrutura ({nomeDaEstrutura(r.estrutura, r.turno)}) que você ainda não cursou e
          cujos pré-requisitos já cumpriu.
        </p>
      </div>
      {r.avisos.map((a) => (
        <Aviso key={a} tom="info">
          {a}
        </Aviso>
      ))}
      {r.itens.length === 0 ? (
        <Aviso tom="atencao">Nenhum componente elegível tem relação com as profissões escolhidas.</Aviso>
      ) : (
        <>
          <FiltroPilulas
            legenda="Mostrar sugestões"
            nome="filtro-sugestoes"
            opcoes={filtrosDisponiveis(r, comExtensao)}
            valor={filtro}
            aoMudar={aoFiltrar}
          />
          <div className="grid grid-cols-1 items-start gap-6 min-[980px]:grid-cols-[minmax(0,1fr)_300px]">
            <ol className="m-0 grid list-none gap-3 p-0">
              {visiveis.map((item, i) => (
                <ItemSugerido
                  key={item.codigo}
                  item={item}
                  posicao={i + 1}
                  primeiro={i === 0}
                  noRascunho={noRascunho.has(item.codigo)}
                  aoAlternar={() => aoAlternar(item)}
                />
              ))}
            </ol>
            <Rascunho rascunho={rascunho} chPendente={chPendente} aoImprimir={aoImprimir} aoRemover={aoAlternar} />
          </div>
        </>
      )}
    </section>
  );
}

function ItemSugerido({
  item,
  posicao,
  primeiro,
  noRascunho,
  aoAlternar,
}: {
  item: ItemRecomendado;
  posicao: number;
  primeiro: boolean;
  noRascunho: boolean;
  aoAlternar(): void;
}) {
  const [todas, setTodas] = useState(false);
  const evidencias = todas ? item.evidencias : item.evidencias.slice(0, EVIDENCIAS_VISIVEIS);
  const porProfissao = Object.entries(item.contagem.porProfissao)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <Card as="li" className="grid grid-cols-1 gap-x-4 gap-y-2 p-5 min-[760px]:grid-cols-[auto_minmax(0,1fr)]">
      <span
        aria-hidden="true"
        className={cx(
          "grid size-11 -rotate-45 place-items-center rounded-[50%_50%_50%_8px] max-[759px]:hidden min-[760px]:row-span-3",
          primeiro ? "bg-lime" : "bg-panel",
        )}
      >
        <span className={cx("font-display rotate-45 text-[15px] leading-none font-extrabold", primeiro ? "text-on-lime" : "text-cream")}>
          {posicao}
        </span>
      </span>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="min-[760px]:hidden text-ink-muted text-sm font-bold" aria-hidden="true">
          {posicao}.
        </span>
        <span className="bg-lime text-on-lime rounded-md px-1.5 font-mono text-sm">{item.codigo}</span>
        <h3 className="m-0 min-w-0 flex-1 text-xl leading-[26px] font-bold">{item.nome}</h3>
        {item.ch != null && <span className="text-ink-muted text-sm">{item.ch} h</span>}
        <button
          type="button"
          aria-pressed={noRascunho}
          onClick={aoAlternar}
          className={cx(
            "inline-flex min-h-11 flex-none cursor-pointer items-center rounded-full border-2 px-5 text-sm leading-5 font-bold",
            noRascunho ? "bg-lime text-on-lime border-lime" : "border-line-strong text-ink hover:bg-surface-sunken bg-transparent",
          )}
        >
          {noRascunho ? "No rascunho" : "Adicionar ao rascunho"}
          <span className="sr-only"> — {item.nome}</span>
        </button>
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0 text-sm leading-5">
        {item.itinerarios.map((p) => (
          <li key={p.itinerario} className="bg-lime-soft rounded-full px-3 py-0.5">
            Itinerário {p.itinerario} ({p.papel})
          </li>
        ))}
        {item.grupo && (
          <li className="bg-surface-sunken rounded-full px-3 py-0.5">
            {item.grupo.grupo}: {item.grupo.cumpridos} de {item.grupo.minimo} cumpridos
          </li>
        )}
        {item.contaExtensao && <li className="bg-sky rounded-full px-3 py-0.5">Conta carga de extensão</li>}
      </ul>
      {(porProfissao.length > 0 || item.contagem.naoCobertas > 0) && (
        <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm leading-5">
          {porProfissao.map(([p, n]) => (
            <span key={p}>
              <b className="text-base">{n}</b> competência{n === 1 ? "" : "s"} de {p}
            </span>
          ))}
          {item.contagem.naoCobertas > 0 && (
            <span className="text-ink-muted">{item.contagem.naoCobertas} delas o PPC cobre só em parte ou não cobre</span>
          )}
        </p>
      )}
      {item.notaEmenta && (
        <p className="bg-parcial-bg text-parcial m-0 flex items-start gap-2 rounded-md px-3 py-2 text-sm leading-5 min-[760px]:col-start-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="mt-px size-[18px] flex-none"
          >
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
          {item.notaEmenta}
        </p>
      )}
      <details open={primeiro} className="group min-[760px]:col-start-2">
        <summary className="border-line-strong group-open:bg-panel group-open:border-panel group-open:text-on-panel inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 px-4 text-sm leading-5 font-bold">
          Por que isto?<span className="sr-only"> — {item.nome}</span>
        </summary>
        <div className="mt-3 grid gap-4">
          {item.evidencias.length > 0 ? (
            <>
              <p className="m-0">
                A ementa está entre as três mais próximas destas competências das profissões que você escolheu (
                {item.evidencias.length} no total; as mais próximas primeiro):
              </p>
              <ul className="m-0 grid list-none gap-2 p-0">
                {evidencias.map((c) => (
                  <li
                    key={`${c.competencia}-${c.profissao}`}
                    className="bg-panel-raised text-on-panel grid grid-cols-1 items-center gap-x-3 gap-y-1 rounded-md px-4 py-3 text-sm leading-5 min-[760px]:grid-cols-[auto_minmax(0,1fr)_auto]"
                  >
                    <span className="justify-self-start">
                      <ChipSituacao status={c.situacaoNoPpc} />
                    </span>
                    <span>
                      <b>{c.rotulo}</b>
                      <small className="text-on-panel-muted block text-[13px]">
                        {minusculaInicial(RELACOES[c.relacao] ?? c.relacao)} para {c.profissao} · situação no PPC
                      </small>
                    </span>
                    <span className="text-on-panel-muted whitespace-nowrap">
                      {c.posicao + 1}ª mais próxima · {formatarSimilaridade(c.similaridade)}
                    </span>
                  </li>
                ))}
              </ul>
              {item.evidencias.length > EVIDENCIAS_VISIVEIS && (
                <button
                  type="button"
                  aria-expanded={todas}
                  onClick={() => setTodas((v) => !v)}
                  className="border-line-strong text-ink hover:bg-surface-sunken min-h-11 cursor-pointer justify-self-start rounded-full border-2 bg-transparent px-5 text-sm font-bold"
                >
                  {todas ? "Ver menos" : `Ver todas (${item.evidencias.length})`}
                  <span className="sr-only"> — {item.nome}</span>
                </button>
              )}
            </>
          ) : (
            <p className="m-0 text-sm">
              Sem competências associadas: o PPC não traz a ementa deste componente, ou ela não é a mais próxima de
              nenhuma competência das profissões escolhidas. Ele aparece pelo itinerário formativo ou pelo grupo.
            </p>
          )}
          {item.codigoNoPpc && (
            <p className="m-0 text-sm">
              Na matriz atual, este componente equivale a <span className="font-mono">{item.codigoNoPpc}</span>; a
              ementa analisada é a desse código.
            </p>
          )}
          {item.ementa && (
            <blockquote className="border-line-strong m-0 border-l-4 pl-3 text-sm leading-[22px]">
              <b>Ementa:</b> {item.ementa}
            </blockquote>
          )}
          <p className="text-ink-muted m-0 text-sm">
            {item.preRequisitos.length > 0
              ? `Pré-requisito cumprido: ${item.preRequisitos.join(" ou ")}.`
              : "Sem pré-requisito."}{" "}
            A ordem é calculada sem IA generativa.
          </p>
        </div>
      </details>
    </Card>
  );
}
