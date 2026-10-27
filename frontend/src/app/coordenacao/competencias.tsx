"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { justificar, type Item, type Justificativa, type Status } from "@/lib/api";
import { formatarDecimal, RELACOES, SITUACOES } from "./formato";
import { Situacao } from "./situacao";

const PAGINA = 25;
const FILTROS: (Status | "TODAS")[] = ["TODAS", "LACUNA", "PARCIAL", "COBERTA"];

/** Competências exigidas, lacunas primeiro (ordem do backend), com o painel "Por que isto?" por linha. */
export function TabelaCompetencias({ itens, titulo }: { itens: Item[]; titulo: string }) {
  const [filtro, setFiltro] = useState<Status | "TODAS">("TODAS");
  const [limite, setLimite] = useState(PAGINA);
  const [aberta, setAberta] = useState<string | null>(null);

  const filtrados = filtro === "TODAS" ? itens : itens.filter((i) => i.status === filtro);
  const visiveis = filtrados.slice(0, limite);
  const quantos = (f: Status | "TODAS") =>
    f === "TODAS" ? itens.length : itens.filter((i) => i.status === f).length;

  return (
    <div className="space-y-4">
      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="mb-2 font-bold">Mostrar</legend>
        {FILTROS.map((f) => (
          <label
            key={f}
            className="cursor-pointer rounded border border-border px-3 py-1.5 has-checked:bg-accent has-checked:text-accent-foreground has-focus-visible:outline-3 has-focus-visible:outline-(--focus)"
          >
            <input
              type="radio"
              name="filtro-situacao"
              value={f}
              checked={filtro === f}
              onChange={() => {
                setFiltro(f);
                setLimite(PAGINA);
              }}
              className="sr-only"
            />
            {f === "TODAS" ? "Todas" : SITUACOES[f].plural} ({quantos(f)})
          </label>
        ))}
      </fieldset>

      <div className="relative overflow-x-auto" tabIndex={0} role="region" aria-label={`Tabela: ${titulo}`}>
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            {titulo}: {filtrados.length} competências, lacunas primeiro
          </caption>
          <thead>
            <tr className="border-b-2 border-border">
              <th scope="col" className="py-2 pr-4">Competência</th>
              <th scope="col" className="py-2 pr-4">Exigência</th>
              <th scope="col" className="py-2 pr-4">Situação no PPC</th>
              <th scope="col" className="py-2 pr-4">Componente mais próximo</th>
              <th scope="col" className="py-2"><span className="sr-only">Detalhes</span></th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((item, i) => {
              const idPainel = `porque-${i}`;
              const expandida = aberta === item.id;
              const proximo = item.evidencias[0];
              return (
                <Fragment key={item.id}>
                  <tr className="border-b border-border align-top">
                    <th scope="row" className="py-3 pr-4 font-normal">
                      <span className="font-bold">{item.rotulo}</span>
                      <span className="block text-sm text-muted">
                        {item.tipo} · {item.fonte}
                      </span>
                    </th>
                    <td className="py-3 pr-4">{RELACOES[item.relacao ?? ""] ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <Situacao status={item.status} />
                    </td>
                    <td className="py-3 pr-4">
                      {proximo ? (
                        <>
                          <span className="font-mono text-sm">{proximo.codigo}</span> {proximo.nome}
                          <span className="block text-sm text-muted">
                            similaridade {formatarDecimal(proximo.similaridade)}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        aria-expanded={expandida}
                        aria-controls={idPainel}
                        onClick={() => setAberta(expandida ? null : item.id)}
                        className="whitespace-nowrap rounded border border-border px-3 py-1.5 font-bold text-accent hover:bg-surface"
                      >
                        Por que isto?
                        <span className="sr-only"> — {item.rotulo}</span>
                      </button>
                    </td>
                  </tr>
                  {expandida && (
                    <tr id={idPainel} className="border-b border-border bg-surface">
                      <td colSpan={5} className="p-4">
                        <PorQueIsto item={item} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        Mostrando {visiveis.length} de {filtrados.length} competências.
      </p>
      {visiveis.length < filtrados.length && (
        <button
          type="button"
          onClick={() => setLimite(limite + PAGINA)}
          className="rounded border border-border px-4 py-2 font-bold hover:bg-surface"
        >
          Mostrar mais {Math.min(PAGINA, filtrados.length - visiveis.length)}
        </button>
      )}
    </div>
  );
}

function PorQueIsto({ item }: { item: Item }) {
  return (
    <div className="space-y-4">
      {item.descricao && <p>{item.descricao}</p>}

      <section className="space-y-1">
        <h4 className="font-bold">Como a situação foi calculada</h4>
        <p className="text-sm">
          Sem IA generativa: comparamos o texto da competência com todas as ementas do PPC por
          similaridade semântica. Maior similaridade: <strong>{formatarDecimal(item.similaridade)}</strong>;
          escore relativo à média da competência: <strong>{formatarDecimal(item.escore)}</strong>. Os
          limiares estão na página{" "}
          <Link href="/sobre-ia" className="text-accent underline">
            Sobre a IA
          </Link>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="font-bold">Evidências: ementas mais próximas</h4>
        <ol className="space-y-2">
          {item.evidencias.map((ev) => (
            <li key={ev.codigo}>
              <details className="rounded border border-border bg-background p-3">
                <summary className="cursor-pointer">
                  <span className="font-mono text-sm">{ev.codigo}</span> {ev.nome}{" "}
                  <span className="text-sm text-muted">— similaridade {formatarDecimal(ev.similaridade)}</span>
                </summary>
                <blockquote className="mt-2 border-l-4 border-border pl-3 text-sm">{ev.ementa}</blockquote>
              </details>
            </li>
          ))}
        </ol>
      </section>

      <JustificativaIa competencia={item.id} />
    </div>
  );
}

function JustificativaIa({ competencia }: { competencia: string }) {
  const [estado, setEstado] = useState<
    { fase: "inicial" } | { fase: "gerando" } | { fase: "pronta"; j: Justificativa } | { fase: "erro"; msg: string }
  >({ fase: "inicial" });

  const gerar = () => {
    setEstado({ fase: "gerando" });
    justificar(competencia).then(
      (j) => setEstado({ fase: "pronta", j }),
      (e: Error) => setEstado({ fase: "erro", msg: e.message }),
    );
  };

  return (
    <section className="space-y-2">
      <h4 className="font-bold">Justificativa em linguagem natural</h4>
      <p className="text-sm text-muted">
        Um modelo de linguagem redige o texto a partir apenas das evidências acima. Ele não muda a
        situação calculada.
      </p>
      {estado.fase !== "pronta" && (
        <button
          type="button"
          onClick={gerar}
          disabled={estado.fase === "gerando"}
          className="rounded bg-accent px-4 py-2 font-bold text-accent-foreground disabled:opacity-70"
        >
          {estado.fase === "gerando" ? "Gerando… pode levar até 20 segundos" : "Gerar justificativa com IA"}
        </button>
      )}
      <div aria-live="polite">
        {estado.fase === "erro" && (
          <p className="text-lacuna">Não foi possível falar com o servidor ({estado.msg}).</p>
        )}
        {estado.fase === "pronta" && <TextoJustificativa j={estado.j} />}
      </div>
    </section>
  );
}

function TextoJustificativa({ j }: { j: Justificativa }) {
  return (
    <div className="space-y-2 rounded border border-border bg-background p-3">
      {j.degradada && (
        <p className="font-bold text-parcial">
          O modelo de linguagem está indisponível; abaixo, só as evidências.
        </p>
      )}
      <p className="whitespace-pre-line">{j.texto}</p>
      <p className="text-sm text-muted">
        {j.degradada ? "Sem modelo de linguagem" : `Gerado por ${j.modelo}`} em{" "}
        {new Date(j.geradaEm).toLocaleString("pt-BR")}.
        {!j.degradada &&
          (j.citados.length > 0
            ? ` Ementas citadas: ${j.citados.join(", ")}.`
            : " Atenção: o texto não citou nenhuma das ementas fornecidas; confira com as evidências.")}
      </p>
    </div>
  );
}
