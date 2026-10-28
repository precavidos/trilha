// Cliente da API do backend. O endereço é embutido no build via NEXT_PUBLIC_API_URL.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/** Id da lente transversal de IA, tratada como uma "profissão" a mais na coordenação. */
export const LENTE_IA = "lente-ia";

/** NAO_DOCUMENTADA: tecnologia nomeada que o PPC e os programas não citam (pode ser ensinada sem registro). */
export type Status = "COBERTA" | "PARCIAL" | "LACUNA" | "NAO_DOCUMENTADA";

export type Contagem = { coberta: number; parcial: number; lacuna: number; naoDocumentada: number };

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
  /** PPC | programa (o PPC não traz a ementa; veio do formulário da disciplina). */
  fonteEmenta: "PPC" | "programa" | null;
  /** Tecnologias nomeadas: onde o nome aparece ("objetivos do programa: Python"); null na similaridade. */
  citadaEm: string | null;
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
  /** similaridade | citacao (tecnologias nomeadas: a situação vem de o nome aparecer no PPC). */
  criterio: "similaridade" | "citacao";
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

/* ---------- módulo discente ---------- */

/** O que o Trilha guarda do histórico (ADR 0003): nada de nome, matrícula, notas ou docentes. */
export type Trajetoria = {
  estrutura: string;
  /** Diurno e Noturno têm estruturas próprias no SIGAA com o mesmo código de versão. */
  turno: "diurno" | "noturno" | null;
  componentes: { codigo: string; periodo: string | null; situacao: string; ch: number | null; marcador: string | null }[];
  cargas: Record<string, { exigido: number; integralizado: number; pendente: number }>;
  obrigatoriosPendentes: string[];
};

export type CompetenciaContemplada = {
  competencia: string;
  rotulo: string;
  fonte: string;
  relacao: string;
  profissao: string;
  situacaoNoPpc: Status;
  similaridade: number;
  posicao: number;
  peso: number;
};

export type ItemRecomendado = {
  codigo: string;
  nome: string;
  ch: number | null;
  pontuacao: number;
  /** Código equivalente na matriz atual, quando a estrutura do discente é antiga. */
  codigoNoPpc: string | null;
  ementa: string | null;
  competencias: CompetenciaContemplada[];
  itinerarios: { itinerario: string; papel: string }[];
  grupo: { grupo: string; cumpridos: number; minimo: number } | null;
  contaExtensao: boolean;
  preRequisitos: string[];
  /** Todas as competências que o componente contempla, com a posição de cada uma (começa em 0). */
  evidencias: CompetenciaContemplada[];
  /** Quantas competências contempla por profissão-alvo (chave: rótulo), no total e as ainda não cobertas. */
  contagem: { porProfissao: Record<string, number>; total: number; naoCobertas: number };
  /** Ressalva sobre a ementa, quando há. */
  notaEmenta: string | null;
};

/** Competência que nenhuma sugestão alcança. */
export type CompetenciaFora = { rotulo: string; profissao: string };

export type Recomendacao = {
  estrutura: string;
  turno: "diurno" | "noturno";
  profissoes: string[];
  aprovados: number;
  emCurso: number;
  chOptativaPendente: number | null;
  componentesSugeridos: number;
  avisos: string[];
  itens: ItemRecomendado[];
  /** O que as sugestões não alcançam: lacunas essenciais e tecnologias sem registro no PPC. */
  foraDasSugestoes: { lacunasEssenciais: CompetenciaFora[]; naoDocumentadas: CompetenciaFora[] };
};

async function erroDaResposta(resposta: Response): Promise<Error> {
  try {
    const corpo = await resposta.json();
    if (corpo?.erro) return new Error(corpo.erro);
  } catch {
    // corpo não é JSON
  }
  return new Error(`erro ${resposta.status}`);
}

/** Envia o PDF do histórico; o servidor lê em memória, não grava, e devolve só a trajetória. */
export async function lerHistorico(arquivo: File): Promise<Trajetoria> {
  const dados = new FormData();
  dados.append("arquivo", arquivo);
  const resposta = await fetch(`${API_URL}/api/discente/historico`, { method: "POST", body: dados });
  if (!resposta.ok) throw await erroDaResposta(resposta);
  return resposta.json();
}

export async function recomendar(trajetoria: Trajetoria, profissoes: string[]): Promise<Recomendacao> {
  const resposta = await fetch(`${API_URL}/api/discente/recomendacao`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trajetoria, profissoes }),
  });
  if (!resposta.ok) throw await erroDaResposta(resposta);
  return resposta.json();
}

/** Histórico fictício para experimentar o fluxo sem enviar o próprio PDF. */
export async function historicoDeExemplo(): Promise<Trajetoria> {
  const resposta = await fetch(`${API_URL}/api/discente/historico-exemplo`);
  if (!resposta.ok) throw await erroDaResposta(resposta);
  return resposta.json();
}
