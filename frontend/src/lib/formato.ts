import type { Status } from "@/lib/api";

const decimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const similaridade = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});
const porcento = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 0,
});

export const formatarDecimal = (n: number) => decimal.format(n);
export const formatarSimilaridade = (n: number) => similaridade.format(n);
// A data vem como AAAA-MM-DD; não passa por Date para o fuso não deslocar o dia.
export const dataBR = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
};

export const formatarPorcento = (n: number) => porcento.format(n);

export const SITUACOES: Record<Status, { rotulo: string }> = {
  LACUNA: { rotulo: "Lacuna" },
  PARCIAL: { rotulo: "Parcial" },
  COBERTA: { rotulo: "Coberta" },
};

export const RELACOES: Record<string, string> = {
  essencial: "Essencial",
  opcional: "Opcional",
  "transversal-ia": "Transversal (IA)",
};
