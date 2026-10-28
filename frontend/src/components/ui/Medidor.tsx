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
      className={cx("h-2 w-full overflow-hidden rounded-full", tom === "painel" ? "bg-panel-raised" : "bg-surface-sunken")}
    >
      <div className="h-full rounded-full bg-green" style={{ width: `${pct}%` }} />
    </div>
  );
}
