package br.ufc.trilha.ppc;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ReferenciaTest {

	@Test
	void anoIgnoraIsbn() {
		assertThat(Referencia.anoDePublicacao("Editora Wiley. 2009. ISBN: 0470345179.")).isEqualTo(2009);
		assertThat(Referencia.anoDePublicacao("Bookman, 2013. ISBN 9788580552676 (broch.).")).isEqualTo(2013);
	}

	@Test
	void anoIgnoraDataDeAcesso() {
		assertThat(Referencia.anoDePublicacao(
				"FILHO, Dirceu Z. Matemática e Arte. Grupo Autêntica, 2013. E-book. Acesso em:16 jun. 2023."))
			.isEqualTo(2013);
	}

	@Test
	void anoComCopyright() {
		assertThat(Referencia.anoDePublicacao("York: Reinhold Book, c1964.")).isEqualTo(1964);
	}

	@Test
	void semAno() {
		assertThat(Referencia.anoDePublicacao("O desenho animado. Lisboa: Editorial Estúdios Cor, s.d.")).isNull();
	}

}
