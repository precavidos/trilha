import { Botao } from "@/components/ui/Botao";
import { Card } from "@/components/ui/Card";
import { Medidor } from "@/components/ui/Medidor";
import type { ItemRecomendado } from "@/lib/api";
import { somarRascunho } from "@/lib/discente";

/** Rascunho de semestre: só existe na memória da página; o resumo sai pela impressão. */
export function Rascunho({
  rascunho,
  chPendente,
  aoImprimir,
  aoRemover,
}: {
  rascunho: ItemRecomendado[];
  chPendente: number | null;
  aoImprimir(): void;
  aoRemover(item: ItemRecomendado): void;
}) {
  const { horas, contamExtensao } = somarRascunho(rascunho);
  const vazio = rascunho.length === 0;

  return (
    <Card as="aside" aria-labelledby="titulo-rascunho" className="flex flex-col gap-3 p-6 min-[980px]:sticky min-[980px]:top-4">
      <h3 id="titulo-rascunho" className="m-0 text-lg leading-6 font-bold">
        Seu rascunho de semestre
      </h3>
      <div aria-live="polite" className="flex flex-col gap-2">
        <p className="m-0">
          <b className="font-display text-[32px] leading-9">{horas} h</b>{" "}
          {chPendente != null && <span className="text-ink-muted">de {chPendente} h pendentes</span>}
        </p>
        {chPendente != null && <Medidor valor={horas} maximo={chPendente} />}
      </div>
      {vazio && (
        <p className="text-ink-muted m-0 text-sm">
          Use “Adicionar ao rascunho” nas sugestões para montar uma proposta.
        </p>
      )}
      {!vazio && (
        <ol className="m-0 grid list-none gap-2 p-0">
          {rascunho.map((i) => (
            <li key={i.codigo} className="flex items-baseline gap-2 text-sm leading-5">
              <span className="bg-lime text-on-lime rounded-md px-1.5 font-mono">{i.codigo}</span>
              <span className="min-w-0 flex-1">{i.nome}</span>
              <button
                type="button"
                aria-label={`Remover ${i.codigo} do rascunho`}
                onClick={() => aoRemover(i)}
                className="text-ink hover:bg-surface-sunken -my-3 -mr-2 grid size-11 flex-none cursor-pointer place-items-center self-center rounded-md border-0 bg-transparent"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden className="size-4">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ol>
      )}
      {contamExtensao > 0 && (
        <p className="text-ink-muted m-0 text-sm">
          {contamExtensao} {contamExtensao === 1 ? "delas conta" : "delas contam"} carga de extensão.
        </p>
      )}
      <Botao variante="painel" disabled={vazio} onClick={aoImprimir} className="justify-center whitespace-normal">
        Baixar resumo para o tutor (PDF)
      </Botao>
      <p className="text-ink-muted m-0 text-[13px] leading-[18px]">
        O resumo leva os códigos, as competências e as evidências; nenhum dado pessoal. Confira a oferta de turmas no
        SIGAA antes da matrícula.
      </p>
    </Card>
  );
}
