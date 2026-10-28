package br.ufc.trilha.analise;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RotuloExibicaoTest {

	@Test
	void rotuloDaEscoGanhaInicialMaiuscula() {
		assertThat(AnaliseService.paraExibicao("design de interação de software"))
			.isEqualTo("Design de interação de software");
		assertThat(AnaliseService.paraExibicao("ética profissional")).isEqualTo("Ética profissional");
	}

	@Test
	void nomesPropriosEInicialMaiusculaFicamComoNaFonte() {
		assertThat(AnaliseService.paraExibicao("WordPress")).isEqualTo("WordPress");
		assertThat(AnaliseService.paraExibicao("C#")).isEqualTo("C#");
		assertThat(AnaliseService.paraExibicao("normas do Consórcio World Wide Web"))
			.isEqualTo("Normas do Consórcio World Wide Web");
		assertThat(AnaliseService.paraExibicao("Produção de conteúdo com IA generativa"))
			.isEqualTo("Produção de conteúdo com IA generativa");
	}

	@Test
	void rotuloVazioOuNulo() {
		assertThat(AnaliseService.paraExibicao("")).isEmpty();
		assertThat(AnaliseService.paraExibicao(null)).isNull();
	}

}
