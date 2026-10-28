import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";

type Props = {
  variante: "lima" | "painel" | "fantasma";
  icone?: ReactNode;
  href?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const VARIANTES = {
  lima: "bg-lime text-on-lime border-transparent",
  painel: "bg-panel text-on-panel border-transparent",
  fantasma: "bg-transparent text-ink border-line-strong hover:bg-surface-sunken",
};

/** Botão em pílula; com `href` vira link. */
export function Botao({ variante, icone, href, className, children, ...resto }: Props) {
  const classes = cx(
    "inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-6 text-sm leading-5 font-bold whitespace-nowrap no-underline cursor-pointer",
    "disabled:cursor-progress disabled:opacity-75 [&_svg]:size-[18px] [&_svg]:flex-none",
    VARIANTES[variante],
    className,
  );
  const conteudo = (
    <>
      {icone}
      {children}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={classes} {...(resto as Omit<ComponentProps<typeof Link>, "href">)}>
        {conteudo}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...resto}>
      {conteudo}
    </button>
  );
}
