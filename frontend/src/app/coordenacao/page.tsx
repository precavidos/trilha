import type { Metadata } from "next";
import { Lacunas } from "./lacunas";

export const metadata: Metadata = { title: "Coordenação · Trilha" };

export default function Coordenacao() {
  return <Lacunas />;
}
