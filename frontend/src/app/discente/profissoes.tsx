"use client";

import { useEffect, useRef, useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Botao } from "@/components/ui/Botao";
import { IconeProfissao } from "@/components/trilha/IconeProfissao";
import { cx } from "@/lib/cx";
import { LENTE_IA, recomendar, type Recomendacao, type Resumo, type Trajetoria } from "@/lib/api";
import { useApi } from "@/lib/use-api";

const MAX_PROFISSOES = 2;

/** Etapa 02: escolha das profissões-alvo e pedido da recomendação. */
export function EscolhaDeProfissoes({
  trajetoria,
  escolhidas,
  aoMudar,
  aoRecomendar,
}: {
  trajetoria: Trajetoria;
  escolhidas: string[];
  aoMudar(ids: string[]): void;
  aoRecomendar(r: Recomendacao): void;
}) {
  const resumo = useApi<Resumo>("/api/resumo");
  const [estado, setEstado] = useState<{ fase: "inicial" | "gerando" } | { fase: "erro"; msg: string }>({
    fase: "inicial",
  });

  // Número do pedido em voo: trocar a profissão ou desmontar invalida a resposta que ainda não chegou.
  const pedido = useRef(0);
  useEffect(
    () => () => {
      pedido.current++;
    },
    [],
  );

  const alternar = (id: string) => {
    pedido.current++;
    setEstado((e) => (e.fase === "gerando" ? { fase: "inicial" } : e));
    aoMudar(
      escolhidas.includes(id)
        ? escolhidas.filter((x) => x !== id)
        : escolhidas.length < MAX_PROFISSOES
          ? [...escolhidas, id]
          : escolhidas,
    );
  };

  const gerar = () => {
    setEstado({ fase: "gerando" });
    const meu = ++pedido.current;
    recomendar(trajetoria, escolhidas).then(
      (r) => {
        if (meu !== pedido.current) return;
        setEstado({ fase: "inicial" });
        aoRecomendar(r);
      },
      (e: Error) => {
        if (meu === pedido.current) setEstado({ fase: "erro", msg: e.message });
      },
    );
  };

  return (
    <section aria-labelledby="t-prof" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id="t-prof" className="m-0 text-2xl leading-[30px] font-bold">
          <span className="font-display text-ink-muted mr-2 font-extrabold">02</span>Escolha até duas profissões-alvo
        </h2>
        <span aria-live="polite" className="font-bold">
          {escolhidas.length} de {MAX_PROFISSOES} escolhidas
        </span>
      </div>
      {resumo.erro && <Aviso tom="atencao">Não foi possível carregar as profissões ({resumo.erro}).</Aviso>}
      {resumo.dados && (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3 p-0">
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
                  className="group bg-surface text-ink shadow-card hover:border-line-strong aria-pressed:bg-lime-soft aria-pressed:border-panel flex h-full min-h-11 w-full cursor-pointer flex-col gap-3 rounded-lg border-2 border-transparent p-5 text-left disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span>
                      <span className="block text-lg leading-6 font-bold">{p.rotulo}</span>
                      <span className="text-ink-muted block text-sm leading-5">
                        Itinerário {p.itinerarios.join(" · ")}
                      </span>
                    </span>
                    <span
                      className={cx(
                        "grid size-11 flex-none place-items-center rounded-[14px]",
                        p.id === LENTE_IA
                          ? "bg-green text-on-lime shadow-[inset_0_0_0_3px_var(--green),inset_0_0_0_5px_var(--on-lime)]"
                          : "bg-panel text-cream shadow-[inset_0_0_0_3px_var(--panel),inset_0_0_0_5px_var(--cream)]",
                        "group-aria-pressed:bg-lime group-aria-pressed:text-on-lime group-aria-pressed:shadow-[inset_0_0_0_3px_var(--lime),inset_0_0_0_5px_var(--panel)]",
                      )}
                    >
                      <IconeProfissao id={p.id} />
                    </span>
                  </span>
                  <span className="text-ink-muted text-sm leading-5">
                    {marcada ? "Escolhida" : bloqueada ? "Desmarque uma para trocar" : "Toque para escolher"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Botao variante="lima" onClick={gerar} disabled={escolhidas.length === 0 || estado.fase === "gerando"}>
          {estado.fase === "gerando" ? "Calculando…" : "Ver sugestões"}
        </Botao>
        <span className="text-ink-muted text-sm">A ordem é calculada sem IA generativa.</span>
      </div>
      <div aria-live="polite">{estado.fase === "erro" && <Aviso tom="atencao">{estado.msg}</Aviso>}</div>
    </section>
  );
}
