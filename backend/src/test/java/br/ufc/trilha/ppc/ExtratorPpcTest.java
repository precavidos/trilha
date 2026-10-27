package br.ufc.trilha.ppc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.entry;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

/** Fixtures reproduzem o layout real do PPC do SMD 2024.2 (posições x medidas no PDF). */
class ExtratorPpcTest {

	private static final float CORPO = 85, NOME = 107, TEXTO = 217;

	private static List<LinhaPdf> linhas(Object... xTexto) {
		List<LinhaPdf> l = new ArrayList<>();
		for (int i = 0; i < xTexto.length; i += 2) {
			l.add(new LinhaPdf(1, ((Number) xTexto[i]).floatValue(), (String) xTexto[i + 1]));
		}
		return l;
	}

	@Test
	void catalogoJuntaNomesQuebradosERemoveSemestre() {
		var c = ExtratorPpc.catalogo(linhas(
				CORPO, "Tabela 13. Quadro da integralização curricular",
				CORPO, "Pré-requisito Correquisito Equivalência",
				86, "1 Introdução a Sistemas e",
				120, "Mídias Digitais",
				120, "SMD0094",
				241, "64 - - 64",
				397, "-",
				463, "- SMD0005",
				120, "CK0212",
				120, "História do Design",
				120, "SMD0091",
				241, "64 - - 64",
				CORPO, "Tabela 15. Ementário de disciplinas."));

		assertThat(c.nomePorCodigo()).containsExactly(
				entry("SMD0094", "Introdução a Sistemas e Mídias Digitais"),
				entry("SMD0091", "História do Design"));
	}

	@Test
	void catalogoIgnoraVagasGenericasDeEletivaEOptativa() {
		var c = ExtratorPpc.catalogo(linhas(
				CORPO, "Tabela 13.",
				120, "Eletiva 4 do 4º",
				120, "semestre",
				241, "64 - - -",
				86, "5 Metodologia da",
				120, "Pesquisa Científica",
				120, "SMD0102",
				120, "Optativa 1 64 - - -",
				CORPO, "Tabela 15."));

		assertThat(c.nomePorCodigo()).containsExactly(entry("SMD0102", "Metodologia da Pesquisa Científica"));
	}

	@Test
	void catalogoAceitaCodigoNaPaginaSeguinte() {
		var c = ExtratorPpc.catalogo(linhas(
				CORPO, "Tabela 13.",
				120, "Produção Audiovisual",
				120, "para Crianças e",
				120, "Adolescentes",
				241, "24 24 16 64 - - -",
				517, "52",
				120, "SMD0147",
				CORPO, "Tabela 15."));

		assertThat(c.nomePorCodigo())
			.containsExactly(entry("SMD0147", "Produção Audiovisual para Crianças e Adolescentes"));
	}

	@Test
	void catalogoSinalizaCodigoDuplicadoNoPpc() {
		var c = ExtratorPpc.catalogo(linhas(
				CORPO, "Tabela 13.",
				120, "Fotografia Digital",
				120, "SMD0144",
				241, "32 16 16 64 SMD0136 - -",
				120, "Semiótica Aplicada",
				120, "SMD0144",
				CORPO, "Tabela 15."));

		assertThat(c.nomePorCodigo()).containsExactly(entry("SMD0144", "Fotografia Digital"));
		assertThat(c.conflitos()).containsExactly(entry("Semiótica Aplicada", "SMD0144"));
	}

	@Test
	void ementarioSeparaColunasPorPosicao() {
		var e = ExtratorPpc.ementario(linhas(
				CORPO, "Tabela 15. Ementário de disciplinas.",
				NOME, "Disciplina",
				TEXTO, "Ementa",
				NOME, "Autoração Multimídia I",
				TEXTO, "Imagem estática bitmap: seleção, recorte,",
				TEXTO, "tratamento.",
				517, "55",
				NOME, "Estrutura de Dados4o semestre",
				TEXTO, "Listas, pilhas e filas.",
				CORPO, "Também é apresentada a bibliografia básica e complementar de todas as disciplinas:",
				CORPO, "Tabela 16. Bibliografia das disciplinas."));

		assertThat(e).extracting(ExtratorPpc.EntradaPorNome::nome, ExtratorPpc.EntradaPorNome::texto)
			.containsExactly(
					org.assertj.core.groups.Tuple.tuple("Autoração Multimídia I",
							"Imagem estática bitmap: seleção, recorte, tratamento."),
					org.assertj.core.groups.Tuple.tuple("Estrutura de Dados", "Listas, pilhas e filas."));
	}

	@Test
	void bibliografiaSeparaBasicaEComplementar() {
		var b = ExtratorPpc.bibliografias(linhas(
				CORPO, "Tabela 16. Bibliografia das disciplinas.",
				NOME, "Desenho I",
				334, "Básica:",
				198, "HALLAWELL, Philip. À mão livre: a linguagem do desenho. São Paulo:",
				299, "Melhoramentos, 1994.",
				183, "MATERIAIS e técnicas: guia completo . São Paulo, SP: Martins Fontes, 2008.",
				314, "Complementar:",
				182, "SAMMON, Rick. Rick Sammon's Complete Guide to Digital Photography 2.0.",
				223, "W.W. NORTON & CO. 2ª Edição. 2007. ISBN: 0393329143.",
				CORPO, "3.5. Metodologias de ensino e de aprendizagem"));

		assertThat(b).hasSize(1);
		assertThat(b.getFirst().basica()).extracting(Referencia::ano).containsExactly(1994, 2008);
		assertThat(b.getFirst().complementar()).singleElement()
			.satisfies(r -> assertThat(r.texto()).contains("W.W. NORTON").startsWith("SAMMON"))
			.extracting(Referencia::ano).isEqualTo(2007);
	}

}
