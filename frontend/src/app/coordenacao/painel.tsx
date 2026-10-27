"use client";

import { useState } from "react";
import type { Contagem, Item, Resumo } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { TabelaBibliografia } from "./bibliografia";
import { TabelaCompetencias } from "./competencias";
import { formatarPorcento } from "./formato";
import { BarraCobertura, TextoContagem } from "./situacao";

const LENTE_IA = "lente-ia";

export function PainelCoordenacao() {
  const resumo = useApi<Resumo>("/api/resumo");
  const [escolhida, setEscolhida] = useState<string | null>(null);

  if (resumo.erro) {
    return (
      <div role="alert" className="rounded border-2 border-lacuna p-4">
        <p className="font-bold">Não foi possível falar com o servidor da análise.</p>
        <p className="text-sm">
          Verifique se o backend está rodando ({resumo.erro}).
        </p>
      </div>
    );
  }
  if (!resumo.dados) return <p aria-busy="true">Carregando a análise do PPC…</p>;

  const r = resumo.dados;
  const atual = escolhida ?? r.profissoes[0]?.id ?? LENTE_IA;
  const opcoes: { id: string; rotulo: string; contagem: Contagem }[] = [
    ...r.profissoes,
    { id: LENTE_IA, rotulo: "Lente transversal de IA", contagem: r.lenteIa },
  ];
  const profissao = r.profissoes.find((p) => p.id === atual);

  return (
    <div className="space-y-12">
      <dl className="grid gap-4 rounded border border-border p-4 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted">Documento analisado</dt>
          <dd className="font-bold">{r.metadados.documento}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Componentes com ementa</dt>
          <dd className="font-bold">
            {r.componentesComEmenta} de {r.componentes}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Vocabulário de competências</dt>
          <dd className="font-bold">{r.metadados.vocabulario}</dd>
        </div>
      </dl>

      <section aria-labelledby="titulo-lacunas" className="space-y-6">
        <div className="space-y-2">
          <h2 id="titulo-lacunas" className="text-2xl font-bold">
            Lacunas por profissão-alvo
          </h2>
          <p className="text-muted">
            Uma lacuna é uma competência exigida pela profissão que nenhuma ementa do PPC contempla
            de forma clara. Escolha a profissão-alvo:
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {opcoes.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                aria-pressed={o.id === atual}
                onClick={() => setEscolhida(o.id)}
                className="h-full w-full space-y-2 rounded border border-border p-3 text-left hover:bg-surface aria-pressed:border-2 aria-pressed:border-accent aria-pressed:bg-surface"
              >
                <span className="block font-bold">{o.rotulo}</span>
                <TextoContagem contagem={o.contagem} />
                <BarraCobertura contagem={o.contagem} />
              </button>
            </li>
          ))}
        </ul>

        <section aria-labelledby="titulo-selecionada" className="space-y-4">
          <div className="space-y-1">
            <h3 id="titulo-selecionada" className="text-xl font-bold">
              {profissao?.rotulo ?? "Lente transversal de IA"}
            </h3>
            {profissao ? (
              <p className="text-sm text-muted">
                Ocupação ESCO:{" "}
                <a href={profissao.uriEsco} className="text-accent underline" target="_blank" rel="noreferrer">
                  {profissao.tituloEsco}
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
                {profissao.itinerarios.length > 0 &&
                  ` · Itinerários formativos relacionados: ${profissao.itinerarios.join(", ")}`}
              </p>
            ) : (
              <p className="text-sm text-muted">
                Competências de IA curadas pela equipe (Extensão IA), transversais a todas as
                profissões-alvo.
              </p>
            )}
          </div>
          {/* Fora da tabela, que é remontada a cada troca: assim o leitor de tela anuncia a troca. */}
          <p className="sr-only" aria-live="polite">
            {escolhida && `Exibindo competências de ${profissao?.rotulo ?? "Lente transversal de IA"}.`}
          </p>
          <Competencias key={atual} id={atual} titulo={profissao?.rotulo ?? "Lente transversal de IA"} />
        </section>
      </section>

      <section aria-labelledby="titulo-bibliografia" className="space-y-4">
        <div className="space-y-2">
          <h2 id="titulo-bibliografia" className="text-2xl font-bold">
            Idade da bibliografia
          </h2>
          <p className="text-muted">
            {r.componentesComBibliografia} componentes com bibliografia. Ano mediano geral:{" "}
            <strong>{r.medianaGeralDaBibliografia ?? "—"}</strong>;{" "}
            <strong>{formatarPorcento(r.fracaoReferenciasComMaisDe10Anos)}</strong> das referências
            datadas têm mais de 10 anos (referência: {r.metadados.anoDeReferencia}).
          </p>
        </div>
        <TabelaBibliografia />
      </section>
    </div>
  );
}

function Competencias({ id, titulo }: { id: string; titulo: string }) {
  const caminho = id === LENTE_IA ? "/api/lente-ia" : `/api/profissoes/${encodeURIComponent(id)}/lacunas`;
  const { dados, erro } = useApi<Item[]>(caminho);

  if (erro) return <p className="text-lacuna">Não foi possível carregar as competências ({erro}).</p>;
  if (!dados) return <p aria-busy="true">Carregando competências…</p>;
  return <TabelaCompetencias itens={dados} titulo={titulo} />;
}
