package br.ufc.trilha.ppc;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import java.util.zip.ZipFile;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;

import tools.jackson.databind.SerializationFeature;
import tools.jackson.databind.json.JsonMapper;

/**
 * Gera o seed revisável dos programas de disciplina (ADR 0007) a partir dos formulários da PROGRAD
 * ("SMD0045 - LINGUAGEM DE PROGRAMAÇÃO SCRIPT.pdf"), que ficam em {@code data/private/fontes/programas}.
 * Quando há versões por turno, usa a do Diurno (o PPC analisado é o do Diurno) e registra a divergência;
 * rascunhos em DOCX só entram se não houver PDF da disciplina.
 *
 * <pre>./mvnw -q compile exec:java -Dexec.mainClass=br.ufc.trilha.ppc.ExportarProgramas -Dexec.args="&lt;pasta&gt; &lt;saida.json&gt;"</pre>
 */
public final class ExportarProgramas {

	private static final Pattern ARQUIVO = Pattern.compile("^([A-Z]{2,5}\\d{4}) - (.+?)(?: - (Diurno|Noturno))?(?:\\(\\d+\\))?\\.(pdf|docx)$",
			Pattern.CASE_INSENSITIVE);

	public record Pendencia(String codigo, String tipo, String detalhe) {
	}

	public record SeedProgramas(String documento, List<ProgramaDisciplina> programas, List<Pendencia> pendencias) {
	}

	private record Arquivo(Path caminho, String codigo, String nome, String turno, boolean pdf) {
	}

	private ExportarProgramas() {
	}

	public static void main(String[] args) throws Exception {
		if (args.length < 2) {
			System.err.println("uso: ExportarProgramas <pasta dos formulários> <saida.json>");
			System.exit(2);
		}
		Map<String, List<Arquivo>> porCodigo = new TreeMap<>();
		List<Pendencia> pendencias = new ArrayList<>();
		try (Stream<Path> arquivos = Files.list(Path.of(args[0]))) {
			for (Path p : arquivos.sorted().toList()) {
				var m = ARQUIVO.matcher(p.getFileName().toString());
				if (!m.matches()) {
					pendencias.add(new Pendencia(null, "ARQUIVO_NAO_RECONHECIDO", p.getFileName().toString()));
					continue;
				}
				porCodigo.computeIfAbsent(m.group(1), k -> new ArrayList<>()).add(new Arquivo(p, m.group(1),
						m.group(2).strip(), m.group(3), m.group(4).equalsIgnoreCase("pdf")));
			}
		}

		List<ProgramaDisciplina> programas = new ArrayList<>();
		for (var e : porCodigo.entrySet()) {
			List<Arquivo> opcoes = e.getValue();
			List<Arquivo> pdfs = opcoes.stream().filter(Arquivo::pdf).toList();
			List<Arquivo> candidatos = pdfs.isEmpty() ? opcoes : pdfs;
			Arquivo escolhido = candidatos.stream()
				.min(Comparator.comparingInt((Arquivo a) -> a.turno() == null ? 0 : a.turno().equalsIgnoreCase("Diurno") ? 1 : 2)
					.thenComparing(a -> a.caminho().getFileName().toString()))
				.orElseThrow();
			var programa = extrair(escolhido);
			programas.add(programa);

			if (!pdfs.isEmpty() && opcoes.size() > pdfs.size()) {
				pendencias.add(new Pendencia(e.getKey(), "RASCUNHOS_IGNORADOS",
						(opcoes.size() - pdfs.size()) + " arquivo(s) DOCX ignorado(s); usado o PDF"));
			}
			for (Arquivo outro : pdfs) {
				if (outro != escolhido && outro.turno() != null) {
					var alternativo = extrair(outro);
					boolean igual = Objects.equals(programa.ementa(), alternativo.ementa());
					pendencias.add(new Pendencia(e.getKey(), igual ? "VERSAO_POR_TURNO" : "EMENTA_DIFERE_POR_TURNO",
							"usado " + escolhido.caminho().getFileName() + "; também há " + outro.caminho().getFileName()));
				}
			}
			if (programa.ementa() == null) {
				pendencias.add(new Pendencia(e.getKey(), "SEM_EMENTA", escolhido.caminho().getFileName().toString()));
			}
		}

		var seed = new SeedProgramas("Formulários de criação/regulamentação de disciplina do curso de Sistemas e Mídias "
				+ "Digitais (PROGRAD/UFC)", programas, pendencias);
		var json = JsonMapper.builder().enable(SerializationFeature.INDENT_OUTPUT).build();
		Path saida = Path.of(args[1]);
		Files.createDirectories(saida.toAbsolutePath().getParent());
		json.writeValue(saida.toFile(), seed);
		long comObjetivos = programas.stream().filter(p -> p.objetivos() != null).count();
		long comConteudo = programas.stream().filter(p -> p.conteudo() != null).count();
		System.out.printf("%d programas · %d com objetivos · %d com conteúdo detalhado · %d pendências → %s%n",
				programas.size(), comObjetivos, comConteudo, pendencias.size(), saida);
	}

	private static ProgramaDisciplina extrair(Arquivo a) throws IOException {
		return ExtratorPrograma.extrair(a.codigo(), a.nome(), a.caminho().getFileName().toString(), texto(a));
	}

	static String texto(Arquivo a) throws IOException {
		if (a.pdf()) {
			try (var documento = Loader.loadPDF(a.caminho().toFile())) {
				return new PDFTextStripper().getText(documento).replace("\r\n", "\n");
			}
		}
		try (var zip = new ZipFile(a.caminho().toFile())) {
			String xml = new String(zip.getInputStream(zip.getEntry("word/document.xml")).readAllBytes(),
					StandardCharsets.UTF_8);
			String texto = xml.replaceAll("</w:p>", "\n").replaceAll("<[^>]+>", "");
			return texto.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"")
				.replace("&apos;", "'");
		}
	}

}
