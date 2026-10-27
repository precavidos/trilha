package br.ufc.trilha.analise;

import java.util.List;
import java.util.Map;

/**
 * Resultado pré-calculado da análise do PPC (ADR 0010): similaridades entre cada competência do
 * vocabulário e cada componente com ementa, e os indicadores de idade da bibliografia.
 * A classificação em coberta/parcial/lacuna é feita em tempo de consulta, com limiares configuráveis.
 */
public record Analise(Metadados metadados, List<Componente> componentes, List<Profissao> profissoes,
		Map<String, Competencia> competencias, List<String> lenteIa, List<IdadeBibliografia> bibliografia) {

	public record Metadados(String documento, String vocabulario, String modeloDeEmbeddings, String geradoEm,
			int anoDeReferencia) {
	}

	public record Componente(String codigo, String nome, String ementa, Integer paginaEmenta) {
	}

	public record Profissao(String id, String rotulo, String tituloEsco, String uriEsco, List<String> itinerarios,
			List<Exigencia> competencias) {
	}

	/** {@code relacao}: essencial | opcional | transversal-ia. */
	public record Exigencia(String competencia, String relacao) {
	}

	/**
	 * {@code fonte}: ESCO | Extensão IA. {@code proximos}: componentes mais similares, em ordem decrescente.
	 * {@code media} e {@code desvio}: da similaridade com todos os componentes, para o escore relativo.
	 */
	public record Competencia(String id, String rotulo, String tipo, String descricao, String fonte,
			List<Proximo> proximos, double media, double desvio) {
	}

	public record Proximo(String codigo, double similaridade) {
	}

	public record IdadeBibliografia(String codigo, String nome, int referencias, int comAno, Integer mediana,
			Integer maisAntiga, Integer maisRecente, double fracaoComMaisDe10Anos) {
	}

}
