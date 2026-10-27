package br.ufc.trilha;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

/** Sobe a aplicação com a análise versionada em data/analise, sem chave de LLM (como no CI). */
@SpringBootTest(properties = { "trilha.llm.gemini.api-key=", "spring.config.import=" })
@AutoConfigureMockMvc
class TrilhaBackendApplicationTests {

	@Autowired
	MockMvc mvc;

	@Test
	void resumoTrazSeisProfissoes() throws Exception {
		mvc.perform(get("/api/resumo"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.profissoes.length()", is(6)))
			.andExpect(jsonPath("$.componentesComEmenta", greaterThan(50)));
	}

	@Test
	void lentesDeIaListaAExtensao() throws Exception {
		mvc.perform(get("/api/lente-ia"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()", is(15)))
			.andExpect(jsonPath("$[*].fonte", everyItem(is("Extensão IA"))));
	}

	@Test
	void lacunasDeProfissaoTrazemEvidencias() throws Exception {
		mvc.perform(get("/api/profissoes/ux-ui/lacunas"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].evidencias.length()", is(3)));
	}

	@Test
	void profissaoDesconhecidaDa404() throws Exception {
		mvc.perform(get("/api/profissoes/astronauta/lacunas")).andExpect(status().isNotFound());
	}

	@Test
	void semLlmAJustificativaDegradaParaEvidencias() throws Exception {
		mvc.perform(post("/api/justificativas").param("competencia", "ia-01"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.degradada", is(true)))
			.andExpect(jsonPath("$.texto", not(is(""))));
	}

	@Test
	void justificativaAceitaUriEsco() throws Exception {
		// IDs ESCO são URIs com barras: por isso a competência vai como parâmetro, não no caminho.
		mvc.perform(post("/api/justificativas")
			.param("competencia", "http://data.europa.eu/esco/skill/000f1d3d-220f-4789-9c0a-cc742521fb02"))
			.andExpect(status().isOk());
	}

	@Test
	void competenciaDesconhecidaDa404() throws Exception {
		mvc.perform(post("/api/justificativas").param("competencia", "nao-existe")).andExpect(status().isNotFound());
	}

}
