package br.ufc.trilha.discente;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import br.ufc.trilha.ppc.LeitorPdf;
import br.ufc.trilha.ppc.LinhaPdf;

/**
 * Lê o histórico escolar emitido pelo SIGAA/UFC e devolve só a {@link Trajetoria} (ADR 0003). O PDF é
 * processado em memória; o parser só reconhece período, situação+código, frequência/nota/carga e a tabela
 * de cargas horárias — todo o resto (cabeçalho pessoal, nomes de componentes e de docentes) é ignorado,
 * e nota e frequência são descartadas logo após a leitura.
 */
public final class LeitorHistorico {

	private static final Pattern CURRICULO = Pattern.compile("Curr[ií]culo:\\s*(\\d{4}\\.\\d)");
	private static final Pattern TURNO = Pattern.compile("Turno:\\s*(.*)");
	private static final Pattern PERIODO = Pattern.compile("\\d{4}\\.\\d");
	/**
	 * Situação colada ao código ("APROVADO MÉDIASMD0088", "REPROVADO POR NOTASMD0095"). Os complementos
	 * da situação vêm de um vocabulário fechado: com um padrão genérico, "NOTASMD0095" viraria o código
	 * "TASMD0095".
	 */
	private static final Pattern SITUACAO_CODIGO = Pattern.compile(
			"((?:APROVADO|REPROVADO)(?: (?:MÉDIA|POR|NOTA|FALTA|FALTAS|E))*|MATRICULADO|TRANCADO|CUMPRIU|DISPENSADO|APROVEITADO|INCORPORADO|CANCELADO|DESISTÊNCIA)\\s*([A-Z]{2,5}\\d{3,4})");
	/** Frequência, nota (+ marcador da legenda) e carga horária, que o SIGAA às vezes cola: "9.364.00" = 9.3 e 64.00. */
	private static final Pattern NUMEROS = Pattern.compile(
			"(\\d{1,3}\\.\\d{2}|--)\\s+(\\d{1,2}\\.\\d|--)([*#&@§e])?\\s*(\\d{1,3}\\.\\d{2})");
	private static final Pattern PREFIXO_NUMERICO = Pattern.compile("[\\d.\\-\\s*#&@§e]+");
	private static final Pattern INTEIRO = Pattern.compile("\\d+");
	private static final Pattern CODIGO_INICIO = Pattern.compile("^([A-Z]{2,5}G?\\d{3,4})\\s");
	private static final Map<String, String> CARGAS = new LinkedHashMap<>();

	static {
		CARGAS.put("Carga Horária de Atividades Complementares", "atividadesComplementares");
		CARGAS.put("Carga Horária de Componentes Optativos Livres", "optativosLivres");
		CARGAS.put("Carga Horária de TCC", "tcc");
		CARGAS.put("Carga Horária de Estágio", "estagio");
		CARGAS.put("Carga Horária de Extensão", "extensao");
		CARGAS.put("Carga Horária Total", "total");
		CARGAS.put("Carga Horária Optativa", "optativa");
	}

	private LeitorHistorico() {
	}

	public static Trajetoria ler(byte[] pdf) throws IOException {
		return ler(LeitorPdf.ler(pdf));
	}

	static Trajetoria ler(List<LinhaPdf> linhas) {
		String estrutura = null;
		String turno = null;
		String periodo = null;
		List<Trajetoria.Cursado> cursados = new ArrayList<>();
		Map<String, Trajetoria.Carga> cargas = new LinkedHashMap<>();
		List<String> pendentes = new ArrayList<>();
		boolean emPendentes = false;

		for (int i = 0; i < linhas.size(); i++) {
			String t = linhas.get(i).texto();
			Matcher m;
			if (estrutura == null && (m = CURRICULO.matcher(t)).find()) {
				estrutura = m.group(1);
				continue;
			}
			if (turno == null && (m = TURNO.matcher(t)).find()) {
				String valor = m.group(1).isBlank() && i + 1 < linhas.size() ? linhas.get(i + 1).texto() : m.group(1);
				turno = turno(valor);
				continue;
			}
			if (PERIODO.matcher(t).matches()) {
				periodo = t;
				continue;
			}
			if ((m = SITUACAO_CODIGO.matcher(t)).matches()) {
				cursados.add(componente(m.group(2), periodo, m.group(1), numerosSeguintes(linhas, i)));
				continue;
			}
			if (t.startsWith("Componentes Curriculares Obrigatórios Pendentes")) {
				emPendentes = true;
				continue;
			}
			if (emPendentes) {
				if ((m = CODIGO_INICIO.matcher(t)).find()) {
					pendentes.add(m.group(1));
					continue;
				}
				if (t.startsWith("Exigido")) {
					emPendentes = false;
				}
			}
			String chave = CARGAS.get(t);
			if (chave != null) {
				List<Integer> valores = new ArrayList<>();
				for (int j = i + 1; j < linhas.size() && valores.size() < 4; j++) {
					String v = linhas.get(j).texto();
					if (!INTEIRO.matcher(v).matches()) {
						break;
					}
					valores.add(Integer.valueOf(v));
				}
				if (valores.size() == 4) {
					cargas.put(chave, new Trajetoria.Carga(valores.get(0), valores.get(1), valores.get(3)));
				}
			}
		}
		if (estrutura == null) {
			throw new HistoricoInvalidoException("não encontrei a estrutura curricular (\"Currículo:\") — é um histórico do SIGAA/UFC?");
		}
		if (cursados.isEmpty()) {
			throw new HistoricoInvalidoException("não encontrei componentes cursados no histórico");
		}
		return new Trajetoria(estrutura, turno, List.copyOf(cursados), cargas, List.copyOf(pendentes));
	}

	/**
	 * Junta os trechos numéricos que seguem a situação (até três), onde estão frequência, nota e carga
	 * horária. Quando o nome do docente é longo, o PDF cola a carga horária no começo desse trecho
	 * ("9.764.00Docente(s): …"): aproveita-se só o prefixo numérico, e o resto é descartado.
	 */
	private static String numerosSeguintes(List<LinhaPdf> linhas, int i) {
		StringBuilder sb = new StringBuilder();
		for (int j = i + 1, lidos = 0; j < linhas.size() && lidos < 3; j++) {
			String t = linhas.get(j).texto();
			if (SITUACAO_CODIGO.matcher(t).matches() || PERIODO.matcher(t).matches()) {
				break;
			}
			Matcher prefixo = PREFIXO_NUMERICO.matcher(t);
			if (prefixo.lookingAt() && !prefixo.group().isBlank()) {
				sb.append(' ').append(prefixo.group());
				lidos++;
				if (prefixo.end() < t.length()) {
					break; // o restante da linha é o nome do docente
				}
			}
			else if (lidos > 0) {
				break;
			}
		}
		return sb.toString().strip();
	}

	private static Trajetoria.Cursado componente(String codigo, String periodo, String situacaoSigaa, String numeros) {
		Integer ch = null;
		String marcador = null;
		Matcher n = NUMEROS.matcher(numeros);
		if (n.find()) {
			// Frequência (grupo 1) e nota (grupo 2) não são guardadas.
			marcador = n.group(3);
			ch = (int) Math.round(Double.parseDouble(n.group(4)));
		}
		return new Trajetoria.Cursado(codigo, periodo, situacao(situacaoSigaa), ch, marcador);
	}

	/** "MATUTINO E VESPERTINO" e afins → diurno; "NOTURNO" → noturno; outro texto → {@code null}. */
	static String turno(String sigaa) {
		String s = sigaa.toUpperCase();
		if (s.contains("NOTURNO")) {
			return "noturno";
		}
		if (s.contains("MATUTINO") || s.contains("VESPERTINO") || s.contains("DIURNO") || s.contains("INTEGRAL")) {
			return "diurno";
		}
		return null;
	}

	static String situacao(String sigaa) {
		if (sigaa.startsWith("APROVADO") || sigaa.equals("CUMPRIU") || sigaa.equals("DISPENSADO")
				|| sigaa.equals("APROVEITADO") || sigaa.equals("INCORPORADO")) {
			return "aprovado";
		}
		if (sigaa.equals("MATRICULADO")) {
			return "matriculado";
		}
		if (sigaa.startsWith("REPROVADO")) {
			return "reprovado";
		}
		if (sigaa.equals("TRANCADO")) {
			return "trancado";
		}
		return "outro";
	}

	/** O arquivo não parece um histórico do SIGAA/UFC. */
	public static class HistoricoInvalidoException extends RuntimeException {
		public HistoricoInvalidoException(String mensagem) {
			super(mensagem);
		}
	}

}
