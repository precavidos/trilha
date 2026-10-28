"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";

const PERFIS = [
  { href: "/coordenacao", rotulo: "Coordenação", emBreve: false },
  { href: "/discente", rotulo: "Discente", emBreve: false },
  { href: "/sobre-ia", rotulo: "Sobre a IA", emBreve: false },
];

/** Barra escura do topo com a marca e o seletor de perfil (ADR 0008, sem autenticação). */
export function BarraTopo() {
  const pathname = usePathname();
  return (
    <header className="on-panel flex flex-wrap items-center gap-4 rounded-[28px] bg-panel p-2 pl-6 text-on-panel md:rounded-full">
      <Link
        href="/"
        className="flex items-center gap-2 font-display text-[22px] font-extrabold tracking-[-0.02em] text-on-panel no-underline"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/trilha.svg" alt="" className="block size-8 flex-none" />
        Trilha
      </Link>
      <nav aria-label="Perfil" className="w-full overflow-x-auto md:ml-auto md:w-auto">
        <ul className="m-0 flex list-none gap-1 p-0">
          {PERFIS.map((p) => {
            const ativo = pathname === p.href || pathname.startsWith(p.href + "/");
            return (
              <li key={p.href}>
                <Link
                  href={p.href}
                  aria-current={ativo ? "page" : undefined}
                  className={cx(
                    "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm leading-5 font-bold whitespace-nowrap no-underline",
                    ativo ? "bg-lime text-on-lime" : "text-on-panel hover:bg-panel-raised",
                  )}
                >
                  {p.rotulo}
                  {p.emBreve && <span className="text-xs font-normal opacity-90">em breve</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
