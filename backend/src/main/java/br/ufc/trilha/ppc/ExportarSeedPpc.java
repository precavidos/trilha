package br.ufc.trilha.ppc;

import java.nio.file.Files;
import java.nio.file.Path;

import tools.jackson.databind.SerializationFeature;
import tools.jackson.databind.json.JsonMapper;

/**
 * Gera o seed revisável do PPC (ADR 0007).
 *
 * <pre>./mvnw -q exec:java -Dexec.args="&lt;ppc.pdf&gt; &lt;saida.json&gt; &lt;nome do documento&gt;"</pre>
 */
public final class ExportarSeedPpc {

	private ExportarSeedPpc() {
	}

	public static void main(String[] args) throws Exception {
		if (args.length < 3) {
			System.err.println("uso: ExportarSeedPpc <ppc.pdf> <saida.json> <nome do documento>");
			System.exit(2);
		}
		var linhas = LeitorPdf.ler(Files.readAllBytes(Path.of(args[0])));
		var seed = SeedPpc.extrair(args[2], linhas);
		var json = JsonMapper.builder().enable(SerializationFeature.INDENT_OUTPUT).build();
		Path saida = Path.of(args[1]);
		Files.createDirectories(saida.toAbsolutePath().getParent());
		json.writeValue(saida.toFile(), seed);

		long comEmenta = seed.componentes().stream().filter(c -> c.ementa() != null).count();
		long comBibliografia = seed.componentes().stream().filter(c -> !c.bibliografiaBasica().isEmpty()).count();
		System.out.printf("%d componentes · %d com ementa · %d com bibliografia · %d pendências → %s%n",
				seed.componentes().size(), comEmenta, comBibliografia, seed.pendencias().size(), saida);
	}

}
