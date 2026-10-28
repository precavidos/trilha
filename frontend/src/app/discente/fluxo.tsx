"use client";

import { useEffect, useRef, useState } from "react";
import { TrilhaDePassos } from "@/components/trilha/TrilhaDePassos";
import { Aviso } from "@/components/ui/Aviso";
import { Botao } from "@/components/ui/Botao";
import { Card } from "@/components/ui/Card";
import { ChipSituacao } from "@/components/ui/ChipSituacao";
import type { ItemRecomendado, Recomendacao, Trajetoria } from "@/lib/api";
import { passoAtual, type Filtro } from "@/lib/discente";
import { formatarSimilaridade, RELACOES } from "@/lib/formato";
import { EnvioDoHistorico, type Origem } from "./envio";
import { OndeVoceEsta, TURNOS } from "./onde-voce-esta";
import { EscolhaDeProfissoes } from "./profissoes";

function nomeDaEstrutura(estrutura: string, turno: keyof typeof TURNOS | null) {
  return turno ? `${TURNOS[turno]} ${estrutura}` : estrutura;
}

const PASSOS = [
  { titulo: "Envie o histórico", texto: "PDF do SIGAA, lido em memória." },
  { titulo: "Escolha profissões-alvo", texto: "Até duas, ligadas aos itinerários." },
  { titulo: "Veja as sugestões", texto: "Optativas e eletivas elegíveis, com o porquê." },
  { titulo: "Leve ao tutor", texto: "Um rascunho de semestre para conversar." },
];

/** Envio do histórico → escolha das profissões-alvo → recomendação com evidências. */
export function FluxoDiscente() {
  const [trajetoria, setTrajetoria] = useState<Trajetoria | null>(null);
  const [origem, setOrigem] = useState<Origem | null>(null);
  const [nomeDoArquivo, setNomeDoArquivo] = useState<string | null>(null);
  const [escolhidas, setEscolhidas] = useState<string[]>([]);
  const [recomendacao, setRecomendacao] = useState<Recomendacao | null>(null);
  // Ainda sem uso visível: as próximas tarefas ligam o filtro e o rascunho à lista.
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [rascunho, setRascunho] = useState<ItemRecomendado[]>([]);

  /** Uma trajetória nova invalida tudo o que dependia da anterior (ou limpa, com `t` nulo). */
  const limpar = () => {
    setEscolhidas([]);
    setRecomendacao(null);
    setFiltro("todas");
    setRascunho([]);
  };
  const novaTrajetoria = (t: Trajetoria | null, o: Origem | null, nome: string | null) => {
    limpar();
    setTrajetoria(t);
    setOrigem(o);
    setNomeDoArquivo(nome);
  };
  const recomecar = () => {
    novaTrajetoria(null, null, null);
    // O título some e volta com a tela inicial: o foco espera a renderização.
    requestAnimationFrame(() => document.getElementById("t-envio")?.focus());
  };
  // Trocar as profissões descarta a recomendação, mas o rascunho do semestre fica.
  const trocarProfissoes = (ids: string[]) => {
    setEscolhidas(ids);
    setRecomendacao(null);
    setFiltro("todas");
  };

  return (
    <div className="flex flex-col gap-8" data-filtro={filtro} data-rascunho={rascunho.length}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <TrilhaDePassos passos={PASSOS} nivelDoTitulo="h2" atual={passoAtual({ trajetoria, recomendacao, rascunho })} />
        </div>
        {trajetoria && (
          <Botao variante="fantasma" onClick={recomecar}>
            Recomeçar e apagar dados da página
          </Botao>
        )}
      </div>
      <EnvioDoHistorico
        lido={trajetoria && origem && nomeDoArquivo ? { origem, nome: nomeDoArquivo } : null}
        aoComecar={() => novaTrajetoria(null, null, null)}
        aoLer={(t, o, nome) => novaTrajetoria(t, o, nome)}
      />
      {trajetoria && <OndeVoceEsta trajetoria={trajetoria} exemplo={origem === "exemplo"} />}
      {trajetoria && (
        <EscolhaDeProfissoes
          trajetoria={trajetoria}
          escolhidas={escolhidas}
          aoMudar={trocarProfissoes}
          aoRecomendar={setRecomendacao}
        />
      )}
      {recomendacao && <ListaDeRecomendacoes recomendacao={recomendacao} />}
    </div>
  );
}

function ListaDeRecomendacoes({ recomendacao: r }: { recomendacao: Recomendacao }) {
  // Leva o foco ao título da lista: anuncia o resultado sem ler a lista inteira numa região viva.
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => titulo.current?.focus(), [r]);

  return (
    <section aria-labelledby="titulo-recomendacoes" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="titulo-recomendacoes" ref={titulo} tabIndex={-1} className="m-0 text-2xl leading-[30px] font-bold">
          3. Optativas e eletivas sugeridas para {r.profissoes.join(" e ")}
        </h2>
        <p className="text-ink-muted m-0">
          {r.chOptativaPendente != null
            ? `Faltam ${r.chOptativaPendente} h de carga optativa (cerca de ${r.componentesSugeridos} componente${r.componentesSugeridos === 1 ? "" : "s"} de 64 h). `
            : ""}
          Só aparecem componentes da sua estrutura ({nomeDaEstrutura(r.estrutura, r.turno)}) que você ainda não cursou e
          cujos pré-requisitos já cumpriu. A ordem é calculada sem IA generativa.
        </p>
      </div>
      {r.avisos.map((a) => (
        <Aviso key={a} tom="info">
          {a}
        </Aviso>
      ))}
      {r.itens.length === 0 ? (
        <Aviso tom="atencao">Nenhum componente elegível tem relação com as profissões escolhidas.</Aviso>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {r.itens.map((item, i) => (
            <ItemDaLista key={item.codigo} item={item} posicao={i + 1} />
          ))}
        </ol>
      )}
      <p className="text-ink-muted m-0 text-sm">
        A recomendação apoia, mas não substitui, a orientação do Grupo de Professores Tutores e da coordenação. Confira
        a oferta de turmas no SIGAA antes da matrícula.
      </p>
    </section>
  );
}

function ItemDaLista({ item, posicao }: { item: ItemRecomendado; posicao: number }) {
  return (
    <Card as="li" className="flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-ink-muted text-sm font-bold" aria-hidden="true">
          {posicao}.
        </span>
        <span className="bg-lime text-on-lime rounded-md px-1.5 font-mono text-sm">{item.codigo}</span>
        <h3 className="m-0 text-lg leading-6 font-bold">{item.nome}</h3>
        {item.ch != null && <span className="text-ink-muted text-sm">{item.ch} h</span>}
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0 text-sm">
        {item.itinerarios.map((p) => (
          <li key={p.itinerario} className="bg-lime-soft rounded-full px-3 py-0.5">
            Itinerário {p.itinerario} ({p.papel})
          </li>
        ))}
        {item.grupo && (
          <li className="bg-sky rounded-full px-3 py-0.5">
            {item.grupo.grupo}: {item.grupo.cumpridos} de {item.grupo.minimo} cumpridos
          </li>
        )}
        {item.contaExtensao && <li className="bg-sky rounded-full px-3 py-0.5">Conta carga de extensão</li>}
      </ul>
      <details className="group">
        <summary className="text-panel cursor-pointer font-bold">
          Por que isto?<span className="sr-only"> ({item.nome})</span>
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          {item.competencias.length > 0 ? (
            <div>
              <p className="m-0 mb-2 text-sm">
                A ementa está entre as mais próximas destas competências das profissões escolhidas:
              </p>
              <ul className="m-0 flex flex-col gap-2 p-0">
                {item.competencias.map((c) => (
                  <li key={c.competencia} className="flex flex-wrap items-center gap-2 text-sm">
                    <ChipSituacao status={c.situacaoNoPpc} />
                    <b>{c.rotulo}</b>
                    <span className="text-ink-muted">
                      {RELACOES[c.relacao] ?? c.relacao} para {c.profissao} · {c.fonte} · similaridade{" "}
                      {formatarSimilaridade(c.similaridade)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="m-0 text-sm">
              Sem competências associadas: o PPC não traz a ementa deste componente, ou ela não é a mais próxima de
              nenhuma competência das profissões escolhidas. Ele aparece pelo itinerário formativo ou pelo grupo.
            </p>
          )}
          {item.codigoNoPpc && (
            <p className="m-0 text-sm">
              Na matriz atual, este componente equivale a <span className="font-mono">{item.codigoNoPpc}</span>; a
              ementa analisada é a desse código.
            </p>
          )}
          {item.ementa && (
            <blockquote className="border-line-strong m-0 border-l-4 pl-3 text-sm">
              <span className="font-bold">Ementa: </span>
              {item.ementa}
            </blockquote>
          )}
          {item.preRequisitos.length > 0 && (
            <p className="text-ink-muted m-0 text-sm">Pré-requisito cumprido: {item.preRequisitos.join(" ou ")}.</p>
          )}
        </div>
      </details>
    </Card>
  );
}
