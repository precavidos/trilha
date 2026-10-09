package br.ufc.trilha.ppc;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

class CasadorDeNomesTest {

	private final CasadorDeNomes casador = new CasadorDeNomes(Map.of(
			"SMD0030", "Análise e Projeto de Sistemas",
			"SMD0108", "Interação Humano-Computador I",
			"SMD0140", "Projeto Integrado I",
			"SMD0141", "Projeto Integrado II"));

	@Test
	void casaIgnorandoAcentosEspacosEPontuacao() {
		assertThat(casador.casar("Interação Humano Computador I"))
			.contains(new CasadorDeNomes.Casamento("SMD0108", true));
		assertThat(casador.casar("ANALISE E PROJETO DE SISTEMAS"))
			.contains(new CasadorDeNomes.Casamento("SMD0030", true));
	}

	@Test
	void casamentoAproximadoESinalizado() {
		assertThat(casador.casar("Análise e Projetos de Sistemas"))
			.contains(new CasadorDeNomes.Casamento("SMD0030", false));
	}

	@Test
	void numeracaoExataVenceAproximada() {
		assertThat(casador.casar("Projeto Integrado II")).contains(new CasadorDeNomes.Casamento("SMD0141", true));
	}

	@Test
	void naoCasaNomeDiferente() {
		assertThat(casador.casar("Prototipação de Jogos Tridimensionais")).isEmpty();
	}

}
