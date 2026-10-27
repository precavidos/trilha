import type { Contagem, IdadeBibliografia } from "./api";

export type Segmento = "lacuna" | "parcial" | "coberta" | "vazio";

/** Início do eixo cronológico da bibliografia. */
export const EIXO_INICIO = 1960;

const SIMILARIDADE_MINIMA = 0.8;
const SIMILARIDADE_AMPLITUDE = 0.12;

const limitar = (x: number) => Math.min(100, Math.max(0, x));

/**
 * Divide uma barra de `n` segmentos proporcionalmente à contagem,
 * na ordem lacunas → parciais → cobertas.
 */
export function segmentos(c: Contagem, n: number): Segmento[] {
  const total = c.lacuna + c.parcial + c.coberta;
  if (total === 0) return Array.from({ length: n }, () => "vazio");

  const lacunas = Math.round((c.lacuna / total) * n);
  const parciais = Math.min(Math.round((c.parcial / total) * n), n - lacunas);

  return Array.from({ length: n }, (_, i) => {
    if (i < lacunas) return "lacuna";
    if (i < lacunas + parciais) return "parcial";
    return "coberta";
  });
}

/** Componentes em que metade ou mais das referências datadas têm mais de 10 anos. */
export function contarBibliografiasAntigas(linhas: IdadeBibliografia[]): number {
  return linhas.filter((l) => l.comAno > 0 && l.fracaoComMaisDe10Anos >= 0.5).length;
}

/** Ano mais antigo e mais recente entre as referências datadas de todos os componentes. */
export function extremosDaBibliografia(
  linhas: IdadeBibliografia[],
): { maisAntiga: number; maisRecente: number } | null {
  const datadas = linhas.filter(
    (l): l is IdadeBibliografia & { maisAntiga: number; maisRecente: number } =>
      l.maisAntiga !== null && l.maisRecente !== null,
  );
  if (datadas.length === 0) return null;

  return {
    maisAntiga: Math.min(...datadas.map((l) => l.maisAntiga)),
    maisRecente: Math.max(...datadas.map((l) => l.maisRecente)),
  };
}

/** Posição de um ano no eixo, em percentual com uma casa decimal, limitada a 0–100. */
export function posicaoNoEixo(ano: number, inicio: number, fim: number): number {
  return Math.round(limitar(((ano - inicio) / (fim - inicio)) * 100) * 10) / 10;
}

/** Largura de uma similaridade de 0,80 a 0,92 mapeada para 0–100 (inteiro). */
export function larguraDaSimilaridade(sim: number): number {
  return Math.round(limitar(((sim - SIMILARIDADE_MINIMA) / SIMILARIDADE_AMPLITUDE) * 100));
}
