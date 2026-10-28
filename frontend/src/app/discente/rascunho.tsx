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
}: {
  rascunho: ItemRecomendado[];
  chPendente: number | null;
  aoImprimir(): void;
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
              <span>{i.nome}</span>
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
