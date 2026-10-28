"use client";

import { useState } from "react";
import { TrilhaDePassos } from "@/components/trilha/TrilhaDePassos";
import { Botao } from "@/components/ui/Botao";
import type { ItemRecomendado, Recomendacao, Trajetoria } from "@/lib/api";
import { alternarNoRascunho, extensaoPendente, passoAtual, type Filtro } from "@/lib/discente";
import { EnvioDoHistorico, type Origem } from "./envio";
import { OndeVoceEsta } from "./onde-voce-esta";
import { ForaDasSugestoes } from "./fora-das-sugestoes";
import { EscolhaDeProfissoes } from "./profissoes";
import { ResumoParaImpressao } from "./resumo-impressao";
import { Sugestoes } from "./sugestoes";

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
    <div className="flex flex-col gap-8">
      {trajetoria && (
        <div className="flex justify-end">
          <Botao variante="fantasma" onClick={recomecar}>
            Recomeçar e apagar dados da página
          </Botao>
        </div>
      )}
      <TrilhaDePassos passos={PASSOS} nivelDoTitulo="h2" atual={passoAtual({ trajetoria, recomendacao, rascunho })} />
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
          aoRecomendar={(r) => {
            setFiltro("todas");
            setRecomendacao(r);
          }}
        />
      )}
      {recomendacao && trajetoria && (
        <Sugestoes
          recomendacao={recomendacao}
          filtro={filtro}
          aoFiltrar={setFiltro}
          rascunho={rascunho}
          aoAlternar={(item) => setRascunho((r) => alternarNoRascunho(r, item))}
          comExtensao={extensaoPendente(trajetoria)}
          chPendente={recomendacao.chOptativaPendente}
          aoImprimir={() => window.print()}
        />
      )}
      {recomendacao && trajetoria && <ForaDasSugestoes fora={recomendacao.foraDasSugestoes} />}
      {recomendacao && trajetoria && (
        <ResumoParaImpressao recomendacao={recomendacao} rascunho={rascunho} trajetoria={trajetoria} />
      )}
    </div>
  );
}
