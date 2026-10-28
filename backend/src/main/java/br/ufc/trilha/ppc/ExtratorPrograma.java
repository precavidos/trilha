package br.ufc.trilha.ppc;

import java.util.ArrayList;
import java.util.List;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extrai os campos de conteúdo de um formulário de disciplina já convertido em texto. Há dois modelos de
 * formulário: o de 2018 ("11. Ementa", "12. Descrição do Conteúdo", "13. Bibliografia" com "Básica:" e
 * "Complementar:") e o de 2021–2022 ("13. Ementa", "15. Bibliografia Básica", "16. Bibliografia
 * Complementar"). Cada campo vai até a próxima seção numerada conhecida ou até as assinaturas.
 */
public final class ExtratorPrograma {

	/** Início de seção: "12. Objetivo(s) da Disciplina", "16. Bibliografia Complementar"… */
	private static final Pattern SECAO = Pattern.compile(
			"(?m)^\\s*\\d{1,2}\\.\\s*(Unidade|Departamento|Curso|Nome|Código|Pré|Correquisitos|Equivalências|Turno|Regime"
					+ "|Justificativa|Objetivo|Ementa|Descrição|Bibliografia|Avaliação|Aprovação)");
	/** Fim do formulário: a partir daqui só há assinaturas, carimbos e orientações. */
	private static final Pattern FIM = Pattern.compile("Documento assinado eletronicamente|Orientações para tramitação");
	private static final Pattern ASSINATURA = Pattern.compile(
			"assinado eletronicamente por .{1,200}?\\sem\\s+(\\d{2})/(\\d{2})/(\\d{4})", Pattern.DOTALL);
	private static final Pattern CURRICULO = Pattern.compile("\\b(20\\d\\d\\.\\d[A-Z]?)\\b");
	private static final Pattern COMPETENCIAS = Pattern.compile(
			"[-–•]?\\s*Competências gerais.*?formação dos estudantes:(.*?)[-–•]?\\s*Competências específicas.*?formação dos estudantes:(.*)",
			Pattern.DOTALL);

	private ExtratorPrograma() {
	}

	private record Secao(String titulo, String texto) {
	}

	public static ProgramaDisciplina extrair(String codigo, String nome, String arquivo, String original) {
		// Alguns PDFs do SEI separam as palavras com tabulação; os padrões abaixo contam com espaços.
		String texto = original.replaceAll("[\\t\\u00a0 ]+", " ");
		Matcher fim = FIM.matcher(texto);
		String corpo = fim.find() ? texto.substring(0, fim.start()) : texto;
		List<Secao> secoes = secoes(corpo);

		String objetivos = null;
		String competencias = null;
		String objetivosBruto = primeira(secoes, "Objetivo");
		if (objetivosBruto != null) {
			Matcher c = COMPETENCIAS.matcher(objetivosBruto);
			if (c.find()) {
				objetivos = limpar(objetivosBruto.substring(0, c.start()));
				competencias = limpar((c.group(1) + " " + c.group(2)));
			}
			else {
				objetivos = limpar(objetivosBruto);
			}
		}

		String basica = primeira(secoes, "Bibliografia Básica");
		String complementar = primeira(secoes, "Bibliografia Complementar");
		if (basica == null && complementar == null) {
			// Modelo de 2018: uma seção "Bibliografia" com os blocos "Básica:" e "Complementar:".
			String bib = primeira(secoes, "Bibliografia");
			if (bib != null) {
				int i = bib.indexOf("Complementar:");
				basica = i < 0 ? bib : bib.substring(0, i);
				complementar = i < 0 ? null : bib.substring(i + "Complementar:".length());
				basica = basica.replaceFirst("^\\s*Básica:", "");
			}
		}

		Matcher a = ASSINATURA.matcher(texto);
		String assinadoEm = a.find() ? a.group(3) + "-" + a.group(2) + "-" + a.group(1) : null;
		var curriculos = new TreeSet<String>();
		Matcher cur = CURRICULO.matcher(corpo.substring(0, Math.min(corpo.length(), 4000)));
		while (cur.find()) {
			curriculos.add(cur.group(1));
		}

		return new ProgramaDisciplina(codigo, nome, arquivo, assinadoEm, List.copyOf(curriculos), objetivos,
				competencias, limpar(primeira(secoes, "Ementa")), conteudo(primeira(secoes, "Descrição do Conteúdo")),
				limpar(basica), limpar(complementar));
	}

	/** Cada seção começa no cabeçalho numerado e termina no próximo; o texto exclui a linha do cabeçalho. */
	private static List<Secao> secoes(String corpo) {
		List<Secao> secoes = new ArrayList<>();
		Matcher m = SECAO.matcher(corpo);
		int inicio = -1;
		String titulo = null;
		while (m.find()) {
			if (titulo != null) {
				secoes.add(new Secao(titulo, corpo.substring(inicio, m.start())));
			}
			int fimDaLinha = fimDaLinha(corpo, m.end());
			titulo = corpo.substring(m.start(), fimDaLinha).strip();
			// Cabeçalho com observação longa quebra em duas linhas: "13. Ementa (conforme … por" / "oferta):".
			int abre = titulo.lastIndexOf('(');
			if (abre >= 0 && titulo.indexOf(')', abre) < 0) {
				int fecha = corpo.indexOf(')', fimDaLinha);
				if (fecha >= 0 && fecha - fimDaLinha < 200) {
					fimDaLinha = fimDaLinha(corpo, fecha);
					titulo = corpo.substring(m.start(), fimDaLinha).strip();
				}
			}
			inicio = fimDaLinha;
		}
		if (titulo != null) {
			secoes.add(new Secao(titulo, corpo.substring(inicio)));
		}
		return secoes;
	}

	private static int fimDaLinha(String texto, int desde) {
		int i = texto.indexOf('\n', desde);
		return i < 0 ? texto.length() : i;
	}

	private static String primeira(List<Secao> secoes, String prefixo) {
		Pattern p = Pattern.compile("^\\d{1,2}\\.\\s*" + Pattern.quote(prefixo));
		return secoes.stream().filter(s -> p.matcher(s.titulo()).find()).map(Secao::texto).findFirst().orElse(null);
	}

	/** O conteúdo detalhado (modelo de 2018) sem o cabeçalho da tabela de horas. */
	private static String conteudo(String texto) {
		String t = limpar(texto);
		return t == null ? null : limpar(t.replaceFirst("^Unidades e Assuntos das Aulas.*?caso\\):?", ""));
	}

	/** Junta as quebras de linha e descarta campos vazios ou só com rótulos de formulário. */
	static String limpar(String texto) {
		if (texto == null) {
			return null;
		}
		String t = texto.replace(' ', ' ').replaceAll("\\s+", " ").strip();
		return t.length() < 3 ? null : t;
	}

}
