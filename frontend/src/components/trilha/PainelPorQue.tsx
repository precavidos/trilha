"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/Botao";
import { PontoSituacao } from "@/components/ui/ChipSituacao";
import { Painel } from "@/components/ui/Painel";
import { justificar, type Item, type Justificativa, type Limiares, type Status } from "@/lib/api";
import { larguraDaSimilaridade } from "@/lib/calculos";
import { formatarDecimal, formatarSimilaridade, RELACOES, SITUACOES, TIPOS } from "@/lib/formato";

const PALAVRA: Record<Status, string> = {
  LACUNA: "uma lacuna",
  PARCIAL: "parcial",
  COBERTA: "coberta",
};

const REGRA: Record<Status, string> = {
  LACUNA: "abaixo dos dois limiares de Parcial",
  PARCIAL: "atinge um limiar de Parcial, não o de Coberta",
  COBERTA: "atinge um limiar de Coberta",
};

const TITULO_SECAO =
  "m-0 text-sm leading-5 font-bold tracking-[.06em] text-on-panel-muted uppercase";

type Props = { item: Item; profissao: string; limiares: Limiares | undefined };

/** "Por que isto?": como a situação foi calculada, as evidências e a justificativa opcional da IA. */
export function PainelPorQue({ item, profissao, limiares }: Props) {
  const exigencia =
    item.relacao === "transversal-ia"
      ? "transversal a todas as profissões-alvo"
      : `exigência ${RELACOES[item.relacao ?? ""]?.toLowerCase() ?? "—"} para ${profissao}`;
  const origem = item.fonte === "ESCO" ? "ESCO" : "Extensão IA";
  const limiarSim = limiares
    ? ` (Coberta ≥ ${formatarSimilaridade(limiares.cobertaSimilaridade)} · Parcial ≥ ${formatarSimilaridade(limiares.parcialSimilaridade)})`
    : "";
  const limiarEscore = limiares
    ? ` (Coberta ≥ ${formatarDecimal(limiares.cobertaEscore)} · Parcial ≥ ${formatarDecimal(limiares.parcialEscore)})`
    : "";

  return (
    <section aria-label="Por que isto?" className="mt-2 mb-4">
      <Painel className="grid grid-cols-[minmax(0,1fr)] gap-6">
        <div>
          <h3 className="m-0 text-[22px] leading-7 font-bold">
            Por que “{item.rotulo}” é {PALAVRA[item.status]}?
          </h3>
          <p className="text-on-panel-muted m-0 mt-2">
            {TIPOS[item.tipo] ?? item.tipo} · {origem} · {exigencia}
          </p>
          {item.descricao && <p className="text-on-panel-muted m-0 mt-2">{item.descricao}</p>}
        </div>

        <div>
          <h4 className={TITULO_SECAO}>Como a situação foi calculada · sem IA generativa</h4>
          <ol className="m-0 mt-3 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-3">
            <li className="bg-panel-raised rounded-md p-4">
              <b className="block text-[28px] leading-8">
                {formatarSimilaridade(item.similaridade)}
              </b>
              <span className="text-on-panel-muted text-sm leading-5">
                maior similaridade com uma ementa{limiarSim}
              </span>
            </li>
            <li className="bg-panel-raised rounded-md p-4">
              <b className="block text-[28px] leading-8">{formatarDecimal(item.escore)}</b>
              <span className="text-on-panel-muted text-sm leading-5">
                escore: quanto essa ementa se destaca das demais{limiarEscore}
              </span>
            </li>
            <li className="bg-panel-raised rounded-md p-4">
              <b className="text-lime flex items-center gap-2 text-[28px] leading-8">
                <PontoSituacao status={item.status} tamanho="grande" />
                <span className="text-on-panel">{SITUACOES[item.status].rotulo}</span>
              </b>
              <span className="text-on-panel-muted text-sm leading-5">{REGRA[item.status]}</span>
            </li>
          </ol>
        </div>

        <div>
          <h4 className={TITULO_SECAO}>Evidências · ementas mais próximas</h4>
          <ol className="m-0 mt-3 grid list-none grid-cols-[minmax(0,1fr)] gap-2 p-0">
            {item.evidencias.map((ev, i) => (
              <li key={ev.codigo}>
                <details open={i === 0} className="bg-panel-raised rounded-md px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center gap-3">
                    <span className="bg-lime text-on-lime rounded-[6px] px-1.5">{ev.codigo}</span>
                    <span className="min-w-0">{ev.nome}</span>
                    <span className="text-on-panel-muted ml-auto text-sm whitespace-nowrap">
                      {formatarSimilaridade(ev.similaridade)}
                    </span>
                    <span
                      aria-hidden="true"
                      className="bg-panel h-1.5 w-16 flex-none overflow-hidden rounded-[3px]"
                    >
                      <i
                        className="bg-lime block h-full"
                        style={{ width: `${larguraDaSimilaridade(ev.similaridade)}%` }}
                      />
                    </span>
                  </summary>
                  <blockquote className="text-on-panel m-0 mt-3 text-sm leading-[22px]">
                    {ev.ementa || "Componente sem ementa no PPC."}
                  </blockquote>
                </details>
              </li>
            ))}
          </ol>
        </div>

        <JustificativaIa competencia={item.id} />
      </Painel>
    </section>
  );
}

type Estado =
  | { fase: "inicial" }
  | { fase: "gerando" }
  | { fase: "pronta"; j: Justificativa }
  | { fase: "erro"; msg: string };

const ICONE_BRILHO = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" />
  </svg>
);

function JustificativaIa({ competencia }: { competencia: string }) {
  const [estado, setEstado] = useState<Estado>({ fase: "inicial" });

  const gerar = () => {
    setEstado({ fase: "gerando" });
    justificar(competencia).then(
      (j) => setEstado({ fase: "pronta", j }),
      (e: Error) => setEstado({ fase: "erro", msg: e.message }),
    );
  };

  return (
    <div className="border-on-panel-muted grid gap-3 rounded-md border-[1.5px] border-dashed p-4">
      <h4 className={TITULO_SECAO}>Justificativa em linguagem natural</h4>
      <p className="text-on-panel-muted m-0 text-sm leading-5">
        Um modelo de linguagem redige o texto a partir apenas das evidências acima. Ele não muda a
        situação calculada.
      </p>
      {estado.fase !== "pronta" && (
        <div>
          <Botao
            variante="lima"
            icone={ICONE_BRILHO}
            onClick={gerar}
            disabled={estado.fase === "gerando"}
          >
            {estado.fase === "gerando"
              ? "Gerando… pode levar até 20 segundos"
              : "Gerar justificativa com IA"}
          </Botao>
        </div>
      )}
      <div aria-live="polite" className="grid gap-2">
        {estado.fase === "erro" && (
          <p className="m-0 font-bold">Não foi possível falar com o servidor ({estado.msg}).</p>
        )}
        {estado.fase === "pronta" && <TextoJustificativa j={estado.j} />}
      </div>
    </div>
  );
}

function TextoJustificativa({ j }: { j: Justificativa }) {
  return (
    <>
      {j.degradada && (
        <p className="m-0 font-bold">
          O modelo de linguagem está indisponível; abaixo, só as evidências.
        </p>
      )}
      <p className="m-0 whitespace-pre-line">{j.texto}</p>
      <p className="text-on-panel-muted m-0 text-sm leading-5">
        {j.degradada ? "Sem modelo de linguagem" : `Gerado por ${j.modelo}`} em{" "}
        {new Date(j.geradaEm).toLocaleString("pt-BR")}.
        {!j.degradada &&
          (j.citados.length > 0
            ? ` Ementas citadas: ${j.citados.join(", ")}.`
            : " Atenção: o texto não citou nenhuma das ementas fornecidas; confira com as evidências.")}
      </p>
    </>
  );
}
