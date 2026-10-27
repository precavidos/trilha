"use client";

import { useEffect, useState } from "react";
import { obter } from "./api";

type Estado<T> = { caminho: string; dados?: T; erro?: string };

/** GET no backend a partir do navegador; refaz a leitura quando o caminho muda. */
export function useApi<T>(caminho: string) {
  const [estado, setEstado] = useState<Estado<T>>({ caminho });

  useEffect(() => {
    let ativo = true;
    obter<T>(caminho).then(
      (dados) => ativo && setEstado({ caminho, dados }),
      (e: Error) => ativo && setEstado({ caminho, erro: e.message }),
    );
    return () => {
      ativo = false;
    };
  }, [caminho]);

  // Resultado de um caminho anterior ainda em tela conta como carregando.
  const atual = estado.caminho === caminho;
  return {
    dados: atual ? estado.dados : undefined,
    erro: atual ? estado.erro : undefined,
    carregando: !atual || (estado.dados === undefined && estado.erro === undefined),
  };
}
