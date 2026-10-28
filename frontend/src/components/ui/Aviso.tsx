import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type Props = { tom: "atencao" | "info"; role?: "alert" | "status"; children: ReactNode };

/** Aviso com ícone de informação; atenção em negrito, info em peso normal. */
export function Aviso({ tom, role, children }: Props) {
  return (
    <div
      role={role}
      className={cx(
        "flex items-start gap-3 rounded-md px-6 py-4",
        tom === "atencao" ? "bg-parcial-bg text-parcial font-bold" : "bg-sky text-ink font-normal",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="mt-px size-[22px] flex-none"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8h.01M11 12h1v5h1" />
      </svg>
      <div>{children}</div>
    </div>
  );
}
