"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Botao } from "@/components/ui/Botao";
import { Card } from "@/components/ui/Card";
import { ChipSituacao } from "@/components/ui/ChipSituacao";
import { Painel } from "@/components/ui/Painel";
import {
  lerHistorico,
  recomendar,
  type ItemRecomendado,
  type Recomendacao,
  type Resumo,
  type Trajetoria,
} from "@/lib/api";
import { formatarSimilaridade, RELACOES } from "@/lib/formato";
import { useApi } from "@/lib/use-api";

const MAX_PROFISSOES = 2;

/** Envio do histórico → escolha das profissões-alvo → recomendação com evidências. */
export function FluxoDiscente() {
  const [trajetoria, setTrajetoria] = useState<Trajetoria | null>(null);
  const [recomendacao, setRecomendacao] = useState<Recomendacao | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <EnvioDoHistorico
        aoLer={(t) => {
          setTrajetoria(t);
          setRecomendacao(null);
        }}
      />
      {trajetoria && <ResumoDaTrajetoria trajetoria={trajetoria} />}
      {trajetoria && <EscolhaDeProfissoes trajetoria={trajetoria} aoRecomendar={setRecomendacao} />}
      {recomendacao && <ListaDeRecomendacoes recomendacao={recomendacao} />}
    </div>
  );
}

function EnvioDoHistorico({ aoLer }: { aoLer(t: Trajetoria | null): void }) {
  const idCampo = useId();
  const [estado, setEstado] = useState<{ fase: "inicial" | "lendo" | "pronto" } | { fase: "erro"; msg: string }>({
    fase: "inicial",
  });

  const enviar = (arquivo: File | undefined) => {
    if (!arquivo) return;
    setEstado({ fase: "lendo" });
    aoLer(null); // um envio novo invalida a trajetória e a recomendação anteriores
    lerHistorico(arquivo).then(
      (t) => {
        setEstado({ fase: "pronto" });
        aoLer(t);
      },
      (e: Error) => setEstado({ fase: "erro", msg: e.message }),
    );
  };

  return (
    <Card as="section" aria-labelledby="titulo-envio" className="flex flex-col gap-4 p-6 md:p-8">
      <h2 id="titulo-envio" className="m-0 text-2xl leading-[30px] font-bold">
        1. Envie seu histórico do SIGAA
      </h2>
      <p className="text-ink-muted m-0">
        No SIGAA, em <em>Ensino → Emitir Histórico</em>, baixe o PDF e selecione-o abaixo. O arquivo é lido em memória e
        não é gravado: o Trilha usa só a estrutura curricular, os códigos dos componentes, as situações e as cargas
        horárias. Nome, matrícula, notas, frequência e nomes de docentes são descartados na leitura.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={idCampo} className="font-bold">
          Histórico em PDF
        </label>
        <input
          id={idCampo}
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => enviar(e.target.files?.[0])}
          disabled={estado.fase === "lendo"}
          className="file:bg-panel file:text-on-panel max-w-full text-sm file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:px-5 file:py-2.5 file:font-bold"
        />
      </div>
      <div aria-live="polite">
        {estado.fase === "lendo" && <p className="m-0">Lendo o histórico…</p>}
        {estado.fase === "erro" && <Aviso tom="atencao">Não foi possível ler o histórico: {estado.msg}</Aviso>}
      </div>
    </Card>
  );
}

function ResumoDaTrajetoria({ trajetoria }: { trajetoria: Trajetoria }) {
  const aprovados = trajetoria.componentes.filter((c) => c.situacao === "aprovado").length;
  const emCurso = trajetoria.componentes.filter((c) => c.situacao === "matriculado").length;
  const optativa = trajetoria.cargas.optativa;
  return (
    <Painel as="section" aria-labelledby="titulo-lido" className="flex flex-col gap-4">
      <h2 id="titulo-lido" className="m-0 text-2xl leading-[30px] font-bold">
        O que lemos do seu histórico
      </h2>
      <dl className="m-0 grid gap-3 sm:grid-cols-4">
        <Dado rotulo="Estrutura curricular" valor={trajetoria.estrutura} />
        <Dado rotulo="Componentes aprovados" valor={String(aprovados)} />
        <Dado rotulo="Em curso" valor={String(emCurso)} />
        <Dado rotulo="Carga optativa pendente" valor={optativa ? `${optativa.pendente} h` : "não informada"} />
      </dl>
      <p className="text-on-panel-muted m-0 text-sm">
        Nada disso é guardado: a trajetória fica só nesta página e é reenviada ao pedir a recomendação.
      </p>
    </Painel>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="bg-panel-raised rounded-md p-4">
      <dt className="text-on-panel-muted text-sm">{rotulo}</dt>
      <dd className="m-0 text-[28px] leading-9 font-bold">{valor}</dd>
    </div>
  );
}

function EscolhaDeProfissoes({
  trajetoria,
  aoRecomendar,
}: {
  trajetoria: Trajetoria;
  aoRecomendar(r: Recomendacao): void;
}) {
  const resumo = useApi<Resumo>("/api/resumo");
  const [escolhidas, setEscolhidas] = useState<string[]>([]);
  const [estado, setEstado] = useState<{ fase: "inicial" | "gerando" } | { fase: "erro"; msg: string }>({
    fase: "inicial",
  });

  const alternar = (id: string) =>
    setEscolhidas((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : atual.length < MAX_PROFISSOES ? [...atual, id] : atual,
    );

  const gerar = () => {
    setEstado({ fase: "gerando" });
    recomendar(trajetoria, escolhidas).then(
      (r) => {
        setEstado({ fase: "inicial" });
        aoRecomendar(r);
      },
      (e: Error) => setEstado({ fase: "erro", msg: e.message }),
    );
  };

  return (
    <Card as="section" aria-labelledby="titulo-profissoes" className="flex flex-col gap-4 p-6 md:p-8">
      <h2 id="titulo-profissoes" className="m-0 text-2xl leading-[30px] font-bold">
        2. Escolha até duas profissões-alvo
      </h2>
      {resumo.erro && <Aviso tom="atencao">Não foi possível carregar as profissões ({resumo.erro}).</Aviso>}
      {resumo.dados && (
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Profissões-alvo">
          {resumo.dados.profissoes.map((p) => {
            const marcada = escolhidas.includes(p.id);
            const bloqueada = !marcada && escolhidas.length >= MAX_PROFISSOES;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={marcada}
                  disabled={bloqueada}
                  onClick={() => alternar(p.id)}
                  className="border-line-strong hover:bg-surface-sunken aria-pressed:bg-panel aria-pressed:text-on-panel min-h-11 cursor-pointer rounded-full border-2 px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {p.rotulo}
                  <span className="sr-only">{marcada ? " (escolhida)" : ""}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div>
        <Botao variante="lima" onClick={gerar} disabled={escolhidas.length === 0 || estado.fase === "gerando"}>
          {estado.fase === "gerando" ? "Calculando…" : "Ver recomendações"}
        </Botao>
      </div>
      <div aria-live="polite">{estado.fase === "erro" && <Aviso tom="atencao">{estado.msg}</Aviso>}</div>
    </Card>
  );
}

function ListaDeRecomendacoes({ recomendacao: r }: { recomendacao: Recomendacao }) {
  // Leva o foco ao título da lista: anuncia o resultado sem ler a lista inteira numa região viva.
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => titulo.current?.focus(), [r]);

  return (
    <section aria-labelledby="titulo-recomendacoes" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="titulo-recomendacoes" ref={titulo} tabIndex={-1} className="m-0 text-2xl leading-[30px] font-bold">
          3. Optativas e eletivas sugeridas para {r.profissoes.join(" e ")}
        </h2>
        <p className="text-ink-muted m-0">
          {r.chOptativaPendente != null
            ? `Faltam ${r.chOptativaPendente} h de carga optativa (cerca de ${r.componentesSugeridos} componente${r.componentesSugeridos === 1 ? "" : "s"} de 64 h). `
            : ""}
          Só aparecem componentes da sua estrutura ({r.estrutura}) que você ainda não cursou e cujos pré-requisitos já
          cumpriu. A ordem é calculada sem IA generativa.
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
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {r.itens.map((item, i) => (
            <ItemDaLista key={item.codigo} item={item} posicao={i + 1} />
          ))}
        </ol>
      )}
      <p className="text-ink-muted m-0 text-sm">
        A recomendação apoia, mas não substitui, a orientação do Grupo de Professores Tutores e da coordenação. Confira
        a oferta de turmas no SIGAA antes da matrícula.
      </p>
    </section>
  );
}

function ItemDaLista({ item, posicao }: { item: ItemRecomendado; posicao: number }) {
  return (
    <Card as="li" className="flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-ink-muted text-sm font-bold" aria-hidden="true">
          {posicao}.
        </span>
        <span className="bg-lime text-on-lime rounded-md px-1.5 font-mono text-sm">{item.codigo}</span>
        <h3 className="m-0 text-lg leading-6 font-bold">{item.nome}</h3>
        {item.ch != null && <span className="text-ink-muted text-sm">{item.ch} h</span>}
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0 text-sm">
        {item.itinerarios.map((p) => (
          <li key={p.itinerario} className="bg-lime-soft rounded-full px-3 py-0.5">
            Itinerário {p.itinerario} ({p.papel})
          </li>
        ))}
        {item.grupo && (
          <li className="bg-sky rounded-full px-3 py-0.5">
            {item.grupo.grupo}: {item.grupo.cumpridos} de {item.grupo.minimo} cumpridos
          </li>
        )}
        {item.contaExtensao && <li className="bg-sky rounded-full px-3 py-0.5">Conta carga de extensão</li>}
      </ul>
      <details className="group">
        <summary className="text-panel cursor-pointer font-bold">
          Por que isto?<span className="sr-only"> ({item.nome})</span>
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          {item.competencias.length > 0 ? (
            <div>
              <p className="m-0 mb-2 text-sm">
                A ementa está entre as mais próximas destas competências das profissões escolhidas:
              </p>
              <ul className="m-0 flex flex-col gap-2 p-0">
                {item.competencias.map((c) => (
                  <li key={c.competencia} className="flex flex-wrap items-center gap-2 text-sm">
                    <ChipSituacao status={c.situacaoNoPpc} />
                    <b>{c.rotulo}</b>
                    <span className="text-ink-muted">
                      {RELACOES[c.relacao] ?? c.relacao} para {c.profissao} · {c.fonte} · similaridade{" "}
                      {formatarSimilaridade(c.similaridade)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
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
            <blockquote className="border-line-strong m-0 border-l-4 pl-3 text-sm">
              <span className="font-bold">Ementa: </span>
              {item.ementa}
            </blockquote>
          )}
          {item.preRequisitos.length > 0 && (
            <p className="text-ink-muted m-0 text-sm">Pré-requisito cumprido: {item.preRequisitos.join(" ou ")}.</p>
          )}
        </div>
      </details>
    </Card>
  );
}
