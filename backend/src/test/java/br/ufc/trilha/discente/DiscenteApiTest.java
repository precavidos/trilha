package br.ufc.trilha.discente;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import tools.jackson.databind.json.JsonMapper;

@SpringBootTest(properties = { "trilha.llm.gemini.api-key=", "spring.config.import=" })
@AutoConfigureMockMvc
class DiscenteApiTest {

	private static final Path HISTORICO_REAL = Path.of("../data/private/historicos/real-1.historico.pdf");

	@Autowired
	MockMvc mvc;

	@Autowired
	JsonMapper json;

	/** Discente sintético que concluiu os obrigatórios dos três primeiros semestres da estrutura. */
	private String pedido(String estrutura, String turno, List<String> profissoes) throws Exception {
		var arquivo = "../data/seed/estruturas/smd-" + turno + "-" + estrutura.replace('.', '-') + ".json";
		var e = json.readValue(Path.of(arquivo).toFile(), EstruturaCurricular.class);
		var cursados = e.componentes().stream()
			.filter(c -> "obrigatorio".equals(c.natureza()) && c.semestre() != null && c.semestre() <= 3)
			.map(c -> new Trajetoria.Cursado(c.codigo(), estrutura, "aprovado", c.ch(), null))
			.toList();
		var t = new Trajetoria(estrutura, turno, cursados, Map.of("optativa", new Trajetoria.Carga(1216, 0, 1216),
				"extensao", new Trajetoria.Carga(288, 64, 224)), List.of());
		return json.writeValueAsString(Map.of("trajetoria", t, "profissoes", profissoes));
	}

	private String pedido2025(List<String> profissoes) throws Exception {
		return pedido("2025.1", "diurno", profissoes);
	}

	@Test
	void listaEstruturasSuportadas() throws Exception {
		mvc.perform(get("/api/discente/estruturas"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasItem("2013.2 diurno")))
			.andExpect(jsonPath("$", hasItem("2013.2 noturno")))
			.andExpect(jsonPath("$", hasItem("2025.1 diurno")));
	}

	@Test
	void recomendaOptativosElegiveisComEvidencias() throws Exception {
		mvc.perform(post("/api/discente/recomendacao").contentType(MediaType.APPLICATION_JSON)
				.content(pedido2025(List.of("ux-ui"))))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.estrutura", is("2025.1")))
			.andExpect(jsonPath("$.componentesSugeridos", is(19)))
			.andExpect(jsonPath("$.itens.length()", greaterThan(4)))
			.andExpect(jsonPath("$.itens[*].pontuacao", everyItem(greaterThan(0.0))))
			// nenhum obrigatório e nenhum componente já cursado
			.andExpect(jsonPath("$.itens[*].codigo", not(hasItem("SMD0015"))))
			.andExpect(jsonPath("$.itens[*].codigo", not(hasItem("SMD0140"))));
	}

	/**
	 * Mesmo código de versão, pré-requisitos diferentes: no Diurno 2013.2, Técnicas de Animação 3D I
	 * (SMD0128) exige SMD0049; no Noturno 2013.2, não.
	 */
	@Test
	void usaAEstruturaDoTurnoDoDiscente() throws Exception {
		mvc.perform(post("/api/discente/recomendacao").contentType(MediaType.APPLICATION_JSON)
				.content(pedido("2013.2", "noturno", List.of("animacao"))))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.turno", is("noturno")))
			.andExpect(jsonPath("$.itens[*].codigo", hasItem("SMD0128")));
		mvc.perform(post("/api/discente/recomendacao").contentType(MediaType.APPLICATION_JSON)
				.content(pedido("2013.2", "diurno", List.of("animacao"))))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.turno", is("diurno")))
			.andExpect(jsonPath("$.itens[*].codigo", not(hasItem("SMD0128"))));
	}

	@Test
	void recusaTresProfissoes() throws Exception {
		mvc.perform(post("/api/discente/recomendacao").contentType(MediaType.APPLICATION_JSON)
				.content(pedido2025(List.of("ux-ui", "web", "jogos"))))
			.andExpect(status().isUnprocessableContent());
	}

	@Test
	void recusaArquivoQueNaoEPdf() throws Exception {
		mvc.perform(multipart("/api/discente/historico")
				.file(new MockMultipartFile("arquivo", "x.pdf", "application/pdf", "não é um pdf".getBytes())))
			.andExpect(status().isUnprocessableContent());
	}

	static boolean historicoRealDisponivel() {
		return Files.exists(HISTORICO_REAL);
	}

	/** Só roda na máquina da equipe: o histórico real fica em data/private, fora do git (ADR 0003). */
	@Test
	@EnabledIf("historicoRealDisponivel")
	void leHistoricoRealSemDadosPessoais() throws Exception {
		mvc.perform(multipart("/api/discente/historico")
				.file(new MockMultipartFile("arquivo", "historico.pdf", "application/pdf", Files.readAllBytes(HISTORICO_REAL))))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.estrutura", is("2013.2")))
			.andExpect(jsonPath("$.turno", is("diurno")))
			.andExpect(jsonPath("$.componentes.length()", greaterThan(30)))
			.andExpect(jsonPath("$.componentes[*].ch", everyItem(greaterThan(0))))
			.andExpect(jsonPath("$.cargas.optativa.exigido", is(1216)));
	}

}
