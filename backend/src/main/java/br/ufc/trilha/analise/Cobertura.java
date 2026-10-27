package br.ufc.trilha.analise;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Classifica a cobertura de uma competência pelo PPC a partir da similaridade e do escore relativo. */
@ConfigurationProperties("trilha.limiares")
public record Cobertura(double cobertaSimilaridade, double cobertaEscore, double parcialSimilaridade,
		double parcialEscore) {

	public enum Status {
		COBERTA, PARCIAL, LACUNA
	}

	public Status classificar(Analise.Competencia c) {
		if (c.proximos().isEmpty()) {
			return Status.LACUNA;
		}
		double sim = c.proximos().getFirst().similaridade();
		double escore = escore(c);
		if (sim >= cobertaSimilaridade || escore >= cobertaEscore) {
			return Status.COBERTA;
		}
		if (sim >= parcialSimilaridade || escore >= parcialEscore) {
			return Status.PARCIAL;
		}
		return Status.LACUNA;
	}

	public static double escore(Analise.Competencia c) {
		if (c.proximos().isEmpty() || c.desvio() == 0) {
			return 0;
		}
		return (c.proximos().getFirst().similaridade() - c.media()) / c.desvio();
	}

}
