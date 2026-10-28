// Cliente da API do backend. O endereço é embutido no build via NEXT_PUBLIC_API_URL.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/** Id da lente transversal de IA, tratada como uma "profissão" a mais na coordenação. */
export const LENTE_IA = "lente-ia";

export type Status = "COBERTA" | "PARCIAL" | "LACUNA";

export type Contagem = { coberta: number; parcial: number; lacuna: number };

export type Metadados = {
  documento: string;
  vocabulario: string;
  modeloDeEmbeddings: string;
  geradoEm: string;
  anoDeReferencia: number;
};

export type ProfissaoResumo = {
  id: string;
  rotulo: string;
  tituloEsco: string;
  uriEsco: string;
  itinerarios: string[];
  contagem: Contagem;
};

export type Resumo = {
  metadados: Metadados;
  componentes: number;
  componentesComEmenta: number;
  componentesComBibliografia: number;
  competencias: number;
  medianaGeralDaBibliografia: number | null;
  fracaoReferenciasComMaisDe10Anos: number;
  lenteIa: Contagem;
  profissoes: ProfissaoResumo[];
};

export type Limiares = {
  cobertaSimilaridade: number;
  cobertaEscore: number;
  parcialSimilaridade: number;
  parcialEscore: number;
};

/** Configuração em uso no backend (GET /api/sobre). */
export type Sobre = {
  metadados: Metadados;
  modeloDeLinguagem: string;
  limiares: Limiares;
};

export type Evidencia = {
  codigo: string;
  nome: string;
  similaridade: number;
  ementa: string;
};

/** Uma competência exigida, já classificada pelo backend (ADR 0002: sem LLM na classificação). */
export type Item = {
  id: string;
  rotulo: string;
  tipo: string;
  descricao: string;
  fonte: string;
  /** essencial | opcional | transversal-ia */
  relacao: string | null;
  status: Status;
  similaridade: number;
  escore: number;
  evidencias: Evidencia[];
};

export type IdadeBibliografia = {
  codigo: string;
  nome: string;
  referencias: number;
  comAno: number;
  mediana: number | null;
  maisAntiga: number | null;
  maisRecente: number | null;
  fracaoComMaisDe10Anos: number;
};

export type Justificativa = {
  texto: string;
  citados: string[];
  modelo: string;
  geradaEm: string;
  /** true quando o LLM falhou e o texto é só a lista de evidências */
  degradada: boolean;
};

export async function obter<T>(caminho: string): Promise<T> {
  const resposta = await fetch(`${API_URL}${caminho}`);
  if (!resposta.ok) {
    throw new Error(`${resposta.status} em ${caminho}`);
  }
  return resposta.json();
}

export async function justificar(competencia: string): Promise<Justificativa> {
  const resposta = await fetch(
    `${API_URL}/api/justificativas?competencia=${encodeURIComponent(competencia)}`,
    { method: "POST" },
  );
  if (!resposta.ok) {
    throw new Error(`${resposta.status} ao justificar`);
  }
  return resposta.json();
}
