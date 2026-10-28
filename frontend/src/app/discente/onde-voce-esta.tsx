import { Medidor } from "@/components/ui/Medidor";
import { Painel } from "@/components/ui/Painel";
import { CH_PADRAO } from "@/lib/discente";
import type { Trajetoria } from "@/lib/api";

export const TURNOS = { diurno: "Diurno", noturno: "Noturno" } as const;

/** Painel com o retrato da trajetória lida: estrutura, componentes e as cargas que faltam. */
export function OndeVoceEsta({ trajetoria, exemplo }: { trajetoria: Trajetoria; exemplo: boolean }) {
  const aprovados = trajetoria.componentes.filter((c) => c.situacao === "aprovado").length;
  const emCurso = trajetoria.componentes.filter((c) => c.situacao === "matriculado").length;
  const { optativa, extensao } = trajetoria.cargas;
  return (
    <Painel as="section" relevo aria-labelledby="t-lido" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id="t-lido" className="m-0 text-2xl leading-[30px] font-bold">
          Onde você está na trilha
        </h2>
        {exemplo && (
          <span className="bg-lime text-on-lime rounded-full px-3 text-xs leading-5 font-bold">HISTÓRICO DE EXEMPLO</span>
        )}
      </div>
      <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3">
        <Dado rotulo="Estrutura curricular" valor={trajetoria.estrutura} detalhe={trajetoria.turno ? TURNOS[trajetoria.turno] : "turno não informado"} />
        <Dado rotulo="Componentes" valor={String(aprovados)} detalhe={`aprovados · ${emCurso} em curso`} />
        <Dado
          rotulo="Carga optativa"
          valor={optativa ? `${optativa.pendente} h` : "não informada"}
          detalhe={
            optativa
              ? `faltam, de ${optativa.exigido} h (≈ ${Math.ceil(optativa.pendente / CH_PADRAO)} componentes de ${CH_PADRAO} h)`
              : undefined
          }
          medidor={optativa}
        />
        <Dado
          rotulo="Carga de extensão"
          valor={extensao ? `${extensao.pendente} h` : "não informada"}
          detalhe={extensao ? `faltam, de ${extensao.exigido} h` : undefined}
          medidor={extensao}
        />
      </dl>
      <p className="text-on-panel-muted m-0 text-sm">
        Nada disso é guardado: a trajetória fica só nesta página e é reenviada ao pedir as sugestões.
      </p>
    </Painel>
  );
}

function Dado({
  rotulo,
  valor,
  detalhe,
  medidor,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  medidor?: { exigido: number; integralizado: number };
}) {
  return (
    <div className="bg-panel-raised flex min-w-0 flex-col gap-2 rounded-2xl px-5 py-4">
      <dt className="text-on-panel-muted text-sm leading-5">{rotulo}</dt>
      <dd className="m-0 text-[28px] leading-9 font-bold">
        {valor}
        {detalhe && <small className="text-on-panel-muted block text-sm leading-5 font-normal">{detalhe}</small>}
      </dd>
      {medidor && <Medidor valor={medidor.integralizado} maximo={medidor.exigido} tom="painel" />}
    </div>
  );
}
