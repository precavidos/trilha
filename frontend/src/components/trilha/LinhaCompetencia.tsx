import { Botao } from "@/components/ui/Botao";
import { ChipSituacao } from "@/components/ui/ChipSituacao";
import type { Item, Limiares } from "@/lib/api";
import { cx } from "@/lib/cx";
import { formatarSimilaridade, RELACOES } from "@/lib/formato";
import { PainelPorQue } from "./PainelPorQue";

type Props = {
  item: Item;
  aberta: boolean;
  aoAlternar(): void;
  profissao: string;
  limiares: Limiares | undefined;
};

/** Uma competência exigida: situação, ementa mais próxima e o painel "Por que isto?". */
export function LinhaCompetencia({ item, aberta, aoAlternar, profissao, limiares }: Props) {
  const idPainel = `porque-${item.id.replace(/\W/g, "-")}`;
  const proxima = item.evidencias[0];
  const ia = item.fonte !== "ESCO";
  return (
    <li className="border-line border-t first:border-t-0">
      <div
        className={cx(
          "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-2 py-4 md:grid-cols-[minmax(0,2.2fr)_auto_minmax(0,1.6fr)_auto]",
          aberta && "bg-surface-sunken rounded-md",
        )}
      >
        <span>
          <span className="font-bold">{item.rotulo}</span>
          {ia && (
            <span className="bg-lime text-on-lime ml-1 inline-flex items-center gap-1 rounded-full px-2 align-[2px] text-xs leading-5 font-bold">
              IA
            </span>
          )}
          <span className="text-ink-muted block text-sm leading-5 font-normal">
            {item.tipo} · {ia ? "Extensão IA" : "ESCO"} · {RELACOES[item.relacao ?? ""] ?? "—"}
          </span>
        </span>
        <ChipSituacao status={item.status} />
        <span className="col-span-full min-w-0 text-sm leading-5 md:col-span-1">
          {proxima ? (
            <>
              <span className="bg-surface-sunken mr-1 inline-block rounded-[6px] px-1.5">
                {proxima.codigo}
              </span>
              {proxima.nome}
              <span className="text-ink-muted block text-sm leading-5 font-normal">
                mais próxima · similaridade {formatarSimilaridade(proxima.similaridade)}
              </span>
            </>
          ) : (
            "—"
          )}
        </span>
        <Botao
          variante={aberta ? "painel" : "fantasma"}
          aria-expanded={aberta}
          aria-controls={idPainel}
          onClick={aoAlternar}
        >
          Por que isto?
          <span className="sr-only"> — {item.rotulo}</span>
        </Botao>
      </div>
      {aberta && (
        <div id={idPainel}>
          <PainelPorQue item={item} profissao={profissao} limiares={limiares} />
        </div>
      )}
    </li>
  );
}
