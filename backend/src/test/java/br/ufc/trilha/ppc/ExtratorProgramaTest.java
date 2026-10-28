package br.ufc.trilha.ppc;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** Textos sintéticos que reproduzem os dois modelos de formulário; nomes de pessoas são fictícios. */
class ExtratorProgramaTest {

	private static final String MODELO_2022 = """
			FORMULÁRIO PARA CRIAÇÃO E/OU REGULAMENTAÇÃO DE
			DISCIPLINA
			3. Curso
			078 Sistemas e Mídias Digitais (Diurno) 2013.2
			094 Sistemas e Mídias Digitais (Noturno) 2016.1
			11. Justificativa para a criação/regulamentação desta disciplina – Máximo de 500 caracteres
			Introdução ao conceito de linguagem script.
			12. Objetivo(s) da Disciplina:
			Aprofundar os conhecimentos de programação utilizando a linguagem Python.
			- Competências gerais (quando houver) desenvolvidas na disciplina, em contribuição para o perfil de
			formação dos estudantes:
			- Competências específicas (quando houver) desenvolvidas na disciplina, em contribuição para o perfil
			de formação dos estudantes:
			Automatizar tarefas com scripts.
			13. Ementa (conforme “Programa de Disciplina” aprovado e arquivado pela Unidade Responsável por
			oferta):
			Introdução a linguagem script. Programação Web.
			14. Descrição da Carga Horária
			16 64 40 24 0 0
			15. Bibliografia Básica (sugere-se a inclusão de, pelo menos, 03 títulos):
			ROBBINS, Arnold. Classic shell scripting. Bookman, 2008.
			16. Bibliografia Complementar (sugere-se a inclusão de, pelo menos, 05 títulos):
			DEITEL et al. C# Como Programar. Pearson, 2003.
			Documento assinado eletronicamente por FULANO DE TAL, Coordenador de Curso,
			em 13/09/2022, às 17:08, conforme horário oficial de Brasília.
			""";

	private static final String MODELO_2018 = """
			10. Objetivo(s) da Disciplina:
			Capacitar o aluno para trabalhar com sistemas distribuídos.
			11. Ementa:
			Introdução aos Sistemas Distribuídos. Middleware.
			12. Descrição do Conteúdo e Carga Horária
			Unidades e Assuntos das Aulas No de Horas Teóricas Nº de Horas Práticas No de Horas EaD (quando for o caso):
			1. Introdução aos Sistemas Distribuídos
			• Visão Geral; 4
			2. Comunicação entre processos com Java RMI 8
			13. Bibliografia (sugere-se a inclusão de até 10 títulos):
			Básica:
			COULOURIS, George. Distributed systems. 2010.
			Complementar:
			LUCKOW, Décio. Programação Java para a Web. Novatec, 2010.
			14. Avaliação de Aprendizagem:
			Provas escritas.
			15. Aprovação do Colegiado do Departamento (quando for o caso)
			_________________________________
			Chefe(a) do Departamento
			""";

	@Test
	void extraiOModeloDe2022SemOsRotulosNemAAssinatura() {
		var p = ExtratorPrograma.extrair("SMD0045", "LINGUAGEM DE PROGRAMAÇÃO SCRIPT", "x.pdf", MODELO_2022);

		assertThat(p.objetivos()).isEqualTo("Aprofundar os conhecimentos de programação utilizando a linguagem Python.");
		assertThat(p.competencias()).isEqualTo("Automatizar tarefas com scripts.");
		assertThat(p.ementa()).isEqualTo("Introdução a linguagem script. Programação Web.");
		assertThat(p.bibliografiaBasica()).isEqualTo("ROBBINS, Arnold. Classic shell scripting. Bookman, 2008.");
		assertThat(p.bibliografiaComplementar()).isEqualTo("DEITEL et al. C# Como Programar. Pearson, 2003.");
		assertThat(p.conteudo()).isNull();
		assertThat(p.assinadoEm()).isEqualTo("2022-09-13");
		assertThat(p.curriculos()).containsExactly("2013.2", "2016.1");
		assertThat(p.toString()).doesNotContain("FULANO");
	}

	@Test
	void extraiOModeloDe2018ComConteudoEBibliografiaUnica() {
		var p = ExtratorPrograma.extrair("SMD0050", "SISTEMAS DISTRIBUÍDOS", "y.pdf", MODELO_2018);

		assertThat(p.objetivos()).isEqualTo("Capacitar o aluno para trabalhar com sistemas distribuídos.");
		assertThat(p.ementa()).isEqualTo("Introdução aos Sistemas Distribuídos. Middleware.");
		assertThat(p.conteudo()).startsWith("1. Introdução aos Sistemas Distribuídos").contains("Java RMI");
		assertThat(p.bibliografiaBasica()).isEqualTo("COULOURIS, George. Distributed systems. 2010.");
		assertThat(p.bibliografiaComplementar()).isEqualTo("LUCKOW, Décio. Programação Java para a Web. Novatec, 2010.");
		assertThat(p.assinadoEm()).isNull();
	}

	@Test
	void aceitaPalavrasSeparadasPorTabulacao() {
		var p = ExtratorPrograma.extrair("SMD0045", "X", "x.pdf", MODELO_2022.replace(' ', '\t'));
		assertThat(p.ementa()).isEqualTo("Introdução a linguagem script. Programação Web.");
		assertThat(p.competencias()).isEqualTo("Automatizar tarefas com scripts.");
	}

}
