package br.ufc.trilha.analise;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

class CitacoesTest {

	private static final Citacoes JAVA = new Citacoes(List.of(), List.of("Java"));
	private static final Citacoes C_SHARP = new Citacoes(List.of("C#"), List.of());
	private static final Citacoes APL = new Citacoes(List.of(), List.of("APL"));
	private static final Citacoes PYTHON = new Citacoes(List.of("Python"), List.of());

	@Test
	void exigePalavraInteira() {
		assertThat(JAVA.encontrar("Programação Java para a Web")).isEqualTo("Java");
		assertThat(JAVA.encontrar("DOM Scripting: Web Design with JavaScript")).isNull();
		assertThat(APL.encontrar("Teste de Software Aplicado")).isNull();
		assertThat(C_SHARP.encontrar("DEITEL. C# Como Programar.")).isEqualTo("C#");
		assertThat(C_SHARP.encontrar("Linguagem C e C++")).isNull();
	}

	@Test
	void termosSemCaixaETermosExatos() {
		assertThat(PYTHON.encontrar("utilizando a linguagem python")).isEqualTo("Python");
		assertThat(JAVA.encontrar("JAVA")).isNull();
	}

	@Test
	void citacaoNaEmentaOuNosObjetivosVenceABibliografia() {
		var textos = List.of(
				new Citacoes.Texto("SMD0045", "bibliografia básica do PPC", Citacoes.FRACA, "Jython: Python for the Java Platform"),
				new Citacoes.Texto("SMD0095", "bibliografia básica do PPC", Citacoes.FRACA, "Python fluente"),
				new Citacoes.Texto("SMD0045", "objetivos do programa", Citacoes.FORTE, "utilizando a linguagem Python"));
		var c = PYTHON.procurar(textos, Map.of("SMD0045", 0.86, "SMD0095", 0.88));

		assertThat(c.nivel()).isEqualTo(Citacoes.FORTE);
		assertThat(c.componentes()).extracting(Analise.Citado::codigo).containsExactly("SMD0045", "SMD0095");
		assertThat(c.componentes().getFirst().onde()).isEqualTo("objetivos do programa");
	}

	@Test
	void classificaPelaCitacaoENaoPelaSimilaridade() {
		var cobertura = new Cobertura(0.89, 2.8, 0.88, 2.4);
		var muitoParecida = List.of(new Analise.Proximo("SMD0048", 0.95));
		var semCitacao = new Analise.Competencia("c", "C#", "conhecimento", "", "ESCO", muitoParecida, 0.8, 0.02,
				new Analise.Citacao(Citacoes.NENHUMA, List.of()));
		var soBibliografia = new Analise.Competencia("c", "C#", "conhecimento", "", "ESCO", muitoParecida, 0.8, 0.02,
				new Analise.Citacao(Citacoes.FRACA, List.of(new Analise.Citado("SMD0137", "bibliografia básica do PPC",
						Citacoes.FRACA, "C#", 0.85))));
		var naoTecnologia = new Analise.Competencia("c", "programação", "conhecimento", "", "ESCO", muitoParecida, 0.8,
				0.02, null);

		assertThat(cobertura.classificar(semCitacao)).isEqualTo(Cobertura.Status.NAO_DOCUMENTADA);
		assertThat(cobertura.classificar(soBibliografia)).isEqualTo(Cobertura.Status.PARCIAL);
		assertThat(cobertura.classificar(naoTecnologia)).isEqualTo(Cobertura.Status.COBERTA);
	}

}
