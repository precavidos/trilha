import type { Status } from "@/lib/api";

const decimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const porcento = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 0,
});

export const formatarDecimal = (n: number) => decimal.format(n);
export const formatarPorcento = (n: number) => porcento.format(n);

export const SITUACOES: Record<
  Status,
  { rotulo: string; plural: string; icone: string; classe: string }
> = {
  LACUNA: { rotulo: "Lacuna", plural: "Lacunas", icone: "○", classe: "text-lacuna bg-lacuna-bg" },
  PARCIAL: { rotulo: "Parcial", plural: "Parciais", icone: "◐", classe: "text-parcial bg-parcial-bg" },
  COBERTA: { rotulo: "Coberta", plural: "Cobertas", icone: "●", classe: "text-coberta bg-coberta-bg" },
};

export const RELACOES: Record<string, string> = {
  essencial: "Essencial",
  opcional: "Opcional",
  "transversal-ia": "Transversal (IA)",
};
