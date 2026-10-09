package br.ufc.trilha.ppc;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Predicate;
import java.util.regex.Pattern;

/**
 * Extrai do texto posicional do PPC do SMD o catálogo de componentes (nome ↔ código),
 * o ementário e a bibliografia. Calibrado para o layout do PPC 2024.2 (ADR 0007):
 * em outros PPCs funciona em "melhor esforço" e tudo o que não casar vira pendência.
 */
public final class ExtratorPpc {

	/** Fronteira entre a coluna de nomes (x ≈ 89–113 pt) e a de texto (x ≥ 179 pt) nas Tabelas 15 e 16. */
	static final float FRONTEIRA_DE_COLUNA = 150f;

	private static final Pattern CODIGO = Pattern.compile("[A-Z]{2,4}\\d{4}");
	private static final Pattern SO_NUMERO = Pattern.compile("\\d+");
	private static final Pattern SEMESTRE_NO_INICIO = Pattern.compile("^\\d\\s+");
	/** Célula de carga horária/requisitos ("64 - - 64", "-", "- SMD0005"), código com resíduo ("SMD0034-") ou vaga genérica. */
	private static final Pattern LINHA_DE_DADOS = Pattern.compile(
			"^(\\d+|-)(\\s.*)?$|^[A-Z]{2,4}\\d{4}\\W.*|^(Optativa|Eletiva) \\d+.*");
	/** Primeira linha de nome precedida pelo semestre ("1 Introdução a ..."), que não é linha de dados. */
	private static final Pattern NOME_COM_SEMESTRE = Pattern.compile("^\\d\\s+\\p{L}.*");
	private static final Pattern INICIO_DE_REFERENCIA = Pattern.compile(
			"^[A-ZÀ-Ý][A-ZÀ-Ý'’\\-]+(\\s+[A-ZÀ-Ý'’\\-]+)*\\s*[,.].*"   // SOBRENOME, ... | ENTIDADE EM CAIXA.
			+ "|^[A-ZÀ-Ý]{3,}\\s+[a-zà-ÿ].*");                       // TÍTULO em caixa alta como entrada

	private ExtratorPpc() {
	}

	/** Um nome de componente e o texto associado a ele numa tabela de duas colunas. */
	public record EntradaPorNome(String nome, List<String> linhas, int pagina) {
		public EntradaPorNome {
			// Algumas células trazem a etapa colada ao nome: "Estrutura de Dados4o semestre".
			nome = nome.replaceAll("\\s*\\d+\\s*[oº°]\\s*semestre$", "").strip();
		}

		public String texto() {
			return String.join(" ", linhas).replaceAll("\\s+", " ").strip();
		}
	}

	public record BibliografiaPorNome(String nome, List<Referencia> basica, List<Referencia> complementar, int pagina) {
	}

	/**
	 * Catálogo do PPC. {@code conflitos} guarda nomes que o PPC atribui a um código já usado por
	 * outro componente (ex.: Semiótica Aplicada impressa como SMD0144, código de Fotografia Digital).
	 */
	public record Catalogo(Map<String, String> nomePorCodigo, Map<String, String> conflitos) {
	}

	/** Código → nome, a partir das Tabelas 13 e 14 (integralização, eletivas e optativas). */
	public static Catalogo catalogo(List<LinhaPdf> linhas) {
		Map<String, String> nomePorCodigo = new LinkedHashMap<>();
		Map<String, String> conflitos = new LinkedHashMap<>();
		List<String> nome = new ArrayList<>();
		// Nome cuja linha de dados chegou antes do código (o código caiu na página seguinte).
		String nomeSemCodigo = null;
		for (LinhaPdf linha : regiao(linhas, comeca("Tabela 13."), comeca("Tabela 15."))) {
			String t = linha.texto();
			if (CODIGO.matcher(t).matches()) {
				String completo = !nome.isEmpty() ? String.join(" ", nome) : nomeSemCodigo;
				if (completo != null) {
					completo = SEMESTRE_NO_INICIO.matcher(completo).replaceFirst("");
					String existente = nomePorCodigo.putIfAbsent(t, completo);
					if (existente != null && !existente.equals(completo)) {
						conflitos.put(completo, t);
					}
				}
				nome.clear();
				nomeSemCodigo = null;
			}
			else if ((LINHA_DE_DADOS.matcher(t).matches() && !NOME_COM_SEMESTRE.matcher(t).matches())
					|| t.contains("Equivalência") || t.startsWith("Tabela ")) {
				if (!nome.isEmpty() && LINHA_DE_DADOS.matcher(t).matches() && !t.matches("^(Optativa|Eletiva).*")) {
					nomeSemCodigo = String.join(" ", nome);
				}
				nome.clear();
			}
			else {
				nome.add(t);
				nomeSemCodigo = null;
			}
		}
		return new Catalogo(nomePorCodigo, conflitos);
	}

	/** Tabela 15 — ementário. */
	public static List<EntradaPorNome> ementario(List<LinhaPdf> linhas) {
		return duasColunas(regiao(linhas, comeca("Tabela 15."), comeca("Tabela 16."))).stream()
			.filter(e -> !e.linhas().isEmpty() && !e.nome().equals("Disciplina"))
			.toList();
	}

	/** Tabela 16 — bibliografia básica e complementar. */
	public static List<BibliografiaPorNome> bibliografias(List<LinhaPdf> linhas) {
		List<BibliografiaPorNome> resultado = new ArrayList<>();
		for (EntradaPorNome entrada : duasColunas(regiao(linhas, comeca("Tabela 16."), ExtratorPpc::fimDaBibliografia))) {
			List<String> basica = new ArrayList<>();
			List<String> complementar = new ArrayList<>();
			List<String> atual = null;
			for (String l : entrada.linhas()) {
				if (l.startsWith("Básica")) {
					atual = basica;
					l = l.substring(l.indexOf(':') + 1).strip();
				}
				else if (l.startsWith("Complementar")) {
					atual = complementar;
					l = l.substring(l.indexOf(':') + 1).strip();
				}
				if (atual != null && !l.isEmpty()) {
					atual.add(l);
				}
			}
			if (!basica.isEmpty() || !complementar.isEmpty()) {
				resultado.add(new BibliografiaPorNome(entrada.nome(), referencias(basica), referencias(complementar),
						entrada.pagina()));
			}
		}
		return resultado;
	}

	/** Junta linhas quebradas em referências, iniciando uma nova a cada entrada em caixa alta. */
	static List<Referencia> referencias(List<String> linhas) {
		List<StringBuilder> refs = new ArrayList<>();
		for (String l : linhas) {
			boolean anteriorTerminou = refs.isEmpty() || terminaReferencia(refs.getLast());
			if (refs.isEmpty() || (anteriorTerminou && INICIO_DE_REFERENCIA.matcher(l).matches())) {
				refs.add(new StringBuilder(l));
			}
			else {
				refs.getLast().append(' ').append(l);
			}
		}
		return refs.stream().map(sb -> Referencia.de(sb.toString().replaceAll("\\s+", " ").strip())).toList();
	}

	private static boolean terminaReferencia(StringBuilder ref) {
		String s = ref.toString().strip();
		return s.endsWith(".") || s.endsWith(")") || s.matches(".*\\d$");
	}

	/** Agrupa linhas de uma tabela "nome | texto": linhas à esquerda formam o nome; à direita, o texto. */
	static List<EntradaPorNome> duasColunas(List<LinhaPdf> linhas) {
		List<EntradaPorNome> entradas = new ArrayList<>();
		List<String> nome = new ArrayList<>();
		List<String> texto = new ArrayList<>();
		int pagina = 0;
		for (LinhaPdf linha : linhas) {
			if (SO_NUMERO.matcher(linha.texto()).matches()) {
				continue; // número de página
			}
			if (linha.x() < FRONTEIRA_DE_COLUNA) {
				if (!texto.isEmpty()) {
					entradas.add(new EntradaPorNome(String.join(" ", nome), List.copyOf(texto), pagina));
					nome.clear();
					texto.clear();
				}
				if (nome.isEmpty()) {
					pagina = linha.pagina();
				}
				nome.add(linha.texto());
			}
			else if (!nome.isEmpty()) {
				texto.add(linha.texto());
			}
		}
		if (!nome.isEmpty()) {
			entradas.add(new EntradaPorNome(String.join(" ", nome), List.copyOf(texto), pagina));
		}
		return entradas;
	}

	private static boolean fimDaBibliografia(LinhaPdf linha) {
		return linha.x() < FRONTEIRA_DE_COLUNA && linha.texto().matches("^3\\.\\d+\\..*");
	}

	private static Predicate<LinhaPdf> comeca(String prefixo) {
		return l -> l.texto().startsWith(prefixo);
	}

	/** As linhas estritamente entre a primeira que satisfaz {@code inicio} e a primeira seguinte que satisfaz {@code fim}. */
	static List<LinhaPdf> regiao(List<LinhaPdf> linhas, Predicate<LinhaPdf> inicio, Predicate<LinhaPdf> fim) {
		int i = 0;
		while (i < linhas.size() && !inicio.test(linhas.get(i))) {
			i++;
		}
		List<LinhaPdf> resultado = new ArrayList<>();
		for (i++; i < linhas.size() && !fim.test(linhas.get(i)); i++) {
			resultado.add(linhas.get(i));
		}
		return resultado;
	}

}
