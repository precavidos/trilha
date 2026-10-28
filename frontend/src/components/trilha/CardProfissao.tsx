import { LENTE_IA, type Contagem } from "@/lib/api";
import { cx } from "@/lib/cx";
import { BarraCobertura } from "@/components/ui/BarraCobertura";
import { IconeProfissao } from "./IconeProfissao";

type Props = {
  id: string;
  rotulo: string;
  meta: string;
  contagem: Contagem;
  selecionado: boolean;
  aoEscolher(): void;
};

/** Card de escolha da profissão-alvo. */
export function CardProfissao({ id, rotulo, meta, contagem, selecionado, aoEscolher }: Props) {
  const total = contagem.lacuna + contagem.parcial + contagem.coberta;
  const ia = id === LENTE_IA;
  return (
    <button
      type="button"
      aria-pressed={selecionado}
      onClick={aoEscolher}
      className="group bg-surface text-ink shadow-card hover:border-line-strong aria-pressed:bg-lime-soft aria-pressed:border-panel flex h-full w-full cursor-pointer flex-col gap-3 rounded-lg border-2 border-transparent p-5 text-left"
    >
      <span className="flex items-start justify-between gap-2">
        <span>
          <span className="block text-lg leading-6 font-bold">{rotulo}</span>
          <span className="text-ink-muted block text-sm leading-5">{meta}</span>
        </span>
        <span
          className={cx(
            "grid size-11 flex-none place-items-center rounded-[14px]",
            ia
              ? "bg-green text-on-lime shadow-[inset_0_0_0_3px_var(--green),inset_0_0_0_5px_var(--on-lime)]"
              : "bg-panel text-cream shadow-[inset_0_0_0_3px_var(--panel),inset_0_0_0_5px_var(--cream)]",
            "group-aria-pressed:bg-lime group-aria-pressed:text-on-lime group-aria-pressed:shadow-[inset_0_0_0_3px_var(--lime),inset_0_0_0_5px_var(--panel)]",
          )}
        >
          <IconeProfissao id={id} />
        </span>
      </span>
      <span className="flex items-baseline gap-2">
        <strong className="text-lacuna text-[40px] leading-10 tracking-[-0.02em]">
          {contagem.lacuna}
        </strong>
        <span className="text-sm leading-5">lacunas de {total} competências</span>
      </span>
      <BarraCobertura fina segmentos={20} contagem={contagem} />
      <span className="text-ink-muted text-sm leading-5">
        {contagem.parcial} parciais · {contagem.coberta} cobertas
      </span>
    </button>
  );
}
