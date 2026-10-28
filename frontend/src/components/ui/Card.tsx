import type { ElementType, ReactNode } from "react";
import { cx } from "@/lib/cx";

type Props = { as?: ElementType; className?: string; "aria-labelledby"?: string; children: ReactNode };

/** Cartão branco; o padding fica com quem usa. */
export function Card({ as: Tag = "div", className, children, ...aria }: Props) {
  return <Tag {...aria} className={cx("bg-surface rounded-lg shadow-card", className)}>{children}</Tag>;
}
