import type { Metadata } from "next";
import { Conteudo } from "./conteudo";

export const metadata: Metadata = { title: "Idade da bibliografia · Trilha" };

export default function Bibliografia() {
  return <Conteudo />;
}
