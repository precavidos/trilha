import type { Contagem, Status } from "@/lib/api";
import { SITUACOES } from "./formato";

export function Situacao({ status }: { status: Status }) {
  const s = SITUACOES[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border border-current px-2 py-0.5 text-sm font-bold whitespace-nowrap ${s.classe}`}
    >
      <span aria-hidden="true">{s.icone}</span>
      {s.rotulo}
    </span>
  );
}

/** Barra empilhada decorativa; os números ficam no texto ao lado. */
export function BarraCobertura({ contagem }: { contagem: Contagem }) {
  const total = contagem.coberta + contagem.parcial + contagem.lacuna || 1;
  const fatias: [keyof Contagem, string][] = [
    ["lacuna", "bg-lacuna"],
    ["parcial", "bg-parcial"],
    ["coberta", "bg-coberta"],
  ];
  return (
    <div aria-hidden="true" className="flex h-2 w-full overflow-hidden rounded bg-surface">
      {fatias.map(([chave, cor]) => (
        <div key={chave} className={cor} style={{ width: `${(contagem[chave] / total) * 100}%` }} />
      ))}
    </div>
  );
}

export function TextoContagem({ contagem }: { contagem: Contagem }) {
  return (
    <p className="text-sm">
      <strong>{contagem.lacuna}</strong> lacunas · <strong>{contagem.parcial}</strong> parciais ·{" "}
      <strong>{contagem.coberta}</strong> cobertas
    </p>
  );
}
