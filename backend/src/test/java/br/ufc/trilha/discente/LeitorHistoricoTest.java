package br.ufc.trilha.discente;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import br.ufc.trilha.ppc.LinhaPdf;

/**
 * Fixtures sintéticas que reproduzem o layout do histórico do SIGAA/UFC lido pelo PDFBox. Nenhum dado
 * pessoal real: nomes e docentes fictícios, que o leitor deve ignorar.
 */
class LeitorHistoricoTest {

	private static List<LinhaPdf> linhas(String... textos) {
		List<LinhaPdf> l = new ArrayList<>();
		for (String t : textos) {
			l.add(new LinhaPdf(1, 100, t));
		}
		return l;
	}

	private static final List<LinhaPdf> HISTORICO = linhas(
			"Histórico Escolar - Emitido em: 28/10/2026",
			"Nome: Fulana de Tal",
			"Currículo: 2013.2",
			"Componentes Curriculares Cursados/Cursando",
			"2023.1",
			"2023.1",
			"AUTORAÇÃO MULTIMÍDIA I",
			"01",
			"APROVADO MÉDIASMD0088",
			"96.87 9.364.00",
			"Docente(s): Professora Fictícia (Mestrado)",
			"2024.2",
			"ANÁLISE E PROJETO DE SISTEMAS",
			"01A",
			"APROVADO MÉDIASMD0030",
			"87.50 9.1*",
			"64.00Docente(s): Professor Fictício (Doutorado)",
			"2025.1",
			"PROGRAMAÇÃO I",
			"REPROVADO POR NOTASMD0095",
			"75.00 3.264.00",
			"2026.2",
			"TRABALHO DE CONCLUSÃO DE CURSO",
			"--",
			"MATRICULADOSMD0077",
			"-- --@",
			"128.00",
			"Orientação: Professor Fictício",
			"Componentes Curriculares Obrigatórios Pendentes: 2",
			"SMDG0001 ATIVIDADES COMPLEMENTARES",
			"SMD0077 TRABALHO DE CONCLUSÃO DE CURSO",
			"Exigido Integralizado Computável Pendente",
			"Carga Horária de Extensão",
			"0", "16", "16", "0",
			"Exigido Integralizado Computável Pendente",
			"Carga Horária Optativa",
			"1216", "1152", "1152", "64");

	@Test
	void extraiEstruturaComponentesECargas() {
		Trajetoria t = LeitorHistorico.ler(HISTORICO);

		assertThat(t.estrutura()).isEqualTo("2013.2");
		assertThat(t.componentes()).containsExactly(
				new Trajetoria.Cursado("SMD0088", "2023.1", "aprovado", 64, null),
				new Trajetoria.Cursado("SMD0030", "2024.2", "aprovado", 64, "*"),
				new Trajetoria.Cursado("SMD0095", "2025.1", "reprovado", 64, null),
				new Trajetoria.Cursado("SMD0077", "2026.2", "matriculado", 128, "@"));
		assertThat(t.cargas().get("optativa")).isEqualTo(new Trajetoria.Carga(1216, 1152, 64));
		assertThat(t.cargas().get("extensao")).isEqualTo(new Trajetoria.Carga(0, 16, 0));
		assertThat(t.obrigatoriosPendentes()).containsExactly("SMDG0001", "SMD0077");
	}

	@Test
	void naoGuardaNadaDoCabecalhoNemDosDocentes() {
		String serializado = LeitorHistorico.ler(HISTORICO).toString();
		assertThat(serializado).doesNotContain("Fulana", "Fictíci", "28/10/2026", "9.3", "96.87");
	}

	@Test
	void recusaArquivoQueNaoEHistorico() {
		assertThatThrownBy(() -> LeitorHistorico.ler(linhas("Um PDF qualquer", "sem histórico")))
			.isInstanceOf(LeitorHistorico.HistoricoInvalidoException.class);
	}

}
