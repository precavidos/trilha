"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { PontoSituacao } from "@/components/ui/ChipSituacao";
import type { Recomendacao } from "@/lib/api";

const TECNOLOGIAS_VISIVEIS = 8;

/** O que nenhuma sugestão alcança: lacunas essenciais e tecnologias que os documentos não citam. */
export function ForaDasSugestoes({ fora }: { fora: Recomendacao["foraDasSugestoes"] }) {
  const [todas, setTodas] = useState(false);
  const { lacunasEssenciais: lacunas, naoDocumentadas } = fora;
  if (lacunas.length === 0 && naoDocumentadas.length === 0) return null;

  const tecnologias = todas ? naoDocumentadas : naoDocumentadas.slice(0, TECNOLOGIAS_VISIVEIS);
  const outras = naoDocumentadas.length - TECNOLOGIAS_VISIVEIS;

  return (
    <Card as="section" aria-labelledby="titulo-fora" className="flex flex-col gap-5 p-8 max-[759px]:p-5">
      <div className="flex max-w-[820px] flex-col gap-1.5">
        <h2 id="titulo-fora" className="m-0 text-2xl leading-[30px] font-bold">
          O que nenhuma optativa do curso cobre
        </h2>
        <p className="text-ink-muted m-0">
          Para chegar a essas profissões, estas competências vão exigir caminhos fora da matriz: projetos de extensão,
          monitoria, estágio, cursos livres.
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-4">
        {lacunas.length > 0 && (
          <div className="bg-lacuna-bg flex flex-col gap-3 rounded-lg p-5">
            <h3 className="text-lacuna m-0 flex items-center gap-2 text-lg leading-6 font-bold">
              <PontoSituacao status="LACUNA" />
              <span>
                {lacunas.length} {lacunas.length === 1 ? "lacuna essencial longe" : "lacunas essenciais longe"} de
                qualquer sugestão
              </span>
            </h3>
            <ul className="m-0 grid gap-1.5 pl-5">
              {lacunas.map((l) => (
                <li key={`${l.rotulo}-${l.profissao}`}>
                  <b>{l.rotulo}</b> <span className="text-ink">· {l.profissao}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {naoDocumentadas.length > 0 && (
          <div className="bg-surface-sunken flex flex-col gap-3 rounded-lg p-5">
            <h3 className="text-ink-muted m-0 flex items-center gap-2 text-lg leading-6 font-bold">
              <PontoSituacao status="NAO_DOCUMENTADA" />
              <span>
                {naoDocumentadas.length}{" "}
                {naoDocumentadas.length === 1 ? "tecnologia que os documentos não citam" : "tecnologias que os documentos não citam"}
              </span>
            </h3>
            <p className="m-0 text-sm leading-5">
              Podem ser usadas em sala sem estar na ementa. Pergunte aos docentes antes de procurar fora.
            </p>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {tecnologias.map((t) => (
                <li
                  key={`${t.rotulo}-${t.profissao}`}
                  className="bg-surface text-ink-muted inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-sm leading-5 font-bold"
                >
                  <PontoSituacao status="NAO_DOCUMENTADA" />
                  {t.rotulo}
                </li>
              ))}
              {outras > 0 && (
                <li>
                  <button
                    type="button"
                    aria-expanded={todas}
                    onClick={() => setTodas((v) => !v)}
                    className="text-ink-muted shadow-[inset_0_0_0_1.5px_var(--line-strong)] inline-flex min-h-11 cursor-pointer items-center rounded-md bg-transparent px-3 text-sm leading-5 font-bold"
                  >
                    {todas ? "Mostrar menos" : `+ ${outras} outras`}
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
