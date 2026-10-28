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
 * Extensão IA, com embeddings multilíngues calculados localmente (ADR 0005, ADR 0010). Os programas de
 * disciplina completam as ementas ausentes no PPC e, junto com ele, são onde se procuram as tecnologias
 * nomeadas; o texto embutido de cada componente continua sendo nome + ementa.
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
		Map<String, JsonNode> programas = new LinkedHashMap<>();
		json.readTree(dados.resolve("seed/programas-smd.json").toFile()).get("programas")
			.forEach(p -> programas.put(p.get("codigo").asString(), p));
		Map<String, JsonNode> estrutura = new LinkedHashMap<>();
		json.readTree(dados.resolve("seed/estruturas/smd-diurno-2025-1.json").toFile()).get("componentes")
			.forEach(c -> estrutura.put(c.get("codigo").asString(), c));
		Map<String, Citacoes> tecnologias = new LinkedHashMap<>();
		for (JsonNode t : json.readTree(dados.resolve("seed/tecnologias-nomeadas.json").toFile()).get("tecnologias")) {
			tecnologias.put(t.get("competencia").asString(),
					new Citacoes(textos(t.get("termos")), textos(t.get("termosExatos"))));
		}

		List<Analise.Componente> componentes = new ArrayList<>();
		List<Analise.IdadeBibliografia> bibliografia = new ArrayList<>();
		List<Citacoes.Texto> textosDosComponentes = new ArrayList<>();
		Map<String, String> complementoDoTexto = new LinkedHashMap<>();
		int completadas = 0;
		int comPrograma = 0;
		for (JsonNode c : seed.get("componentes")) {
			String codigo = c.get("codigo").asString();
			String ementa = c.path("ementa").isNull() ? null : c.path("ementa").asString(null);
			JsonNode programa = programa(codigo, ementa, programas, estrutura);
			String fonteEmenta = ementa == null ? null : "PPC";
			if (ementa == null && programa != null && programa.get("codigo").asString().equals(codigo)
					&& !programa.path("ementa").isNull()) {
				ementa = programa.get("ementa").asString();
				fonteEmenta = "programa";
				completadas++;
				// Algumas ementas dos programas são telegráficas ("Concept art. Design de personagens.") e, sozinhas,
				// viram vizinhas de quase tudo; objetivos e competências do mesmo formulário dão o contexto.
				String complemento = String.join(" ", programa.path("objetivos").asString(""),
						programa.path("competencias").asString("")).strip();
				if (!complemento.isEmpty()) {
					complementoDoTexto.put(codigo, complemento);
				}
			}
			comPrograma += programa == null ? 0 : 1;
			componentes.add(new Analise.Componente(codigo, c.get("nome").asString(), ementa,
					c.path("paginaEmenta").isNull() ? null : c.path("paginaEmenta").asInt(), fonteEmenta,
					programa == null ? null : programa.get("codigo").asString()));
			textosDosComponentes.addAll(textos(codigo, ementa, fonteEmenta, c, programa));
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
					s.get("tipo").asString(), s.path("descricaoPt").asString(""), "ESCO", List.of(), 0, 0, null));
			textoDaCompetencia.put(e.getKey(), s.get("tituloPt").asString() + ". " + s.path("descricaoPt").asString(""));
		});
		List<String> lenteIa = new ArrayList<>();
		for (JsonNode c : extensao.get("competencias")) {
			String id = c.get("id").asString();
			lenteIa.add(id);
			competencias.put(id, new Analise.Competencia(id, c.get("rotulo").asString(), "habilidade",
					c.get("descricao").asString(), "Extensão IA", List.of(), 0, 0, null));
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
				String complemento = complementoDoTexto.containsKey(c.codigo()) ? " " + complementoDoTexto.get(c.codigo()) : "";
				porComponente.put(c.codigo(), modelo.embed("passage: " + c.nome() + ". " + c.ementa() + complemento).content());
			}
		}
		java.util.Set<String> ementaDoPpc = new java.util.HashSet<>();
		componentes.stream().filter(c -> "PPC".equals(c.fonteEmenta())).forEach(c -> ementaDoPpc.add(c.codigo()));
		System.err.printf("%d componentes com ementa embutidos (%d completadas por programa de disciplina); "
				+ "%d com programa de disciplina como fonte complementar%n", porComponente.size(), completadas, comPrograma);

		int n = 0;
		for (var e : textoDaCompetencia.entrySet()) {
			Embedding q = modelo.embed("query: " + e.getValue()).content();
			List<Analise.Proximo> todos = porComponente.entrySet().stream()
				.map(c -> new Analise.Proximo(c.getKey(), CosineSimilarity.between(q, c.getValue())))
				.sorted(Comparator.comparingDouble(Analise.Proximo::similaridade).reversed())
				.toList();
			// Média e desvio do escore só sobre as ementas do PPC, a população em que os limiares foram calibrados:
			// com as ementas dos programas na conta, o escore mudava de escala e reclassificava competências sem
			// nenhuma evidência nova (mesmo componente mais próximo, mesma similaridade).
			List<Analise.Proximo> referencia = todos.stream().filter(p -> ementaDoPpc.contains(p.codigo())).toList();
			double media = referencia.stream().mapToDouble(Analise.Proximo::similaridade).average().orElse(0);
			double desvio = Math.sqrt(referencia.stream()
				.mapToDouble(p -> Math.pow(p.similaridade() - media, 2)).average().orElse(0));
			List<Analise.Proximo> proximos = todos.stream().limit(PROXIMOS)
				.map(p -> new Analise.Proximo(p.codigo(), arredondar(p.similaridade())))
				.toList();
			Analise.Citacao citacao = null;
			var tecnologia = tecnologias.get(e.getKey());
			if (tecnologia != null) {
				Map<String, Double> similaridade = new LinkedHashMap<>();
				todos.forEach(p -> similaridade.put(p.codigo(), arredondar(p.similaridade())));
				citacao = tecnologia.procurar(textosDosComponentes, similaridade);
			}
			var antiga = competencias.get(e.getKey());
			competencias.put(e.getKey(), new Analise.Competencia(antiga.id(), antiga.rotulo(), antiga.tipo(),
					antiga.descricao(), antiga.fonte(), proximos, arredondar(media), arredondar(desvio), citacao));
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

	/**
	 * O programa de disciplina de um componente do PPC: o do próprio código ou, para os códigos novos da matriz
	 * 2025.1, o de um componente equivalente cuja ementa seja praticamente a mesma (o código novo às vezes é
	 * só renumeração, às vezes é reformulação).
	 */
	static JsonNode programa(String codigo, String ementa, Map<String, JsonNode> programas, Map<String, JsonNode> estrutura) {
		if (programas.containsKey(codigo)) {
			return programas.get(codigo);
		}
		if (ementa == null || !estrutura.containsKey(codigo)) {
			return null;
		}
		for (JsonNode alternativa : estrutura.get(codigo).get("equivalencias")) {
			if (alternativa.size() == 1) {
				JsonNode p = programas.get(alternativa.get(0).asString());
				if (p != null && !p.path("ementa").isNull() && parecidas(ementa, p.get("ementa").asString())) {
					return p;
				}
			}
		}
		return null;
	}

	/** Sobreposição de palavras (Jaccard) de pelo menos 60%. */
	static boolean parecidas(String a, String b) {
		var pa = palavras(a);
		var pb = palavras(b);
		var comuns = new java.util.HashSet<>(pa);
		comuns.retainAll(pb);
		var todas = new java.util.HashSet<>(pa);
		todas.addAll(pb);
		return !todas.isEmpty() && (double) comuns.size() / todas.size() >= 0.6;
	}

	private static java.util.Set<String> palavras(String texto) {
		var s = new java.util.HashSet<String>();
		for (String p : java.text.Normalizer.normalize(texto.toLowerCase(), java.text.Normalizer.Form.NFD)
			.replaceAll("\\p{M}", "").split("[^a-z0-9]+")) {
			if (p.length() >= 3) {
				s.add(p);
			}
		}
		return s;
	}

	/** Os campos de um componente onde se procura o nome de uma tecnologia, com o nível de evidência de cada um. */
	private static List<Citacoes.Texto> textos(String codigo, String ementa, String fonteEmenta, JsonNode ppc,
			JsonNode programa) {
		List<Citacoes.Texto> t = new ArrayList<>();
		if (ementa != null) {
			t.add(new Citacoes.Texto(codigo, "programa".equals(fonteEmenta) ? "ementa do programa" : "ementa do PPC",
					Citacoes.FORTE, ementa));
		}
		for (JsonNode r : ppc.get("bibliografiaBasica")) {
			t.add(new Citacoes.Texto(codigo, "bibliografia básica do PPC", Citacoes.FRACA, r.path("texto").asString("")));
		}
		if (programa != null) {
			String[][] campos = { { "ementa", "ementa do programa", Citacoes.FORTE },
					{ "objetivos", "objetivos do programa", Citacoes.FORTE },
					{ "competencias", "competências do programa", Citacoes.FORTE },
					{ "conteudo", "conteúdo do programa", Citacoes.FORTE },
					{ "bibliografiaBasica", "bibliografia básica do programa", Citacoes.FRACA } };
			for (String[] c : campos) {
				if (!programa.path(c[0]).isNull() && !programa.path(c[0]).isMissingNode()) {
					t.add(new Citacoes.Texto(codigo, c[1], c[2], programa.get(c[0]).asString()));
				}
			}
		}
		return t;
	}

	private static List<String> textos(JsonNode lista) {
		List<String> l = new ArrayList<>();
		if (lista != null) {
			lista.forEach(n -> l.add(n.asString()));
		}
		return l;
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
