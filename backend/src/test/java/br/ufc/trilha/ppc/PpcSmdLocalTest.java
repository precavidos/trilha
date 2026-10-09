package br.ufc.trilha.ppc;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;

/**
 * Roda o extrator sobre o PPC real. O PDF fica em data/private (fora do git),
 * então este teste só executa nas máquinas da equipe, não no CI.
 */
@EnabledIf("ppcDisponivel")
class PpcSmdLocalTest {

	private static final Path PPC = Path.of("../data/private/fontes/ppc-smd-diurno-2024-2.pdf");

	static boolean ppcDisponivel() {
		return Files.exists(PPC);
	}

	@Test
	void extraiOPpcDoSmd() throws Exception {
		var seed = SeedPpc.extrair("PPC SMD 2024.2", LeitorPdf.ler(Files.readAllBytes(PPC)));

		assertThat(seed.componentes()).hasSizeGreaterThanOrEqualTo(75);
		assertThat(seed.componentes().stream().filter(c -> c.ementa() != null)).hasSizeGreaterThanOrEqualTo(55);

		var autoracao = seed.componentes().stream().filter(c -> c.codigo().equals("SMD0088")).findFirst().orElseThrow();
		assertThat(autoracao.ementa()).startsWith("Imagem estática bitmap");
		assertThat(autoracao.bibliografiaBasica()).extracting(Referencia::ano).containsOnly(2009);
		assertThat(autoracao.bibliografiaComplementar()).hasSize(5);

		assertThat(seed.pendencias()).anySatisfy(p -> {
			assertThat(p.tipo()).isEqualTo("CODIGO_DUPLICADO");
			assertThat(p.nome()).isEqualTo("Semiótica Aplicada");
		});
	}

}
