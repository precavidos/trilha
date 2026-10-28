import type { IdadeBibliografia } from "@/lib/api";
import { bibliografiaAntiga, EIXO_INICIO, posicaoNoEixo } from "@/lib/calculos";
import { cx } from "@/lib/cx";
import { formatarPorcento } from "@/lib/formato";

type Props = { linha: IdadeBibliografia; anoDeReferencia: number };

/** Uma linha da bibliografia: componente, linha do tempo dos anos e fração acima de 10 anos. */
export function LinhaBibliografia({ linha: l, anoDeReferencia }: Props) {
  const { mediana, maisAntiga, maisRecente } = l;
  const pos = (ano: number) => posicaoNoEixo(ano, EIXO_INICIO, anoDeReferencia);
  const datada =
    mediana !== null && maisAntiga !== null && maisRecente !== null;
  const ruim = bibliografiaAntiga(l);

  return (
    <li className="border-line grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t px-2 py-3 first:border-t-0 md:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_auto]">
      <span>
        <span className="font-mono">{l.codigo}</span> {l.nome}
        <span className="text-ink-muted block text-sm">
          {l.comAno} de {l.referencias} referências com ano
          {datada && ` · mediana ${mediana}`}
        </span>
      </span>
      {datada ? (
        <div
          role="img"
          aria-label={`De ${maisAntiga} a ${maisRecente}, mediana ${mediana}`}
          className="relative col-span-full row-start-2 h-7 md:col-span-1 md:row-start-auto"
        >
          <span className="bg-line absolute inset-x-0 top-[13px] h-0.5" />
          <span
            className="bg-green absolute top-[9px] h-2.5 rounded-[5px]"
            style={{
              left: `${pos(maisAntiga)}%`,
              right: `${100 - pos(maisRecente)}%`,
            }}
          />
          <span
            className="bg-ink absolute top-1 -ml-0.5 h-5 w-1 rounded-sm"
            style={{ left: `${pos(mediana)}%` }}
          />
          <span
            className="border-lacuna absolute inset-y-0 border-l-2 border-dashed"
            style={{ left: `${pos(anoDeReferencia - 10)}%` }}
          />
        </div>
      ) : (
        <p className="text-ink-muted col-span-full row-start-2 m-0 text-sm md:col-span-1 md:row-start-auto">
          sem referências datadas
        </p>
      )}
      <span
        className={cx(
          "text-sm font-bold whitespace-nowrap",
          ruim && "text-lacuna",
        )}
      >
        {datada ? `${formatarPorcento(l.fracaoComMaisDe10Anos)} > 10 anos` : "—"}
      </span>
    </li>
  );
}
