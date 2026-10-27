import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type Props = {
  valor: ReactNode;
  denominador?: ReactNode;
  rotulo: string;
  variante?: "padrao" | "painel" | "lima";
  relevo?: boolean;
  href?: string;
  destaque?: "lacuna";
};

const VARIANTES = {
  padrao: { caixa: "bg-surface shadow-card", rotulo: "text-ink-muted" },
  painel: { caixa: "bg-panel text-on-panel on-panel", rotulo: "text-on-panel-muted" },
  lima: { caixa: "bg-lime text-on-lime", rotulo: "text-on-lime" },
};

/** Número grande com rótulo; vira link quando recebe `href`. */
export function Kpi({ valor, denominador, rotulo, variante = "padrao", relevo, href, destaque }: Props) {
  const v = VARIANTES[variante];
  const classes = cx(
    "flex min-w-0 flex-col gap-1 rounded-lg p-6 no-underline",
    v.caixa,
    relevo && "bg-topo-painel",
    href && "h-full",
  );
  const conteudo = (
    <>
      <span
        className={cx(
          "font-display text-[56px] leading-[56px] font-extrabold tracking-[-0.03em]",
          destaque === "lacuna" && "text-lacuna",
        )}
      >
        {valor}
        {denominador !== undefined && (
          <small
            className={cx(
              "ml-1 text-lg font-bold tracking-normal",
              destaque === "lacuna" && "text-ink",
            )}
          >
            /{denominador}
          </small>
        )}
      </span>
      <span className={cx("text-sm leading-5", v.rotulo)}>{rotulo}</span>
    </>
  );
  return href ? (
    <Link href={href} className={classes}>
      {conteudo}
    </Link>
  ) : (
    <div className={classes}>{conteudo}</div>
  );
}
