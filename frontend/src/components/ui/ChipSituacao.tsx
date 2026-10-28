import type { Status } from "@/lib/api";
import { cx } from "@/lib/cx";
import { SITUACOES } from "@/lib/formato";

const CORES: Record<Status, string> = {
  LACUNA: "text-lacuna bg-lacuna-bg",
  PARCIAL: "text-parcial bg-parcial-bg",
  COBERTA: "text-coberta bg-coberta-bg",
};

/** Ponto: vazio = lacuna, meio cheio = parcial, cheio = coberta. */
export function PontoSituacao({
  status,
  tamanho = "normal",
}: {
  status: Status;
  tamanho?: "normal" | "grande";
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-block flex-none rounded-full border-current align-[-1px]",
        tamanho === "grande" ? "size-[18px] border-[3px]" : "size-3 border-2",
        status === "COBERTA" && "bg-current",
        status === "PARCIAL" && "bg-[linear-gradient(90deg,currentColor_50%,transparent_50%)]",
      )}
    />
  );
}

/** Situação sempre com ícone e palavra, nunca só cor. */
export function ChipSituacao({ status }: { status: Status }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-sm leading-5 font-bold whitespace-nowrap",
        CORES[status],
      )}
    >
      <PontoSituacao status={status} />
      {SITUACOES[status].rotulo}
    </span>
  );
}
