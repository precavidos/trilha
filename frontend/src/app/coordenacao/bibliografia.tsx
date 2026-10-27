"use client";

import type { IdadeBibliografia } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { formatarPorcento } from "@/lib/formato";

/** Idade da bibliografia por componente, mais antigas primeiro (ordem do backend). */
export function TabelaBibliografia() {
  const { dados, erro, carregando } = useApi<IdadeBibliografia[]>("/api/bibliografia");

  if (erro) return <p className="text-lacuna">Não foi possível carregar a bibliografia ({erro}).</p>;
  if (carregando || !dados) return <p aria-busy="true">Carregando bibliografias…</p>;

  return (
    <div className="relative overflow-x-auto" tabIndex={0} role="region" aria-label="Tabela: idade da bibliografia">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Idade da bibliografia de {dados.length} componentes, mais antigas primeiro
        </caption>
        <thead>
          <tr className="border-b-2 border-border">
            <th scope="col" className="py-2 pr-4">Componente</th>
            <th scope="col" className="py-2 pr-4 text-right">Referências com ano</th>
            <th scope="col" className="py-2 pr-4 text-right">Ano mediano</th>
            <th scope="col" className="py-2 pr-4">Intervalo</th>
            <th scope="col" className="py-2 text-right">Com mais de 10 anos</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((b) => (
            <tr key={b.codigo} className="border-b border-border">
              <th scope="row" className="py-2 pr-4 font-normal">
                <span className="font-mono text-sm">{b.codigo}</span> {b.nome}
              </th>
              <td className="py-2 pr-4 text-right">
                {b.comAno} de {b.referencias}
              </td>
              <td className="py-2 pr-4 text-right font-bold">{b.mediana ?? "—"}</td>
              <td className="py-2 pr-4 whitespace-nowrap">
                {b.maisAntiga && b.maisRecente ? `${b.maisAntiga}–${b.maisRecente}` : "—"}
              </td>
              <td className={`py-2 text-right ${b.fracaoComMaisDe10Anos >= 0.5 ? "font-bold text-lacuna" : ""}`}>
                {b.comAno > 0 ? formatarPorcento(b.fracaoComMaisDe10Anos) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
