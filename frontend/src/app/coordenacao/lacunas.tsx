"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/Botao";
import { BarraCobertura } from "@/components/ui/BarraCobertura";
import { Card } from "@/components/ui/Card";
import { ErroDaApi } from "@/components/ui/ErroDaApi";
import { FiltroPilulas } from "@/components/ui/FiltroPilulas";
import { Kpi } from "@/components/ui/Kpi";
import { CardProfissao } from "@/components/trilha/CardProfissao";
import { LinhaCompetencia } from "@/components/trilha/LinhaCompetencia";
import { LENTE_IA, type Contagem, type IdadeBibliografia, type Item, type Resumo, type Sobre, type Status } from "@/lib/api";
import { contarBibliografiasAntigas } from "@/lib/calculos";
import { dataBR } from "@/lib/formato";
import { useApi } from "@/lib/use-api";

const PAGINA = 25;
const TEXTO_LENTE =
  "Competências de IA curadas pela equipe (Extensão IA), transversais a todas as profissões-alvo.";

type Filtro = Status | "TODAS";

/** Coordenação: KPIs, escolha da profissão-alvo e lista de competências com "Por que isto?". */
export function Lacunas() {
  const resumo = useApi<Resumo>("/api/resumo");
  const bibliografia = useApi<IdadeBibliografia[]>("/api/bibliografia");
  const sobre = useApi<Sobre>("/api/sobre");

  if (resumo.erro) return <ErroDaApi erro={resumo.erro} aoTentarDeNovo={resumo.recarregar} />;
  if (!resumo.dados) return <p aria-busy="true">Carregando a análise do PPC…</p>;

  return (
    <Conteudo
      resumo={resumo.dados}
      bibliografia={bibliografia.dados}
      limiares={sobre.dados?.limiares}
    />
  );
}

type ConteudoProps = {
  resumo: Resumo;
  bibliografia: IdadeBibliografia[] | undefined;
  limiares: Sobre["limiares"] | undefined;
};

function Conteudo({ resumo: r, bibliografia, limiares }: ConteudoProps) {
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("TODAS");
  const [limite, setLimite] = useState(PAGINA);
  const [aberta, setAberta] = useState<string | null>(null);

  const atual = escolhida ?? r.profissoes[0]?.id ?? LENTE_IA;
  const profissao = r.profissoes.find((p) => p.id === atual);
  const rotulo = profissao?.rotulo ?? "Lente transversal de IA";
  const contagem: Contagem = profissao?.contagem ?? r.lenteIa;

  const caminho =
    atual === LENTE_IA ? "/api/lente-ia" : `/api/profissoes/${encodeURIComponent(atual)}/lacunas`;
  const lista = useApi<Item[]>(caminho);

  const escolher = (id: string) => {
    setEscolhida(id);
    setFiltro("TODAS");
    setLimite(PAGINA);
    setAberta(null);
  };
  const filtrar = (f: Filtro) => {
    setFiltro(f);
    setLimite(PAGINA);
    setAberta(null);
  };

  const carregandoLista = lista.carregando || !lista.dados;
  const filtrados = (lista.dados ?? []).filter((i) => filtro === "TODAS" || i.status === filtro);
  const visiveis = filtrados.slice(0, limite);
  const totalLente = r.lenteIa.lacuna + r.lenteIa.parcial + r.lenteIa.coberta;
  const opcoes = [
    ...r.profissoes.map((p) => ({
      id: p.id,
      rotulo: p.rotulo,
      meta: p.itinerarios.join(", "),
      contagem: p.contagem,
    })),
    {
      id: LENTE_IA,
      rotulo: "Lente transversal de IA",
      meta: "Extensão IA · todas as profissões",
      contagem: r.lenteIa,
    },
  ];

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="t-pagina" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex max-w-[720px] flex-col gap-2">
            <p className="text-ink-muted m-0 text-sm font-bold tracking-[.06em] uppercase">
              Coordenação e NDE · SMD Diurno
            </p>
            <h1
              id="t-pagina"
              className="font-display m-0 text-[32px] leading-9 font-extrabold tracking-[-0.01em] md:text-[40px] md:leading-11"
            >
              Onde o PPC não acompanha as profissões-alvo
            </h1>
            <p className="text-ink-muted m-0">
              {r.metadados.documento} comparado com {r.metadados.vocabulario}. Análise gerada em{" "}
              {dataBR(r.metadados.geradoEm)}, sem IA generativa no cálculo.
            </p>
          </div>
          <Botao variante="fantasma" href="/sobre-ia">
            Como isto é calculado
          </Botao>
        </div>

        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4 p-0">
          <li className="*:h-full">
            <Kpi
              variante="painel"
              relevo
              valor={r.componentesComEmenta}
              denominador={r.componentes}
              rotulo="componentes curriculares com ementa no PPC — só eles podem cobrir competências"
            />
          </li>
          <li className="*:h-full">
            <Kpi
              valor={r.competencias}
              rotulo={`competências comparadas com cada ementa (ESCO + ${totalLente} da Extensão IA)`}
            />
          </li>
          <li className="*:h-full">
            <Kpi
              destaque="lacuna"
              valor={r.lenteIa.lacuna}
              denominador={totalLente}
              rotulo="competências de IA sem cobertura clara no PPC (lente transversal)"
            />
          </li>
          <li className="*:h-full">
            <Kpi
              variante="lima"
              href="/coordenacao/bibliografia"
              valor={bibliografia ? contarBibliografiasAntigas(bibliografia) : "—"}
              denominador={bibliografia?.length}
              rotulo="bibliografias com metade ou mais das referências acima de 10 anos →"
            />
          </li>
        </ul>
      </section>

      <section aria-labelledby="t-prof" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="t-prof" className="m-0 text-2xl leading-[30px] font-bold">
            Escolha a profissão-alvo
          </h2>
          <p className="text-ink-muted m-0">
            Uma lacuna é uma competência exigida pela profissão que nenhuma ementa do PPC contempla
            de forma clara.
          </p>
        </div>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4 p-0">
          {opcoes.map((o) => (
            <li key={o.id}>
              <CardProfissao
                id={o.id}
                rotulo={o.rotulo}
                meta={o.meta}
                contagem={o.contagem}
                selecionado={o.id === atual}
                aoEscolher={() => escolher(o.id)}
              />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="t-sel">
        <Card className="flex flex-col gap-6 p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-1">
              <h2 id="t-sel" className="m-0 text-2xl leading-[30px] font-bold">
                {rotulo}
              </h2>
              <p className="text-ink-muted m-0 text-sm">
                {profissao ? (
                  <>
                    Ocupação ESCO:{" "}
                    <a
                      href={profissao.uriEsco}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {profissao.tituloEsco}
                      <span className="sr-only"> (abre em nova aba)</span>
                    </a>
                    {profissao.itinerarios.length > 0 &&
                      ` · Itinerário formativo relacionado: ${profissao.itinerarios.join(", ")}`}
                  </>
                ) : (
                  TEXTO_LENTE
                )}
              </p>
            </div>
            <div className="max-w-[460px] flex-[1_1_320px]">
              <BarraCobertura segmentos={24} contagem={contagem} legenda />
            </div>
          </div>

          <FiltroPilulas<Filtro>
            legenda="Mostrar competências"
            nome="filtro-situacao"
            valor={filtro}
            aoMudar={filtrar}
            opcoes={[
              {
                valor: "TODAS",
                rotulo: "Todas",
                contagem: contagem.lacuna + contagem.parcial + contagem.coberta,
              },
              { valor: "LACUNA", rotulo: "Lacunas", contagem: contagem.lacuna, status: "LACUNA" },
              {
                valor: "PARCIAL",
                rotulo: "Parciais",
                contagem: contagem.parcial,
                status: "PARCIAL",
              },
              {
                valor: "COBERTA",
                rotulo: "Cobertas",
                contagem: contagem.coberta,
                status: "COBERTA",
              },
            ]}
          />

          {lista.erro ? (
            <ErroDaApi erro={lista.erro} aoTentarDeNovo={lista.recarregar} />
          ) : (
            !carregandoLista && (
              <ul className="m-0 list-none p-0">
                {visiveis.map((item) => (
                  <LinhaCompetencia
                    key={item.id}
                    item={item}
                    aberta={aberta === item.id}
                    aoAlternar={() => setAberta(aberta === item.id ? null : item.id)}
                    profissao={rotulo}
                    limiares={limiares}
                  />
                ))}
              </ul>
            )
          )}
          <p
            className="text-ink-muted m-0 text-sm"
            aria-live="polite"
            aria-busy={carregandoLista || undefined}
          >
            {lista.erro
              ? ""
              : carregandoLista
                ? "Carregando competências…"
                : `Mostrando ${visiveis.length} de ${filtrados.length} competências deste filtro, lacunas primeiro.`}
          </p>
          {!lista.erro && !carregandoLista && visiveis.length < filtrados.length && (
            <div>
              <Botao variante="fantasma" onClick={() => setLimite(limite + PAGINA)}>
                Mostrar mais {Math.min(PAGINA, filtrados.length - visiveis.length)}
              </Botao>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
