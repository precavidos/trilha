package br.ufc.trilha.ppc;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Casa nomes de componentes escritos com pequenas variações (acentos, espaços, plural)
 * com o código do componente no catálogo do PPC.
 */
public final class CasadorDeNomes {

	/** Similaridade mínima para aceitar um casamento aproximado (sempre sinalizado para revisão humana). */
	static final double SIMILARIDADE_MINIMA = 0.85;

	private final Map<String, String> codigoPorNome = new LinkedHashMap<>();

	public CasadorDeNomes(Map<String, String> nomePorCodigo) {
		nomePorCodigo.forEach((codigo, nome) -> codigoPorNome.putIfAbsent(normalizar(nome), codigo));
	}

	public record Casamento(String codigo, boolean exato) {
	}

	public Optional<Casamento> casar(String nome) {
		String alvo = normalizar(nome);
		String exato = codigoPorNome.get(alvo);
		if (exato != null) {
			return Optional.of(new Casamento(exato, true));
		}
		String melhor = null;
		double melhorSimilaridade = 0;
		for (var e : codigoPorNome.entrySet()) {
			double s = similaridade(alvo, e.getKey());
			if (s > melhorSimilaridade) {
				melhorSimilaridade = s;
				melhor = e.getValue();
			}
		}
		return melhorSimilaridade >= SIMILARIDADE_MINIMA ? Optional.of(new Casamento(melhor, false)) : Optional.empty();
	}

	static String normalizar(String s) {
		return Normalizer.normalize(s, Normalizer.Form.NFD)
			.replaceAll("\\p{M}", "")
			.toLowerCase()
			.replaceAll("[^a-z0-9]", "");
	}

	static double similaridade(String a, String b) {
		int maior = Math.max(a.length(), b.length());
		return maior == 0 ? 1 : 1.0 - (double) levenshtein(a, b) / maior;
	}

	private static int levenshtein(String a, String b) {
		int[] anterior = new int[b.length() + 1];
		int[] atual = new int[b.length() + 1];
		for (int j = 0; j <= b.length(); j++) {
			anterior[j] = j;
		}
		for (int i = 1; i <= a.length(); i++) {
			atual[0] = i;
			for (int j = 1; j <= b.length(); j++) {
				int custo = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
				atual[j] = Math.min(Math.min(atual[j - 1] + 1, anterior[j] + 1), anterior[j - 1] + custo);
			}
			int[] t = anterior;
			anterior = atual;
			atual = t;
		}
		return anterior[b.length()];
	}

}
