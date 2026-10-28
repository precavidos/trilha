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
		return pedido(estrutura, turno, profissoes, List.of());
	}

	/** Como {@link #pedido(String, String, List)}, com componentes aprovados a mais (ex.: um pré-requisito). */
	private String pedido(String estrutura, String turno, List<String> profissoes, List<String> aprovadosExtras)
			throws Exception {
		var arquivo = "../data/seed/estruturas/smd-" + turno + "-" + estrutura.replace('.', '-').toLowerCase() + ".json";
		var e = json.readValue(Path.of(arquivo).toFile(), EstruturaCurricular.class);
		var cursados = e.componentes().stream()
			.filter(c -> "obrigatorio".equals(c.natureza()) && c.semestre() != null && c.semestre() <= 3)
			.map(c -> new Trajetoria.Cursado(c.codigo(), estrutura, "aprovado", c.ch(), null))
			.collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));
		aprovadosExtras.forEach(k -> cursados.add(new Trajetoria.Cursado(k, estrutura, "aprovado", 64, null)));
		var t = new Trajetoria(estrutura, turno, cursados, Map.of("optativa", new Trajetoria.Carga(1216, 0, 1216),
				"extensao", new Trajetoria.Carga(288, 64, 224)), List.of());
		return json.writeValueAsString(Map.of("trajetoria", t, "profissoes", profissoes));
	}

	private String pedido2025(List<String> profissoes) throws Exception {
		return pedido("2025.1", "diurno", profissoes);
	}

	private static final Path HISTORICO_EXEMPLO = Path.of("../data/seed/historico-exemplo.json");

	/**
	 * Ordem [codigo, pontuacao] das sugestões do histórico de exemplo para ux-ui e web, como o recomendador do
	 * PR #14 a produz. Protege o "só exibição" da spec: a tela nova não pode mudar o que é sugerido.
	 */
	private static final List<List<Object>> ORDEM_DO_PR_14 = List.of(List.of("SMD0052", 6.6),
			List.of("SMD0048", 4.4), List.of("SMD0145", 3.0), List.of("SMD0146", 3.0), List.of("SMD0057", 2.9),
			List.of("SMD0119", 2.78), List.of("SMD0122", 2.68));

	@Test
	void historicoDeExemploExisteNaEstrutura() throws Exception {
		var estrutura = json.readValue(Path.of("../data/seed/estruturas/smd-diurno-2025-1.json").toFile(),
				EstruturaCurricular.class);
		var codigos = estrutura.componentes().stream().map(EstruturaCurricular.Componente::codigo).toList();
		var t = json.readValue(HISTORICO_EXEMPLO.toFile(), Trajetoria.class);
		org.junit.jupiter.api.Assertions.assertTrue(t.componentes().stream().allMatch(c -> codigos.contains(c.codigo())));
		org.junit.jupiter.api.Assertions.assertEquals(31, t.componentes().stream().filter(c -> "aprovado".equals(c.situacao())).count());
		org.junit.jupiter.api.Assertions.assertEquals(4, t.componentes().stream().filter(c -> "matriculado".equals(c.situacao())).count());
	}

	@Test
	void serveOHistoricoDeExemplo() throws Exception {
		mvc.perform(get("/api/discente/historico-exemplo"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.estrutura", is("2025.1")))
			.andExpect(jsonPath("$.cargas.extensao.pendente", is(128)));
	}

	@Test
	void recomendacaoDoExemploNaoMuda() throws Exception {
		var t = json.readValue(HISTORICO_EXEMPLO.toFile(), Trajetoria.class);
		var corpo = json.writeValueAsString(Map.of("trajetoria", t, "profissoes", List.of("ux-ui", "web")));
		var resposta = mvc.perform(post("/api/discente/recomendacao").contentType(MediaType.APPLICATION_JSON).content(corpo))
			.andExpect(status().isOk())
			.andReturn().getResponse().getContentAsString();
		var itens = json.readTree(resposta).get("itens");
		var obtido = new java.util.ArrayList<List<Object>>();
		itens.forEach(i -> obtido.add(List.of(i.get("codigo").asString(), i.get("pontuacao").asDouble())));
		org.junit.jupiter.api.Assertions.assertEquals(ORDEM_DO_PR_14, obtido);
	}

	private tools.jackson.databind.JsonNode recomendacaoDoExemplo(List<String> profissoes) throws Exception {
		var t = json.readValue(HISTORICO_EXEMPLO.toFile(), Trajetoria.class);
		var corpo = json.writeValueAsString(Map.of("trajetoria", t, "profissoes", profissoes));
		var resposta = mvc.perform(post("/api/discente/recomendacao").contentType(MediaType.APPLICATION_JSON).content(corpo))
			.andExpect(status().isOk())
			.andReturn().getResponse().getContentAsString();
		return json.readTree(resposta);
	}

	@Test
	void evidenciasIncluemLacunasEContagemBate() throws Exception {
		var itens = recomendacaoDoExemplo(List.of("ux-ui", "web")).get("itens");
		boolean temLacuna = false;
		for (var item : itens) {
			var evidencias = item.get("evidencias");
			var contagem = item.get("contagem");
			int soma = 0;
			for (var n : contagem.get("porProfissao").values()) {
				soma += n.asInt();
			}
			int naoCobertas = 0;
			for (var ev : evidencias) {
				String situacao = ev.get("situacaoNoPpc").asString();
				temLacuna |= "LACUNA".equals(situacao);
				if (!"COBERTA".equals(situacao)) {
					naoCobertas++;
				}
			}
			org.junit.jupiter.api.Assertions.assertEquals(evidencias.size(), contagem.get("total").asInt());
			org.junit.jupiter.api.Assertions.assertEquals(contagem.get("total").asInt(), soma);
			org.junit.jupiter.api.Assertions.assertEquals(naoCobertas, contagem.get("naoCobertas").asInt());
		}
		org.junit.jupiter.api.Assertions.assertTrue(temLacuna, "algum item deveria trazer uma evidência em LACUNA");
	}

	@Test
	void competenciaDasDuasProfissoesApareceUmaVez() throws Exception {
		for (var item : recomendacaoDoExemplo(List.of("ux-ui", "web")).get("itens")) {
			var vistas = new java.util.HashSet<String>();
			for (var ev : item.get("evidencias")) {
				org.junit.jupiter.api.Assertions.assertTrue(vistas.add(ev.get("competencia").asString()),
						"competência repetida em " + item.get("codigo").asString());
			}
		}
	}

	@Test
	void evidenciasOrdenadasPorPosicao() throws Exception {
		for (var item : recomendacaoDoExemplo(List.of("ux-ui", "web")).get("itens")) {
			int posAnterior = -1;
			double simAnterior = Double.MAX_VALUE;
			for (var ev : item.get("evidencias")) {
				int pos = ev.get("posicao").asInt();
				double sim = ev.get("similaridade").asDouble();
				org.junit.jupiter.api.Assertions.assertTrue(pos >= posAnterior);
				if (pos == posAnterior) {
					org.junit.jupiter.api.Assertions.assertTrue(sim <= simAnterior);
				}
				posAnterior = pos;
				simAnterior = sim;
			}
		}
	}

	@Test
	void notaDaEmentaCurtaChegaAoItem() throws Exception {
		// 2013.2 diurno: a SMD0057 exige a SMD0098, que o pedido sintético (obrigatórios até o 3º semestre) não cobre.
		var corpo = pedido("2013.2", "diurno", List.of("animacao"), List.of("SMD0098"));
		var resposta = json.readTree(mvc.perform(post("/api/discente/recomendacao").contentType(MediaType.APPLICATION_JSON)
				.content(corpo))
			.andExpect(status().isOk())
			.andReturn().getResponse().getContentAsString());
		boolean achou = false;
		for (var item : resposta.get("itens")) {
			boolean nota = item.hasNonNull("notaEmenta");
			if ("SMD0057".equals(item.get("codigo").asString())) {
				achou = true;
				org.junit.jupiter.api.Assertions.assertTrue(item.get("notaEmenta").asString().contains("4 de 7"));
			}
			else {
				org.junit.jupiter.api.Assertions.assertFalse(nota, "só a SMD0057 tem ressalva: " + item.get("codigo"));
			}
		}
		org.junit.jupiter.api.Assertions.assertTrue(achou, "a SMD0057 deveria estar entre as sugestões");
	}

	@Test
	void foraDasSugestoesNaoRepeteEvidencias() throws Exception {
		var resposta = recomendacaoDoExemplo(List.of("ux-ui", "web"));
		var rotulosEmEvidencia = new java.util.HashSet<String>();
		resposta.get("itens").forEach(i -> i.get("evidencias").forEach(ev -> rotulosEmEvidencia.add(ev.get("rotulo").asString())));
		var fora = resposta.get("foraDasSugestoes");
		fora.get("lacunasEssenciais").forEach(l ->
				org.junit.jupiter.api.Assertions.assertFalse(rotulosEmEvidencia.contains(l.get("rotulo").asString()), l.toString()));
		org.junit.jupiter.api.Assertions.assertTrue(fora.get("naoDocumentadas").size() > 0);
	}

	@Test
	void listaEstruturasSuportadas() throws Exception {
		mvc.perform(get("/api/discente/estruturas"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasItem("2013.2 diurno")))
			.andExpect(jsonPath("$", hasItem("2013.2 noturno")))
			.andExpect(jsonPath("$", hasItem("2016.1 noturno")))
			.andExpect(jsonPath("$", hasItem("2016.1A noturno")))
			.andExpect(jsonPath("$", hasItem("2025.1 noturno")))
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

	/** A matriz Noturno em vigor desde 2018.2 tem letra no código. */
	@Test
	void recomendaNaMatrizNoturno2016_1A() throws Exception {
		mvc.perform(post("/api/discente/recomendacao").contentType(MediaType.APPLICATION_JSON)
				.content(pedido("2016.1A", "noturno", List.of("jogos"))))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.estrutura", is("2016.1A")))
			.andExpect(jsonPath("$.turno", is("noturno")))
			.andExpect(jsonPath("$.itens.length()", greaterThan(4)))
			.andExpect(jsonPath("$.itens[*].codigo", hasItem("SMD0053")));
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
