package br.ufc.trilha.discente;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import br.ufc.trilha.analise.Analise;
import br.ufc.trilha.analise.AnaliseService;
import br.ufc.trilha.analise.Cobertura;
import tools.jackson.databind.json.JsonMapper;

/**
 * Recomenda componentes optativos para uma {@link Trajetoria} (ADRs 0002 e 0009). Tudo é determinístico:
 * elegibilidade por pré-requisitos e equivalências da estrutura curricular do discente; ordem pelas
 * competências das profissões-alvo que cada ementa contempla, pelos itinerários formativos do PPC e pelas
 * regras de grupo e de extensão ainda pendentes. Diurno e Noturno têm estruturas próprias no SIGAA (mesmo código
 * de versão, pré-requisitos e equivalências diferentes) e o mesmo PPC, então a análise e os itinerários valem
 * para os dois.
 */
@Service
public class Recomendador {

	/** Peso de cada competência pela relação com a profissão-alvo. */
	static final Map<String, Double> PESO_RELACAO = Map.of("essencial", 1.0, "transversal-ia", 0.8, "opcional", 0.5);
	/** Peso pela posição da ementa entre as mais próximas da competência (0 = a mais próxima). */
	static final double[] PESO_POSICAO = { 1.0, 0.6, 0.35 };
	/**
	 * Peso pela situação da competência no PPC. Na validação, "parcial" foi a faixa mais fraca (9 de 13
	 * julgadas como não contempladas), por isso conta pouco.
	 */
	static final Map<Cobertura.Status, Double> PESO_STATUS = Map.of(Cobertura.Status.COBERTA, 1.0,
			Cobertura.Status.PARCIAL, 0.3, Cobertura.Status.LACUNA, 0.0, Cobertura.Status.NAO_DOCUMENTADA, 0.0);
	/** Quantas competências, no máximo, somam pontos para um componente. */
	static final int MAX_COMPETENCIAS = 5;
	static final double BONUS_NUCLEO = 2.0;
	static final double BONUS_COMPLEMENTAR = 1.0;
	static final double BONUS_GRUPO_PENDENTE = 1.5;
	static final double BONUS_EXTENSAO_PENDENTE = 0.5;
	static final int CH_PADRAO = 64;

	public record Itinerarios(String fonte, List<Itinerario> itinerarios) {
	}

	public record Itinerario(String nome, List<String> nucleo, List<String> complementares) {
	}

	public record CompetenciaContemplada(String competencia, String rotulo, String fonte, String relacao,
			String profissao, String situacaoNoPpc, double similaridade, int posicao, double peso) {
	}

	public record PapelNoItinerario(String itinerario, String papel) {
	}

	public record ContaParaGrupo(String grupo, int cumpridos, int minimo) {
	}

	public record Item(String codigo, String nome, Integer ch, double pontuacao, String codigoNoPpc, String ementa,
			List<CompetenciaContemplada> competencias, List<PapelNoItinerario> itinerarios, ContaParaGrupo grupo,
			boolean contaExtensao, List<String> preRequisitos, List<CompetenciaContemplada> evidencias,
			ContagemDeEvidencias contagem, String notaEmenta) {
	}

	/**
	 * Quantas competências próximas do componente cada profissão escolhida exige. A chave é o rótulo da profissão;
	 * {@code naoCobertas} soma as que o PPC trata como parcial, lacuna ou não documentada.
	 */
	public record ContagemDeEvidencias(Map<String, Integer> porProfissao, int total, int naoCobertas) {
	}

	/** Ementa que a validação mostrou ser fraca; a nota vai ao discente junto da sugestão. */
	public record EmentaComRessalva(String codigo, String nota, String fonte) {
	}

	public record Recomendacao(String estrutura, String turno, List<String> profissoes, int aprovados, int emCurso,
			Integer chOptativaPendente, int componentesSugeridos, List<String> avisos, List<Item> itens) {
	}

	private final AnaliseService analise;
	private final Map<String, EstruturaCurricular> estruturas = new LinkedHashMap<>();
	private final List<Itinerario> itinerarios;
	/** Código no PPC → nota de ressalva da ementa. */
	private final Map<String, String> notasDeEmenta = new LinkedHashMap<>();

	public Recomendador(AnaliseService analise, JsonMapper json, @Value("${trilha.dados.estruturas}") String pasta,
			@Value("${trilha.dados.itinerarios}") String arquivoItinerarios,
			@Value("${trilha.dados.ementas-com-ressalva}") String arquivoRessalvas) throws IOException {
		this.analise = analise;
		try (Stream<Path> arquivos = Files.list(Path.of(pasta))) {
			for (Path p : arquivos.filter(f -> f.toString().endsWith(".json")).sorted().toList()) {
				EstruturaCurricular e = json.readValue(p.toFile(), EstruturaCurricular.class);
				estruturas.put(chave(e.codigo(), e.turno()), e);
			}
		}
		this.itinerarios = json.readValue(Path.of(arquivoItinerarios).toFile(), Itinerarios.class).itinerarios();
		for (var r : json.readValue(Path.of(arquivoRessalvas).toFile(), EmentaComRessalva[].class)) {
			notasDeEmenta.put(r.codigo(), r.nota());
		}
	}

	public List<String> estruturasSuportadas() {
		return List.copyOf(estruturas.keySet());
	}

	public Recomendacao recomendar(Trajetoria t, List<String> profissoesIds) {
		String turno = t.turno() == null ? "diurno" : t.turno();
		EstruturaCurricular e = estruturas.get(chave(t.estrutura(), turno));
		if (e == null) {
			throw new NoSuchElementException("estrutura curricular não suportada: " + chave(t.estrutura(), turno)
					+ " (suportadas: " + String.join(", ", estruturas.keySet()) + ")");
		}
		if (profissoesIds.isEmpty() || profissoesIds.size() > 2) {
			throw new IllegalArgumentException("escolha uma ou duas profissões-alvo");
		}
		List<Analise.Profissao> profissoes = profissoesIds.stream().map(analise::profissao).toList();
		Map<String, EstruturaCurricular.Componente> porCodigo = new LinkedHashMap<>();
		e.componentes().forEach(c -> porCodigo.put(c.codigo(), c));

		Set<String> aprovados = new HashSet<>();
		Set<String> emCurso = new HashSet<>();
		for (var c : t.componentes()) {
			if ("aprovado".equals(c.situacao())) {
				aprovados.add(c.codigo());
			}
			else if ("matriculado".equals(c.situacao())) {
				emCurso.add(c.codigo());
			}
		}
		Set<String> previstos = new HashSet<>(aprovados);
		previstos.addAll(emCurso);

		// competência → (relação, profissão), mantendo a relação mais forte se as duas profissões a exigem
		Map<String, String[]> exigidas = new LinkedHashMap<>();
		for (var p : profissoes) {
			for (var ex : p.competencias()) {
				exigidas.merge(ex.competencia(), new String[] { ex.relacao(), p.rotulo() },
						(a, b) -> PESO_RELACAO.get(a[0]) >= PESO_RELACAO.get(b[0]) ? a : b);
			}
		}
		Set<String> itinerariosAlvo = new HashSet<>();
		profissoes.forEach(p -> itinerariosAlvo.addAll(p.itinerarios()));

		Integer chOptativaPendente = t.cargas().containsKey("optativa") ? t.cargas().get("optativa").pendente() : null;
		boolean extensaoPendente = t.cargas().containsKey("extensao") && t.cargas().get("extensao").pendente() > 0;

		List<Item> itens = new ArrayList<>();
		for (var c : e.componentes()) {
			if (!c.recomendavel() || cumprido(c.codigo(), previstos, porCodigo) || !preRequisitosOk(c, previstos, porCodigo)) {
				continue;
			}
			String noPpc = codigoNoPpc(c);
			// Toda competência próxima das profissões explica a sugestão (evidencias); só as que alguma ementa
			// contempla de fato (coberta ou parcial) pontuam.
			List<CompetenciaContemplada> evidencias = new ArrayList<>();
			for (var cp : analise.competenciasDoComponente(noPpc)) {
				String[] relProf = exigidas.get(cp.competencia());
				if (relProf == null) {
					continue; // competência fora das profissões escolhidas
				}
				double peso = PESO_RELACAO.get(relProf[0]) * PESO_POSICAO[cp.posicao()] * PESO_STATUS.get(cp.status());
				evidencias.add(new CompetenciaContemplada(cp.competencia(), cp.rotulo(), cp.fonte(), relProf[0], relProf[1],
						cp.status().name(), cp.similaridade(), cp.posicao(), Math.round(peso * 100) / 100.0));
			}
			evidencias.sort(Comparator.comparingInt(CompetenciaContemplada::posicao)
				.thenComparing(Comparator.comparingDouble(CompetenciaContemplada::similaridade).reversed()));
			List<CompetenciaContemplada> todas = evidencias.stream().filter(ev -> ev.peso() > 0.0).toList();
			// Só as mais fortes contam: evita que um componente suba por volume de casamentos fracos.
			List<CompetenciaContemplada> competencias = todas.stream()
				.sorted(Comparator.comparingDouble(CompetenciaContemplada::peso).reversed())
				.limit(MAX_COMPETENCIAS)
				.toList();
			double pontos = competencias.stream().mapToDouble(CompetenciaContemplada::peso).sum();

			List<PapelNoItinerario> papeis = new ArrayList<>();
			for (var it : itinerarios) {
				if (!itinerariosAlvo.contains(it.nome())) {
					continue;
				}
				if (it.nucleo().contains(noPpc)) {
					papeis.add(new PapelNoItinerario(it.nome(), "núcleo"));
					pontos += BONUS_NUCLEO;
				}
				else if (it.complementares().contains(noPpc)) {
					papeis.add(new PapelNoItinerario(it.nome(), "complementar"));
					pontos += BONUS_COMPLEMENTAR;
				}
			}

			ContaParaGrupo grupo = null;
			for (var g : e.grupos()) {
				if (g.componentes().contains(c.codigo()) && g.minimo() != null) {
					int feitos = (int) g.componentes().stream().filter(x -> cumprido(x, previstos, porCodigo)).count();
					grupo = new ContaParaGrupo(g.nome(), feitos, g.minimo());
					if (feitos < g.minimo()) {
						pontos += BONUS_GRUPO_PENDENTE;
					}
				}
			}
			boolean contaExtensao = c.chExtensao() != null && c.chExtensao() > 0 && extensaoPendente;
			if (contaExtensao) {
				pontos += BONUS_EXTENSAO_PENDENTE;
			}
			if (pontos <= 0) {
				continue; // sem relação com as profissões escolhidas
			}
			String ementa = analise.componente(noPpc).map(Analise.Componente::ementa).orElse(null);
			List<String> pre = c.preRequisitos().stream().map(alt -> String.join(" e ", alt)).toList();
			itens.add(new Item(c.codigo(), nomeLegivel(c.nome()), c.ch(), Math.round(pontos * 100) / 100.0,
					noPpc.equals(c.codigo()) ? null : noPpc, ementa, competencias, papeis, grupo,
					contaExtensao, pre, evidencias, contar(evidencias, profissoes), notasDeEmenta.get(noPpc)));
		}
		itens.sort(Comparator.comparingDouble(Item::pontuacao).reversed().thenComparing(Item::codigo));

		int sugeridos = chOptativaPendente == null ? 4 : (int) Math.ceil(chOptativaPendente / (double) CH_PADRAO);
		int limite = Math.max(5, Math.min(12, sugeridos + 3));
		List<String> avisos = new ArrayList<>();
		if (t.turno() == null) {
			avisos.add("O histórico não informa o turno; usamos a estrutura do Diurno. Se você é do Noturno, os pré-requisitos podem ser outros.");
		}
		if (chOptativaPendente != null && chOptativaPendente == 0) {
			avisos.add("Pelo histórico, você já cumpriu a carga horária optativa; as sugestões abaixo são para aprofundamento.");
		}
		if (!emCurso.isEmpty()) {
			avisos.add("Componentes em curso foram considerados como cumpridos para checar pré-requisitos.");
		}
		return new Recomendacao(e.codigo(), e.turno(), profissoes.stream().map(Analise.Profissao::rotulo).toList(), aprovados.size(),
				emCurso.size(), chOptativaPendente, sugeridos, avisos, itens.stream().limit(limite).toList());
	}

	/** Conta as evidências por profissão (na ordem da escolha, com zeros) e as que o PPC não cobre por inteiro. */
	static ContagemDeEvidencias contar(List<CompetenciaContemplada> evidencias, List<Analise.Profissao> profissoes) {
		Map<String, Integer> porProfissao = new LinkedHashMap<>();
		profissoes.forEach(p -> porProfissao.put(p.rotulo(), 0));
		int naoCobertas = 0;
		for (var ev : evidencias) {
			porProfissao.merge(ev.profissao(), 1, Integer::sum);
			if (!Cobertura.Status.COBERTA.name().equals(ev.situacaoNoPpc())) {
				naoCobertas++;
			}
		}
		return new ContagemDeEvidencias(porProfissao, evidencias.size(), naoCobertas);
	}

	/** "2013.2 noturno": o código de versão se repete entre os turnos. */
	static String chave(String codigo, String turno) {
		return codigo + " " + turno;
	}

	/** Cumprido diretamente ou por alguma equivalência registrada na estrutura curricular. */
	static boolean cumprido(String codigo, Set<String> base, Map<String, EstruturaCurricular.Componente> porCodigo) {
		if (base.contains(codigo)) {
			return true;
		}
		var c = porCodigo.get(codigo);
		return c != null && c.equivalencias().stream().anyMatch(base::containsAll);
	}

	static boolean preRequisitosOk(EstruturaCurricular.Componente c, Set<String> base,
			Map<String, EstruturaCurricular.Componente> porCodigo) {
		return c.preRequisitos().isEmpty() || c.preRequisitos().stream()
			.anyMatch(alt -> alt.stream().allMatch(k -> cumprido(k, base, porCodigo)));
	}

	/** O código do componente no PPC analisado: o próprio ou, nas estruturas antigas, o equivalente da matriz atual. */
	String codigoNoPpc(EstruturaCurricular.Componente c) {
		if (analise.componente(c.codigo()).isPresent()) {
			return c.codigo();
		}
		return c.equivalencias().stream().filter(alt -> alt.size() == 1).map(List::getFirst)
			.filter(k -> analise.componente(k).isPresent()).findFirst().orElse(c.codigo());
	}

	/** "PROGRAMAÇÃO PARA WEB I" → "Programação para Web I". */
	static String nomeLegivel(String nome) {
		Set<String> minusculas = Set.of("a", "à", "ao", "as", "às", "da", "das", "de", "do", "dos", "e", "em", "na", "no", "para", "por", "com");
		Set<String> romanos = Set.of("I", "II", "III", "IV", "V");
		String[] palavras = nome.toLowerCase(java.util.Locale.forLanguageTag("pt-BR")).split(" ");
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < palavras.length; i++) {
			String w = palavras[i];
			String original = nome.split(" ")[i];
			if (romanos.contains(original)) {
				w = original;
			}
			else if (i > 0 && minusculas.contains(w)) {
				// mantém minúscula
			}
			else if (!w.isEmpty()) {
				StringBuilder partes = new StringBuilder();
				for (String parte : w.split("-", -1)) {
					partes.append(partes.isEmpty() ? "" : "-").append(parte.isEmpty() ? parte
							: parte.substring(0, 1).toUpperCase(java.util.Locale.forLanguageTag("pt-BR")) + parte.substring(1));
				}
				w = partes.toString();
			}
			sb.append(i == 0 ? "" : " ").append(w);
		}
		return sb.toString();
	}

}
