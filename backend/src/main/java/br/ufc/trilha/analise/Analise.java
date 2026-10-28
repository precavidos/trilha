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

	/**
	 * {@code fonteEmenta}: PPC | programa (ementa ausente no PPC, completada pelo formulário da disciplina).
	 * {@code programa}: código do formulário de disciplina usado como fonte complementar, quando há (o próprio
	 * ou o de um componente equivalente com a mesma ementa).
	 */
	public record Componente(String codigo, String nome, String ementa, Integer paginaEmenta, String fonteEmenta,
			String programa) {
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
	 * {@code citacao}: só para tecnologias nomeadas (linguagens, frameworks, programas); nas demais, {@code null}.
	 */
	public record Competencia(String id, String rotulo, String tipo, String descricao, String fonte,
			List<Proximo> proximos, double media, double desvio, Citacao citacao) {
	}

	/**
	 * Onde o nome de uma tecnologia aparece no PPC e nos programas de disciplina. {@code nivel}: forte (ementa,
	 * objetivos, competências ou conteúdo) | fraca (só bibliografia básica) | nenhuma.
	 */
	public record Citacao(String nivel, List<Citado> componentes) {
	}

	/** {@code onde}: o campo em que o termo apareceu, ex.: "objetivos do programa". */
	public record Citado(String codigo, String onde, String nivel, String termo, double similaridade) {
	}

	public record Proximo(String codigo, double similaridade) {
	}

	public record IdadeBibliografia(String codigo, String nome, int referencias, int comAno, Integer mediana,
			Integer maisAntiga, Integer maisRecente, double fracaoComMaisDe10Anos) {
	}

}
