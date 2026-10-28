package br.ufc.trilha.discente;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

class RecomendadorTest {

	private static EstruturaCurricular.Componente comp(String codigo, List<List<String>> pre, List<List<String>> equiv) {
		return new EstruturaCurricular.Componente(codigo, codigo, 64, 0, "disciplina", "optativo", null, pre, equiv);
	}

	private final Map<String, EstruturaCurricular.Componente> estrutura = Map.of(
			"SMD0086", comp("SMD0086", List.of(), List.of(List.of("ICA1310"), List.of("SMD0144"))),
			"SMD0092", comp("SMD0092", List.of(List.of("SMD0105", "SMD0096")), List.of(List.of("SMD0140"))),
			"SMD0050", comp("SMD0050", List.of(List.of("SMD0017"), List.of("SMD0037")), List.of()));

	@Test
	void cumpridoPorEquivalenciaEntreCurriculos() {
		// Quem cursou a Fotografia Digital da matriz nova (SMD0144) cumpriu a da 2013.2 (SMD0086).
		assertThat(Recomendador.cumprido("SMD0086", Set.of("SMD0144"), estrutura)).isTrue();
		assertThat(Recomendador.cumprido("SMD0086", Set.of("SMD0016"), estrutura)).isFalse();
	}

	@Test
	void preRequisitoComEExigeTodos() {
		var pi1 = estrutura.get("SMD0092");
		assertThat(Recomendador.preRequisitosOk(pi1, Set.of("SMD0105"), estrutura)).isFalse();
		assertThat(Recomendador.preRequisitosOk(pi1, Set.of("SMD0105", "SMD0096"), estrutura)).isTrue();
	}

	@Test
	void preRequisitoComOuAceitaQualquerUm() {
		var distribuidos = estrutura.get("SMD0050");
		assertThat(Recomendador.preRequisitosOk(distribuidos, Set.of("SMD0037"), estrutura)).isTrue();
		assertThat(Recomendador.preRequisitosOk(distribuidos, Set.of("SMD0099"), estrutura)).isFalse();
	}

	@Test
	void nomeLegivel() {
		assertThat(Recomendador.nomeLegivel("PROGRAMAÇÃO PARA WEB I")).isEqualTo("Programação para Web I");
		assertThat(Recomendador.nomeLegivel("INTERAÇÃO HUMANO-COMPUTADOR II")).isEqualTo("Interação Humano-Computador II");
		assertThat(Recomendador.nomeLegivel("CONCEPÇÃO DE CENÁRIOS E DE PERSONAGENS"))
			.isEqualTo("Concepção de Cenários e de Personagens");
	}

}
