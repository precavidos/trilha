package br.ufc.trilha.ppc;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * O PPC extraído em forma revisável: um registro por componente do catálogo, com ementa e
 * bibliografia quando encontradas, e a lista de pendências que exigem revisão humana (ADR 0007).
 */
public record SeedPpc(String documento, List<Componente> componentes, List<Pendencia> pendencias) {

	public record Componente(String codigo, String nome, String ementa, Integer paginaEmenta, List<Referencia> bibliografiaBasica,
			List<Referencia> bibliografiaComplementar) {
	}

	/**
	 * Algo que o extrator não resolveu com certeza. {@code tipo}: CODIGO_DUPLICADO, SEM_CASAMENTO,
	 * CASAMENTO_APROXIMADO, SEM_EMENTA, SEM_BIBLIOGRAFIA, REFERENCIA_SEM_ANO.
	 */
	public record Pendencia(String tipo, String nome, String codigo, String detalhe) {
	}

	public static SeedPpc extrair(String documento, List<LinhaPdf> linhas) {
		ExtratorPpc.Catalogo extraido = ExtratorPpc.catalogo(linhas);
		Map<String, String> catalogo = extraido.nomePorCodigo();
		CasadorDeNomes casador = new CasadorDeNomes(catalogo);
		List<Pendencia> pendencias = new ArrayList<>();
		extraido.conflitos().forEach((nome, codigo) -> pendencias.add(new Pendencia("CODIGO_DUPLICADO", nome, codigo,
				"o PPC atribui a " + codigo + " também a \"" + catalogo.get(codigo) + "\"")));

		Map<String, ExtratorPpc.EntradaPorNome> ementaPorCodigo = new LinkedHashMap<>();
		for (var e : ExtratorPpc.ementario(linhas)) {
			casar(casador, e.nome(), "ementa", pendencias).ifPresent(c -> ementaPorCodigo.putIfAbsent(c, e));
		}
		Map<String, ExtratorPpc.BibliografiaPorNome> bibliografiaPorCodigo = new LinkedHashMap<>();
		for (var b : ExtratorPpc.bibliografias(linhas)) {
			casar(casador, b.nome(), "bibliografia", pendencias).ifPresent(c -> bibliografiaPorCodigo.putIfAbsent(c, b));
		}

		List<Componente> componentes = new ArrayList<>();
		catalogo.forEach((codigo, nome) -> {
			var ementa = ementaPorCodigo.get(codigo);
			var bib = bibliografiaPorCodigo.get(codigo);
			if (ementa == null) {
				pendencias.add(new Pendencia("SEM_EMENTA", nome, codigo, null));
			}
			if (bib == null) {
				pendencias.add(new Pendencia("SEM_BIBLIOGRAFIA", nome, codigo, null));
			}
			else {
				for (var r : concat(bib.basica(), bib.complementar())) {
					if (r.ano() == null) {
						pendencias.add(new Pendencia("REFERENCIA_SEM_ANO", nome, codigo, r.texto()));
					}
				}
			}
			componentes.add(new Componente(codigo, nome, ementa == null ? null : ementa.texto(),
					ementa == null ? null : ementa.pagina(), bib == null ? List.of() : bib.basica(),
					bib == null ? List.of() : bib.complementar()));
		});
		return new SeedPpc(documento, componentes, pendencias);
	}

	private static java.util.Optional<String> casar(CasadorDeNomes casador, String nome, String onde,
			List<Pendencia> pendencias) {
		var casamento = casador.casar(nome);
		if (casamento.isEmpty()) {
			pendencias.add(new Pendencia("SEM_CASAMENTO", nome, null, "nome da " + onde + " não encontrado no catálogo"));
			return java.util.Optional.empty();
		}
		if (!casamento.get().exato()) {
			pendencias.add(new Pendencia("CASAMENTO_APROXIMADO", nome, casamento.get().codigo(), onde));
		}
		return java.util.Optional.of(casamento.get().codigo());
	}

	private static List<Referencia> concat(List<Referencia> a, List<Referencia> b) {
		List<Referencia> r = new ArrayList<>(a);
		r.addAll(b);
		return r;
	}

}
