import { cx } from "@/lib/cx";

/** Barra decorativa de progresso (o valor, em texto, vem sempre ao lado). */
export function Medidor({
  valor,
  maximo,
  tom = "padrao",
}: {
  valor: number;
  maximo: number;
  tom?: "padrao" | "painel";
}) {
  const pct = maximo > 0 ? Math.min(100, Math.round((valor / maximo) * 100)) : 0;
  return (
    <div
      aria-hidden="true"
      className={cx(
        "w-full overflow-hidden",
        tom === "painel"
          ? "bg-panel h-3 rounded-md shadow-[inset_0_0_0_1.5px_var(--on-panel-muted)]"
          : "bg-surface-sunken h-2 rounded-full",
      )}
    >
      <div className={cx("h-full", tom === "painel" ? "bg-lime" : "bg-green rounded-full")} style={{ width: `${pct}%` }} />
    </div>
  );
}
