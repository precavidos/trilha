package br.ufc.trilha.analise;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.model.embedding.onnx.OnnxEmbeddingModel;
import dev.langchain4j.model.embedding.onnx.PoolingMode;
import dev.langchain4j.store.embedding.CosineSimilarity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.SerializationFeature;
import tools.jackson.databind.json.JsonMapper;

/**
 * Gera {@code data/analise/analise-smd-2024-2.json} a partir do seed do PPC, do snapshot da ESCO e da
 * Extensão IA, com embeddings multilíngues calculados localmente (ADR 0005, ADR 0010).
 *
 * <pre>./mvnw -q compile exec:java -Dexec.mainClass=br.ufc.trilha.analise.GerarAnalise</pre>
 */
public final class GerarAnalise {

	static final String MODELO = "intfloat/multilingual-e5-small (ONNX quantizado, Xenova)";
	private static final int PROXIMOS = 5;

	private GerarAnalise() {
	}

	public static void main(String[] args) throws Exception {
		Path dados = Path.of(args.length > 0 ? args[0] : "../data");
		Path modelos = Path.of(args.length > 1 ? args[1] : "../models/multilingual-e5-small");
		var json = JsonMapper.builder().enable(SerializationFeature.INDENT_OUTPUT).build();

		JsonNode seed = json.readTree(dados.resolve("seed/ppc-smd-diurno-2024-2.json").toFile());
		JsonNode esco = json.readTree(dados.resolve("esco/snapshot-esco-v1.2.1.json").toFile());
		JsonNode extensao = json.readTree(dados.resolve("esco/extensao-ia.json").toFile());
		int anoDeReferencia = LocalDate.now().getYear();

		List<Analise.Componente> componentes = new ArrayList<>();
		List<Analise.IdadeBibliografia> bibliografia = new ArrayList<>();
		for (JsonNode c : seed.get("componentes")) {
			String ementa = c.path("ementa").isNull() ? null : c.path("ementa").asString(null);
			componentes.add(new Analise.Componente(c.get("codigo").asString(), c.get("nome").asString(), ementa,
					c.path("paginaEmenta").isNull() ? null : c.path("paginaEmenta").asInt()));
			List<Integer> anos = new ArrayList<>();
			int referencias = 0;
			for (String campo : List.of("bibliografiaBasica", "bibliografiaComplementar")) {
				for (JsonNode r : c.get(campo)) {
					referencias++;
					if (!r.path("ano").isNull()) {
						anos.add(r.get("ano").asInt());
					}
				}
			}
			if (referencias > 0) {
				bibliografia.add(idade(c.get("codigo").asString(), c.get("nome").asString(), referencias, anos,
						anoDeReferencia));
			}
		}

		Map<String, String> textoDaCompetencia = new LinkedHashMap<>();
		Map<String, Analise.Competencia> competencias = new LinkedHashMap<>();
		esco.get("competencias").properties().forEach(e -> {
			JsonNode s = e.getValue();
			competencias.put(e.getKey(), new Analise.Competencia(e.getKey(), s.get("tituloPt").asString(),
					s.get("tipo").asString(), s.path("descricaoPt").asString(""), "ESCO", List.of(), 0, 0));
			textoDaCompetencia.put(e.getKey(), s.get("tituloPt").asString() + ". " + s.path("descricaoPt").asString(""));
		});
		List<String> lenteIa = new ArrayList<>();
		for (JsonNode c : extensao.get("competencias")) {
			String id = c.get("id").asString();
			lenteIa.add(id);
			competencias.put(id, new Analise.Competencia(id, c.get("rotulo").asString(), "habilidade",
					c.get("descricao").asString(), "Extensão IA", List.of(), 0, 0));
			textoDaCompetencia.put(id, c.get("rotulo").asString() + ". " + c.get("descricao").asString());
		}

		List<Analise.Profissao> profissoes = new ArrayList<>();
		for (JsonNode p : esco.get("profissoes")) {
			List<Analise.Exigencia> exigencias = new ArrayList<>();
			for (JsonNode r : p.get("competencias")) {
				exigencias.add(new Analise.Exigencia(r.get("uri").asString(), r.get("relacao").asString()));
			}
			for (JsonNode c : extensao.get("competencias")) {
				for (JsonNode prof : c.get("profissoes")) {
					if (prof.asString().equals(p.get("id").asString())) {
						exigencias.add(new Analise.Exigencia(c.get("id").asString(), "transversal-ia"));
					}
				}
			}
			List<String> itinerarios = new ArrayList<>();
			p.get("itinerarios").forEach(i -> itinerarios.add(i.asString()));
			profissoes.add(new Analise.Profissao(p.get("id").asString(), p.get("rotulo").asString(),
					p.get("tituloPt").asString(), p.get("uri").asString(), itinerarios, exigencias));
		}

		var modelo = new OnnxEmbeddingModel(modelos.resolve("model_quantized.onnx").toString(),
				modelos.resolve("tokenizer.json").toString(), PoolingMode.MEAN);
		// e5: "passage:" para o conteúdo indexado, "query:" para a consulta.
		Map<String, Embedding> porComponente = new LinkedHashMap<>();
		for (var c : componentes) {
			if (c.ementa() != null) {
				porComponente.put(c.codigo(), modelo.embed("passage: " + c.nome() + ". " + c.ementa()).content());
			}
		}
		System.err.printf("%d componentes com ementa embutidos%n", porComponente.size());

		int n = 0;
		for (var e : textoDaCompetencia.entrySet()) {
			Embedding q = modelo.embed("query: " + e.getValue()).content();
			List<Analise.Proximo> todos = porComponente.entrySet().stream()
				.map(c -> new Analise.Proximo(c.getKey(), CosineSimilarity.between(q, c.getValue())))
				.sorted(Comparator.comparingDouble(Analise.Proximo::similaridade).reversed())
				.toList();
			double media = todos.stream().mapToDouble(Analise.Proximo::similaridade).average().orElse(0);
			double desvio = Math.sqrt(todos.stream()
				.mapToDouble(p -> Math.pow(p.similaridade() - media, 2)).average().orElse(0));
			List<Analise.Proximo> proximos = todos.stream().limit(PROXIMOS)
				.map(p -> new Analise.Proximo(p.codigo(), arredondar(p.similaridade())))
				.toList();
			var antiga = competencias.get(e.getKey());
			competencias.put(e.getKey(), new Analise.Competencia(antiga.id(), antiga.rotulo(), antiga.tipo(),
					antiga.descricao(), antiga.fonte(), proximos, arredondar(media), arredondar(desvio)));
			if (++n % 50 == 0) {
				System.err.printf("  %d/%d competências%n", n, textoDaCompetencia.size());
			}
		}

		var analise = new Analise(
				new Analise.Metadados(seed.get("documento").asString(),
						"ESCO " + esco.get("versao").asString() + " + Extensão IA (" + extensao.get("status").asString() + ")",
						MODELO, LocalDate.now().toString(), anoDeReferencia),
				componentes, profissoes, competencias, lenteIa, bibliografia);
		Path saida = dados.resolve("analise/analise-smd-2024-2.json");
		Files.createDirectories(saida.getParent());
		json.writeValue(saida.toFile(), analise);
		System.err.printf("%d competências · %d profissões · %d componentes com bibliografia → %s%n",
				competencias.size(), profissoes.size(), bibliografia.size(), saida);
	}

	static Analise.IdadeBibliografia idade(String codigo, String nome, int referencias, List<Integer> anos,
			int anoDeReferencia) {
		List<Integer> ordenados = anos.stream().filter(Objects::nonNull).sorted().toList();
		Integer mediana = ordenados.isEmpty() ? null : ordenados.get((ordenados.size() - 1) / 2);
		long antigas = ordenados.stream().filter(a -> anoDeReferencia - a > 10).count();
		return new Analise.IdadeBibliografia(codigo, nome, referencias, ordenados.size(), mediana,
				ordenados.isEmpty() ? null : ordenados.getFirst(), ordenados.isEmpty() ? null : ordenados.getLast(),
				ordenados.isEmpty() ? 0 : arredondar((double) antigas / ordenados.size()));
	}

	private static double arredondar(double v) {
		return Math.round(v * 10000) / 10000.0;
	}

}
