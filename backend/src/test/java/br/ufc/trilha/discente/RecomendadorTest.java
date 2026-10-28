package br.ufc.trilha.discente;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import br.ufc.trilha.analise.AnaliseService;
import br.ufc.trilha.analise.Cobertura;

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

	private static AnaliseService.Item item(String id, String rotulo, String relacao, Cobertura.Status status) {
		return new AnaliseService.Item(id, rotulo, "competencia", "", "ppc", relacao, status, 0.0, 0.0, "similaridade",
				List.of());
	}

	@Test
	void foraTrazLacunasEssenciaisLongeDasSugestoes() {
		var mapa = new LinkedHashMap<String, List<AnaliseService.Item>>();
		mapa.put("UX/UI", List.of(item("a", "A", "essencial", Cobertura.Status.LACUNA),
				item("b", "B", "essencial", Cobertura.Status.LACUNA), item("c", "C", "opcional", Cobertura.Status.LACUNA),
				item("d", "D", "essencial", Cobertura.Status.COBERTA)));
		var fora = Recomendador.fora(mapa, Set.of("b"));
		assertThat(fora.lacunasEssenciais()).containsExactly(new Recomendador.CompetenciaFora("A", "UX/UI"));
	}

	@Test
	void foraSemSugestoesTrazTodasAsLacunasEssenciais() {
		var mapa = new LinkedHashMap<String, List<AnaliseService.Item>>();
		mapa.put("UX/UI", List.of(item("a", "A", "essencial", Cobertura.Status.LACUNA),
				item("b", "B", "essencial", Cobertura.Status.LACUNA), item("c", "C", "opcional", Cobertura.Status.LACUNA)));
		var fora = Recomendador.fora(mapa, Set.of());
		assertThat(fora.lacunasEssenciais()).extracting(Recomendador.CompetenciaFora::rotulo).containsExactly("A", "B");
	}

	@Test
	void foraOrdenaLacunasPorProfissaoERotulo() {
		var mapa = new LinkedHashMap<String, List<AnaliseService.Item>>();
		mapa.put("Web", List.of(item("z", "Z", "essencial", Cobertura.Status.LACUNA),
				item("y", "Y", "essencial", Cobertura.Status.LACUNA)));
		mapa.put("UX/UI", List.of(item("a", "A", "essencial", Cobertura.Status.LACUNA)));
		var fora = Recomendador.fora(mapa, Set.of());
		assertThat(fora.lacunasEssenciais()).extracting(Recomendador.CompetenciaFora::rotulo).containsExactly("Y", "Z", "A");
	}

	@Test
	void foraTrazNaoDocumentadasSemRepetir() {
		var mapa = new LinkedHashMap<String, List<AnaliseService.Item>>();
		mapa.put("UX/UI", List.of(item("t2", "Figma", "essencial", Cobertura.Status.NAO_DOCUMENTADA),
				item("t1", "Angular", "opcional", Cobertura.Status.NAO_DOCUMENTADA)));
		mapa.put("Web", List.of(item("t2", "Figma", "essencial", Cobertura.Status.NAO_DOCUMENTADA),
				item("t3", "Docker", "essencial", Cobertura.Status.NAO_DOCUMENTADA)));
		var fora = Recomendador.fora(mapa, Set.of());
		assertThat(fora.naoDocumentadas()).containsExactly(new Recomendador.CompetenciaFora("Angular", "UX/UI"),
				new Recomendador.CompetenciaFora("Docker", "Web"), new Recomendador.CompetenciaFora("Figma", "UX/UI"));
	}

	@Test
	void foraOrdenaAlfabeticamenteSemOrdemDeBytes() {
		var mapa = new LinkedHashMap<String, List<AnaliseService.Item>>();
		mapa.put("Web", List.of(item("t1", "ASP.NET", "essencial", Cobertura.Status.NAO_DOCUMENTADA),
				item("t2", "Adobe", "essencial", Cobertura.Status.NAO_DOCUMENTADA),
				item("t3", "Ágil", "essencial", Cobertura.Status.NAO_DOCUMENTADA),
				item("l1", "Ética", "essencial", Cobertura.Status.LACUNA),
				item("l2", "Zoom", "essencial", Cobertura.Status.LACUNA),
				item("l3", "Acessibilidade", "essencial", Cobertura.Status.LACUNA)));
		var fora = Recomendador.fora(mapa, Set.of());
		assertThat(fora.naoDocumentadas()).extracting(Recomendador.CompetenciaFora::rotulo)
			.containsExactly("Adobe", "Ágil", "ASP.NET");
		assertThat(fora.lacunasEssenciais()).extracting(Recomendador.CompetenciaFora::rotulo)
			.containsExactly("Acessibilidade", "Ética", "Zoom");
	}

}
