import type { Status } from "@/lib/api";
import { PontoSituacao } from "./ChipSituacao";

type Opcao<T extends string> = { valor: T; rotulo: string; contagem: number; status?: Status };

type Props<T extends string> = {
  legenda: string;
  nome: string;
  opcoes: Opcao<T>[];
  valor: T;
  aoMudar(v: T): void;
};

/** Filtro em pílulas: grupo de rádios, navegável por teclado. */
export function FiltroPilulas<T extends string>({ legenda, nome, opcoes, valor, aoMudar }: Props<T>) {
  return (
    <fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0">
      <legend className="sr-only">{legenda}</legend>
      {opcoes.map((o) => (
        <label
          key={o.valor}
          className="relative inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-line-strong bg-surface px-4 text-sm leading-5 font-bold text-ink has-checked:border-panel has-checked:bg-panel has-checked:text-on-panel has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--focus)"
        >
          <input
            type="radio"
            name={nome}
            value={o.valor}
            checked={o.valor === valor}
            onChange={() => aoMudar(o.valor)}
            className="absolute inset-0 m-0 cursor-pointer opacity-0"
          />
          {o.status && <PontoSituacao status={o.status} />}
          {o.rotulo}
          <span className="font-normal opacity-85">{o.contagem}</span>
        </label>
      ))}
    </fieldset>
  );
}
