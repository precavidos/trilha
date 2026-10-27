import type { CSSProperties } from "react";
import { cx } from "@/lib/cx";

export type Passo = { titulo: string; texto: string; tag?: string; tagGenerativa?: boolean };

/** Linha ondulada que liga os pinos: sobe e desce a cada passo e termina no alto à direita. */
function caminho(n: number) {
  const passo = 100 / n,
    xs = Array.from({ length: n }, (_, i) => 2 + i * passo);
  let d = `M${xs[0]} 22`;
  for (let i = 1; i < n; i++) {
    const y0 = i % 2 ? 22 : 50,
      y1 = i % 2 ? 50 : 22,
      meio = (xs[i - 1] + xs[i]) / 2;
    d += ` C ${meio} ${y0}, ${meio} ${y1}, ${xs[i]} ${y1}`;
  }
  return d + ` C ${xs[n - 1] + 10} ${n % 2 ? 22 : 50}, 96 30, 100 30`;
}

/** Passos como marcos de uma trilha: o primeiro em lima, o último como destino. */
export function TrilhaDePassos({ passos }: { passos: Passo[] }) {
  const n = passos.length;
  return (
    <div className="relative pt-2">
      <svg
        viewBox="0 0 100 72"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-2 hidden h-[72px] w-full md:block"
      >
        <path
          d={caminho(n)}
          fill="none"
          className="stroke-line-strong"
          strokeWidth="3"
          strokeDasharray="2 9"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <ol
        style={{ "--passos": `repeat(${n}, minmax(0,1fr))` } as CSSProperties}
        className="relative m-0 grid list-none gap-6 p-0 pl-15 before:absolute before:top-[22px] before:bottom-[22px] before:left-[21px] before:border-l-[3px] before:border-dotted before:border-line-strong before:content-[''] md:grid-cols-(--passos) md:gap-4 md:pl-0 md:before:hidden"
      >
        {passos.map((p, i) => {
          const primeiro = i === 0;
          const ultimo = i === n - 1;
          return (
            <li key={p.titulo} className="relative flex flex-col gap-2 md:even:pt-7">
              <span
                className={cx(
                  "absolute top-0 -left-15 grid size-11 flex-none -rotate-45 place-items-center rounded-[50%_50%_50%_8px] md:static",
                  primeiro && "bg-lime shadow-[0_0_0_4px_var(--canvas)]",
                  ultimo && "bg-cream shadow-[0_0_0_4px_var(--canvas),inset_0_0_0_3px_var(--panel)]",
                  !primeiro && !ultimo && "bg-panel shadow-[0_0_0_4px_var(--canvas)]",
                )}
              >
                <span
                  className={cx(
                    "font-display rotate-45 text-[15px] leading-none font-extrabold",
                    primeiro || ultimo ? "text-on-lime" : "text-cream",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </span>
              <h3 className="m-0 text-lg leading-6 font-bold">{p.titulo}</h3>
              <p className="m-0 text-sm leading-5 text-ink-muted">{p.texto}</p>
              {p.tag && (
                <span
                  className={cx(
                    "self-start rounded-full px-2 text-xs leading-5 font-bold",
                    p.tagGenerativa ? "bg-lime text-on-lime" : "bg-surface-sunken text-ink",
                  )}
                >
                  {p.tag}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
