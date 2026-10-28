package br.ufc.trilha.analise;

import java.nio.file.Path;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import tools.jackson.databind.json.JsonMapper;

/** Serve a análise pré-calculada (ADR 0010), aplicando a classificação de cobertura. */
@Service
public class AnaliseService {

	private static final int EVIDENCIAS = 3;

	private final Analise analise;
	private final Cobertura cobertura;
	private final Map<String, Analise.Componente> componentePorCodigo;

	public AnaliseService(@Value("${trilha.dados.analise}") String arquivo, Cobertura cobertura, JsonMapper json) {
		// String, não Path: num servidor web o Spring resolveria o Path como recurso do servlet.
		this.analise = json.readValue(Path.of(arquivo).toFile(), Analise.class);
		this.cobertura = cobertura;
		this.componentePorCodigo = analise.componentes().stream()
			.collect(Collectors.toMap(Analise.Componente::codigo, Function.identity()));
	}

	public record Evidencia(String codigo, String nome, double similaridade, String ementa) {
	}

	public record Item(String id, String rotulo, String tipo, String descricao, String fonte, String relacao,
			Cobertura.Status status, double similaridade, double escore, List<Evidencia> evidencias) {
	}

	public record Contagem(int coberta, int parcial, int lacuna) {
	}

	public record ProfissaoResumo(String id, String rotulo, String tituloEsco, String uriEsco,
			List<String> itinerarios, Contagem contagem) {
	}

	public record Resumo(Analise.Metadados metadados, int componentes, int componentesComEmenta,
			int componentesComBibliografia, int competencias, Integer medianaGeralDaBibliografia,
			double fracaoReferenciasComMaisDe10Anos, Contagem lenteIa, List<ProfissaoResumo> profissoes) {
	}

	public Analise.Metadados metadados() {
		return analise.metadados();
	}

	public Resumo resumo() {
		var bib = analise.bibliografia();
		List<Integer> medianas = bib.stream().map(Analise.IdadeBibliografia::mediana)
			.filter(java.util.Objects::nonNull).sorted().toList();
		int comAno = bib.stream().mapToInt(Analise.IdadeBibliografia::comAno).sum();
		double antigas = bib.stream().mapToDouble(b -> b.fracaoComMaisDe10Anos() * b.comAno()).sum();
		return new Resumo(analise.metadados(), analise.componentes().size(),
				(int) analise.componentes().stream().filter(c -> c.ementa() != null).count(), bib.size(),
				analise.competencias().size(),
				medianas.isEmpty() ? null : medianas.get((medianas.size() - 1) / 2),
				comAno == 0 ? 0 : Math.round(antigas / comAno * 1000) / 1000.0,
				contar(lenteIa()),
				analise.profissoes().stream().map(p -> new ProfissaoResumo(p.id(), p.rotulo(), p.tituloEsco(),
						p.uriEsco(), p.itinerarios(), contar(itens(p)))).toList());
	}

	/** Competências de uma profissão-alvo, lacunas primeiro e essenciais antes de opcionais. */
	public List<Item> lacunas(String profissaoId) {
		var p = analise.profissoes().stream().filter(x -> x.id().equals(profissaoId)).findFirst()
			.orElseThrow(() -> new NoSuchElementException("profissão-alvo desconhecida: " + profissaoId));
		return ordenar(itens(p));
	}

	/** A lente transversal: competências da Extensão IA. */
	public List<Item> lenteIa() {
		return ordenar(analise.lenteIa().stream().map(id -> item(id, "transversal-ia")).toList());
	}

	public List<Analise.IdadeBibliografia> bibliografia() {
		return analise.bibliografia().stream()
			.sorted(Comparator.comparing(Analise.IdadeBibliografia::mediana,
					Comparator.nullsLast(Comparator.naturalOrder())))
			.toList();
	}

	public Item competencia(String id) {
		if (!analise.competencias().containsKey(id)) {
			throw new NoSuchElementException("competência desconhecida: " + id);
		}
		return item(id, null);
	}

	private List<Item> itens(Analise.Profissao p) {
		return p.competencias().stream().map(e -> item(e.competencia(), e.relacao())).toList();
	}

	private Item item(String id, String relacao) {
		var c = analise.competencias().get(id);
		List<Evidencia> evidencias = c.proximos().stream().limit(EVIDENCIAS).map(px -> {
			var comp = componentePorCodigo.get(px.codigo());
			return new Evidencia(px.codigo(), comp.nome(), px.similaridade(), comp.ementa());
		}).toList();
		double sim = c.proximos().isEmpty() ? 0 : c.proximos().getFirst().similaridade();
		return new Item(c.id(), paraExibicao(c.rotulo()), c.tipo(), c.descricao(), c.fonte(), relacao,
				cobertura.classificar(c), sim, Math.round(Cobertura.escore(c) * 100) / 100.0, evidencias);
	}

	/**
	 * A ESCO grafa as competências em minúsculas ("design de interação de software"), e a Extensão IA,
	 * com inicial maiúscula. Na exibição, todas ganham inicial maiúscula; o resto do rótulo fica como na
	 * fonte, preservando nomes próprios ("WordPress", "C#"). O snapshot da ESCO não é alterado.
	 */
	static String paraExibicao(String rotulo) {
		if (rotulo == null || rotulo.isEmpty() || !Character.isLowerCase(rotulo.codePointAt(0))) {
			return rotulo;
		}
		int primeiro = rotulo.codePointAt(0);
		return new String(Character.toChars(Character.toUpperCase(primeiro)))
				+ rotulo.substring(Character.charCount(primeiro));
	}

	private static List<Item> ordenar(List<Item> itens) {
		return itens.stream()
			.sorted(Comparator.comparing(Item::status).reversed()
				.thenComparing(i -> peso(i.relacao()))
				.thenComparingDouble(Item::escore))
			.toList();
	}

	private static int peso(String relacao) {
		return switch (relacao == null ? "" : relacao) {
			case "essencial", "transversal-ia" -> 0;
			default -> 1;
		};
	}

	private static Contagem contar(List<Item> itens) {
		Map<Cobertura.Status, Long> n = new EnumMap<>(Cobertura.Status.class);
		itens.forEach(i -> n.merge(i.status(), 1L, Long::sum));
		return new Contagem(n.getOrDefault(Cobertura.Status.COBERTA, 0L).intValue(),
				n.getOrDefault(Cobertura.Status.PARCIAL, 0L).intValue(),
				n.getOrDefault(Cobertura.Status.LACUNA, 0L).intValue());
	}

}
