import type { ElementType, ReactNode } from "react";
import { cx } from "@/lib/cx";

type Props = { as?: ElementType; relevo?: boolean; className?: string; "aria-labelledby"?: string; children: ReactNode };

/** Painel escuro; `relevo` acrescenta as curvas de nível ao fundo. */
export function Painel({ as: Tag = "div", relevo, className, children, ...aria }: Props) {
  return (
    <Tag
      {...aria}
      className={cx(
        "bg-panel text-on-panel rounded-lg p-6 md:p-8 on-panel",
        relevo && "bg-topo-painel",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
