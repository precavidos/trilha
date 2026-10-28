package br.ufc.trilha.discente;

import java.util.List;

/** Estrutura curricular do SIGAA convertida por data/scripts/estruturas_sigaa.py (ADR 0009). */
public record EstruturaCurricular(String fonte, String codigo, String turno, Integer chTotalMinima, Integer chObrigatoria,
		Integer chOptativaMinima, Integer chOptativosLivresMaxima, Integer chAtividadesComplementares,
		Integer chExtensao, Integer chTcc, List<Grupo> grupos, List<Componente> componentes) {

	/**
	 * {@code preRequisitos} e {@code equivalencias} em forma normal disjuntiva: alternativas, cada uma com
	 * os códigos exigidos em conjunto.
	 */
	public record Componente(String codigo, String nome, Integer ch, Integer chExtensao, String tipo, String natureza,
			Integer semestre, List<List<String>> preRequisitos, List<List<String>> equivalencias) {

		boolean optativo() {
			return "optativo".equals(natureza);
		}

		/** Só disciplinas e módulos entram na recomendação; atividades, TCC e unidades especiais, não. */
		boolean recomendavel() {
			return optativo() && (tipo.startsWith("disciplina") || tipo.startsWith("modulo") || tipo.startsWith("módulo"));
		}
	}

	public record Grupo(String nome, List<String> componentes, Integer minimo, Integer maximo) {
	}

}
