import type { ItemRecomendado, Recomendacao, Trajetoria } from "@/lib/api";
import { somarRascunho } from "@/lib/discente";
import { SITUACOES } from "@/lib/formato";
import { nomeDaEstrutura } from "./sugestoes";

/**
 * Resumo para o tutor: só aparece na impressão. Leva códigos, competências e evidências;
 * nenhum dado pessoal (a trajetória só entra pela estrutura e pelo turno).
 */
export function ResumoParaImpressao({
  recomendacao: r,
  rascunho,
  trajetoria,
}: {
  recomendacao: Recomendacao;
  rascunho: ItemRecomendado[];
  trajetoria: Trajetoria;
}) {
  const { horas } = somarRascunho(rascunho);
  return (
    <section id="resumo-tutor" aria-label="Resumo para o tutor" className="hidden print:block">
      <h1 className="m-0 text-2xl font-bold">Trilha · rascunho de semestre</h1>
      <p className="m-0 mt-1 text-sm">
        {new Date().toLocaleDateString("pt-BR")} · Estrutura {nomeDaEstrutura(r.estrutura, trajetoria.turno ?? r.turno)}
      </p>
      <p className="m-0 mt-1 text-sm">
        Profissões-alvo: <b>{r.profissoes.join(" e ")}</b>
        {r.chOptativaPendente != null && <> · Carga optativa pendente: {r.chOptativaPendente} h</>} · Rascunho: {horas} h
      </p>
      <ol className="m-0 mt-4 grid list-none gap-4 p-0">
        {rascunho.map((i) => (
          <li key={i.codigo} className="break-inside-avoid border-t border-black pt-3">
            <p className="m-0 text-base font-bold">
              <span className="font-mono">{i.codigo}</span> · {i.nome}
              {i.ch != null && <> · {i.ch} h</>}
            </p>
            <p className="m-0 mt-1 text-sm">
              {[
                ...i.itinerarios.map((p) => `Itinerário ${p.itinerario} (${p.papel})`),
                ...(i.grupo ? [`${i.grupo.grupo}: ${i.grupo.cumpridos} de ${i.grupo.minimo} cumpridos`] : []),
                ...(i.contaExtensao ? ["Conta carga de extensão"] : []),
              ].join(" · ")}
            </p>
            {i.evidencias.length > 0 && (
              <ul className="m-0 mt-1 list-disc pl-5 text-sm">
                {i.evidencias.slice(0, 5).map((c) => (
                  <li key={`${c.competencia}-${c.profissao}`}>
                    {c.rotulo} ({c.profissao}) · {SITUACOES[c.situacaoNoPpc].rotulo} no PPC
                  </li>
                ))}
              </ul>
            )}
            {i.ementa && (
              <p className="m-0 mt-1 text-sm">
                <b>Ementa:</b> {i.ementa}
              </p>
            )}
          </li>
        ))}
      </ol>
      <p className="m-0 mt-6 border-t border-black pt-3 text-sm">
        A recomendação apoia, mas não substitui, a orientação do Grupo de Professores Tutores e da coordenação. Confira
        a oferta de turmas no SIGAA antes da matrícula.
      </p>
    </section>
  );
}
