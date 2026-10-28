import type { Contagem } from "@/lib/api";
import { cx } from "@/lib/cx";
import { segmentos as calcularSegmentos, type Segmento } from "@/lib/calculos";

type Props = { contagem: Contagem; segmentos: number; fina?: boolean; legenda?: boolean };

const COR: Record<Segmento, string> = {
  lacuna: "bg-lacuna",
  parcial: "bg-parcial-mark",
  coberta: "bg-coberta",
  naoDocumentada: "bg-line-strong",
  vazio: "bg-surface-sunken",
};

const QUADRADO =
  "inline-flex items-center gap-1 before:size-2.5 before:rounded-[2px] before:content-['']";

/** Barra segmentada lacunas → parciais → cobertas → não documentadas; os números vão na legenda. */
export function BarraCobertura({ contagem, segmentos, fina, legenda }: Props) {
  return (
    <div>
      <div aria-hidden="true" className={cx("flex", fina ? "h-2.5 gap-0.5" : "h-7 gap-[3px]")}>
        {calcularSegmentos(contagem, segmentos).map((s, i) => (
          <i
            key={i}
            className={cx("flex-1 basis-0", fina ? "rounded-[2px]" : "rounded-[4px]", COR[s])}
          />
        ))}
      </div>
      {legenda && (
        <ul className="m-0 mt-2 flex list-none flex-wrap gap-4 p-0 text-sm leading-5">
          <li className={cx(QUADRADO, "before:bg-lacuna")}>
            <b className="font-bold">{contagem.lacuna}</b>&nbsp;lacunas
          </li>
          <li className={cx(QUADRADO, "before:bg-parcial-mark")}>
            <b className="font-bold">{contagem.parcial}</b>&nbsp;parciais
          </li>
          <li className={cx(QUADRADO, "before:bg-coberta")}>
            <b className="font-bold">{contagem.coberta}</b>&nbsp;cobertas
          </li>
          {contagem.naoDocumentada > 0 && (
            <li className={cx(QUADRADO, "before:bg-line-strong")}>
              <b className="font-bold">{contagem.naoDocumentada}</b>&nbsp;não documentadas
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
