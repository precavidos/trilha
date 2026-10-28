package br.ufc.trilha.analise;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Procura o nome de uma tecnologia nos textos dos componentes. Uma citação na ementa, nos objetivos, nas
 * competências ou no conteúdo é forte; na bibliografia básica, fraca (livro indicado não é conteúdo
 * ensinado); a bibliografia complementar não conta. O termo precisa aparecer como palavra inteira: "Java"
 * não casa com "JavaScript", e "APL" não casa com "aplicado".
 */
final class Citacoes {

	static final String FORTE = "forte";
	static final String FRACA = "fraca";
	static final String NENHUMA = "nenhuma";

	/** Um campo de texto de um componente, já com o nível de evidência que ele dá. */
	record Texto(String codigo, String onde, String nivel, String texto) {
	}

	private final List<Pattern> padroes = new ArrayList<>();
	private final List<String> termos = new ArrayList<>();

	/** {@code semCaixa} casa ignorando maiúsculas; {@code exatos} exige a grafia exata (siglas, nomes ambíguos). */
	Citacoes(List<String> semCaixa, List<String> exatos) {
		semCaixa.forEach(t -> adicionar(t, Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE));
		exatos.forEach(t -> adicionar(t, 0));
	}

	private void adicionar(String termo, int flags) {
		padroes.add(Pattern.compile("(?<![\\p{L}\\p{N}_])" + Pattern.quote(termo) + "(?![\\p{L}\\p{N}_#+])", flags));
		termos.add(termo);
	}

	/** O primeiro termo que aparece no texto, ou {@code null}. */
	String encontrar(String texto) {
		if (texto == null) {
			return null;
		}
		for (int i = 0; i < padroes.size(); i++) {
			if (padroes.get(i).matcher(texto).find()) {
				return termos.get(i);
			}
		}
		return null;
	}

	/** Uma citação por componente, a mais forte; fortes primeiro e, dentro do nível, pela similaridade. */
	Analise.Citacao procurar(List<Texto> textos, Map<String, Double> similaridade) {
		Map<String, Analise.Citado> porComponente = new LinkedHashMap<>();
		for (Texto t : textos) {
			String termo = encontrar(t.texto());
			if (termo == null) {
				continue;
			}
			var atual = porComponente.get(t.codigo());
			if (atual == null || (FRACA.equals(atual.nivel()) && FORTE.equals(t.nivel()))) {
				porComponente.put(t.codigo(), new Analise.Citado(t.codigo(), t.onde(), t.nivel(), termo,
						similaridade.getOrDefault(t.codigo(), 0.0)));
			}
		}
		List<Analise.Citado> citados = porComponente.values().stream()
			.sorted(Comparator.comparing((Analise.Citado c) -> FORTE.equals(c.nivel()) ? 0 : 1)
				.thenComparing(Comparator.comparingDouble(Analise.Citado::similaridade).reversed()))
			.toList();
		String nivel = citados.isEmpty() ? NENHUMA : citados.getFirst().nivel();
		return new Analise.Citacao(nivel, citados);
	}

}
