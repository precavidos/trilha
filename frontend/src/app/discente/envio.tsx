"use client";

import { useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Botao } from "@/components/ui/Botao";
import { Card } from "@/components/ui/Card";
import { historicoDeExemplo, lerHistorico, type Trajetoria } from "@/lib/api";

export type Origem = "arquivo" | "exemplo";

const NOME_DO_EXEMPLO = "historico-exemplo.pdf";

type Estado = { fase: "inicial" | "lendo" } | { fase: "erro"; msg: string };

const ICONE = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/** Etapa 01: envio do PDF do SIGAA (ou do histórico de exemplo). */
export function EnvioDoHistorico({
  lido,
  aoLer,
  aoComecar,
}: {
  lido: { origem: Origem; nome: string } | null;
  aoLer(t: Trajetoria, origem: Origem, nome: string): void;
  /** Chamada ao iniciar uma leitura: o fluxo descarta a trajetória anterior. */
  aoComecar(): void;
}) {
  const [estado, setEstado] = useState<Estado>({ fase: "inicial" });
  const lendo = estado.fase === "lendo";

  const executar = (leitura: Promise<Trajetoria>, origem: Origem, nome: string) => {
    setEstado({ fase: "lendo" });
    aoComecar();
    leitura.then(
      (t) => {
        setEstado({ fase: "inicial" });
        aoLer(t, origem, nome);
      },
      (e: Error) => setEstado({ fase: "erro", msg: e.message }),
    );
  };

  const enviar = (arquivo: File | undefined) => {
    if (arquivo) executar(lerHistorico(arquivo), "arquivo", arquivo.name);
  };
  const experimentar = () => executar(historicoDeExemplo(), "exemplo", NOME_DO_EXEMPLO);

  return (
    <Card as="section" aria-labelledby="t-envio" className="flex flex-col gap-4 p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id="t-envio" tabIndex={-1} className="m-0 text-2xl leading-[30px] font-bold outline-none">
          <span className="font-display text-ink-muted mr-2 font-extrabold">01</span>Envie seu histórico do SIGAA
        </h2>
        <span className="text-ink-muted text-sm">SIGAA → Ensino → Documentos e Declarações → Histórico Escolar</span>
      </div>

      {lido ? (
        <div className="border-coberta bg-coberta-bg text-coberta flex min-h-24 items-center gap-4 rounded-lg border-2 p-5">
          <svg {...ICONE} className="size-8 flex-none">
            <path d="m5 12 5 5L20 7" />
          </svg>
          <span>
            <b className="block text-lg leading-6">{lido.origem === "exemplo" ? "Histórico de exemplo lido" : `${lido.nome} lido`}</b>
            <span className="text-sm">Dados pessoais descartados na leitura. O arquivo não foi gravado.</span>
          </span>
        </div>
      ) : (
        <>
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!lendo) enviar(e.dataTransfer.files[0]);
            }}
            className="border-line-strong bg-surface-sunken hover:border-panel hover:bg-lime-soft has-[:focus-visible]:outline-(--focus) flex min-h-42 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 text-center has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2"
          >
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={lendo}
              onChange={(e) => {
                enviar(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <svg {...ICONE} className="text-panel size-8">
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
              <path d="M14 3v5h5M12 17v-6M9 14l3-3 3 3" />
            </svg>
            <b className="text-lg leading-6">Selecione o histórico em PDF</b>
            <span className="text-ink-muted">ou arraste o arquivo para cá</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Botao variante="fantasma" onClick={experimentar} disabled={lendo}>
              Experimentar com um histórico de exemplo
            </Botao>
            <span className="text-ink-muted text-sm">Para avaliar o sistema sem expor o seu.</span>
          </div>
        </>
      )}

      <div aria-live="polite">
        {lendo && <p className="m-0">Lendo o histórico…</p>}
        {estado.fase === "erro" && <Aviso tom="atencao">Não foi possível ler o histórico: {estado.msg}</Aviso>}
      </div>

      <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
        <li className="bg-surface-sunken rounded-md p-4 text-sm leading-5">
          <b className="mb-1 flex items-center gap-2">
            <svg {...ICONE} className="size-[18px] flex-none">
              <path d="m5 12 5 5L20 7" />
            </svg>
            O Trilha lê
          </b>
          estrutura curricular e turno, códigos dos componentes, situação (aprovado, matriculado) e cargas horárias
        </li>
        <li className="bg-surface-sunken rounded-md p-4 text-sm leading-5">
          <b className="mb-1 flex items-center gap-2">
            <svg {...ICONE} className="size-[18px] flex-none">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            e descarta na leitura
          </b>
          nome, matrícula, notas, frequência e nomes de docentes. Sem login; nada fica guardado.
        </li>
      </ul>
    </Card>
  );
}
