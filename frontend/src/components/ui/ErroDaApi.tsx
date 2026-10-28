"use client";

import { Aviso } from "./Aviso";
import { Botao } from "./Botao";

/** Falha ao falar com a API, com a opção de repetir a leitura. */
export function ErroDaApi({ erro, aoTentarDeNovo }: { erro: string; aoTentarDeNovo(): void }) {
  return (
    <Aviso tom="atencao" role="alert">
      <p className="m-0">Não foi possível falar com o servidor da análise.</p>
      <p className="m-0 mt-1 font-normal">{erro}</p>
      <div className="mt-3">
        <Botao variante="fantasma" onClick={aoTentarDeNovo}>
          Tentar de novo
        </Botao>
      </div>
    </Aviso>
  );
}
