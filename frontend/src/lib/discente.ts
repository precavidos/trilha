import type { ItemRecomendado, Recomendacao, Trajetoria } from "./api";

/** Carga horária assumida quando o componente não informa a sua. */
export const CH_PADRAO = 64;

export type Filtro = "todas" | "extensao" | `profissao:${string}`;

/** Passo da trilha: 0 histórico, 1 profissões, 2 sugestões, 3 rascunho do semestre. */
export function passoAtual(e: {
  trajetoria: Trajetoria | null;
  recomendacao: Recomendacao | null;
  rascunho: ItemRecomendado[];
}): 0 | 1 | 2 | 3 {
  if (!e.trajetoria) return 0;
  if (!e.recomendacao) return 1;
  if (e.rascunho.length > 0) return 3;
  return 2;
}

export function extensaoPendente(t: Trajetoria): boolean {
  return (t.cargas.extensao?.pendente ?? 0) > 0;
}

export function filtrar(itens: ItemRecomendado[], f: Filtro): ItemRecomendado[] {
  if (f === "todas") return itens;
  if (f === "extensao") return itens.filter((i) => i.contaExtensao);
  const profissao = f.slice("profissao:".length);
  return itens.filter((i) => (i.contagem.porProfissao[profissao] ?? 0) > 0);
}

export function filtrosDisponiveis(
  r: Recomendacao,
  comExtensao: boolean,
): { valor: Filtro; rotulo: string; contagem: number }[] {
  const base: { valor: Filtro; rotulo: string }[] = [
    { valor: "todas", rotulo: "Todas" },
    ...r.profissoes.map((p) => ({ valor: `profissao:${p}` as Filtro, rotulo: `Para ${p}` })),
  ];
  if (comExtensao) base.push({ valor: "extensao", rotulo: "Contam extensão" });
  return base.map((f) => ({ ...f, contagem: filtrar(r.itens, f.valor).length }));
}

export function alternarNoRascunho(rascunho: ItemRecomendado[], item: ItemRecomendado): ItemRecomendado[] {
  return rascunho.some((i) => i.codigo === item.codigo)
    ? rascunho.filter((i) => i.codigo !== item.codigo)
    : [...rascunho, item];
}

export function somarRascunho(rascunho: ItemRecomendado[]): { horas: number; contamExtensao: number } {
  return {
    horas: rascunho.reduce((soma, i) => soma + (i.ch ?? CH_PADRAO), 0),
    contamExtensao: rascunho.filter((i) => i.contaExtensao).length,
  };
}
