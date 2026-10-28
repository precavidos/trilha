"use client";

import { useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Botao } from "@/components/ui/Botao";
import { Card } from "@/components/ui/Card";
import { recomendar, type Recomendacao, type Resumo, type Trajetoria } from "@/lib/api";
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

  const alternar = (id: string) =>
    aoMudar(
      escolhidas.includes(id)
        ? escolhidas.filter((x) => x !== id)
        : escolhidas.length < MAX_PROFISSOES
          ? [...escolhidas, id]
          : escolhidas,
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
