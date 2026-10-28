package br.ufc.trilha.ia;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import br.ufc.trilha.analise.AnaliseService;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatModel;

/**
 * Redige a justificativa de uma classificação (RAG): o LLM recebe apenas a competência e os trechos de
 * ementa já recuperados, e deve citá-los. Ele não decide a classificação (ADR 0002) e nunca recebe dado
 * pessoal (ADR 0003) — só conteúdo institucional público.
 */
@Service
public class JustificativaService {

	private static final Logger log = LoggerFactory.getLogger(JustificativaService.class);

	static final String INSTRUCOES = """
			Você apoia a coordenação de um curso universitário na revisão do Projeto Pedagógico de Curso (PPC).
			Recebe uma competência profissional, a classificação de cobertura calculada pelo sistema
			(COBERTA, PARCIAL, LACUNA ou NAO_DOCUMENTADA) e as ementas mais próximas encontradas no PPC.
			Escreva em português do Brasil, em no máximo 120 palavras:
			1. Por que a classificação faz sentido (ou onde ela pode estar errada), citando cada ementa pelo código entre colchetes, ex.: [SMD0108].
			2. Uma sugestão concreta para o NDE (ex.: atualizar a ementa X, incluir o tópico Y).
			Regras: use somente as ementas fornecidas; não invente componentes, códigos ou conteúdos;
			se as ementas não permitirem conclusão, diga isso. Não use markdown.""";

	public record Justificativa(String texto, List<String> citados, String modelo, String geradaEm, boolean degradada) {
	}

	private final ChatModel modelo;
	private final LlmConfig.ModeloEmUso emUso;
	private final AnaliseService analise;
	private final Map<String, Justificativa> cache = new ConcurrentHashMap<>();

	JustificativaService(ChatModel modelo, LlmConfig.ModeloEmUso emUso, AnaliseService analise) {
		this.modelo = modelo;
		this.emUso = emUso;
		this.analise = analise;
	}

	/** "provedor:modelo" do LLM configurado, para a página de transparência. */
	public String modeloDeLinguagem() {
		return emUso.provedor() + ":" + emUso.modelo();
	}

	public Justificativa justificar(String competenciaId) {
		Justificativa pronta = cache.get(competenciaId);
		if (pronta != null) {
			return pronta;
		}
		Justificativa nova = gerar(competenciaId);
		if (!nova.degradada()) {
			cache.put(competenciaId, nova); // falhas não ficam em cache: a próxima tentativa chama o LLM de novo
		}
		return nova;
	}

	private Justificativa gerar(String competenciaId) {
		AnaliseService.Item item = analise.competencia(competenciaId);
		String pergunta = prompt(item);
		try {
			String texto = modelo.chat(SystemMessage.from(INSTRUCOES), UserMessage.from(pergunta)).aiMessage().text();
			List<String> citados = item.evidencias().stream().map(AnaliseService.Evidencia::codigo)
				.filter(c -> texto.contains(c)).toList();
			return new Justificativa(texto.strip(), citados, emUso.provedor() + ":" + emUso.modelo(),
					Instant.now().toString(), false);
		}
		catch (RuntimeException e) {
			log.warn("LLM indisponível ao justificar {}: {}", competenciaId, e.getMessage());
			// Degrada para as evidências em si: a classificação não depende do LLM (ADR 0002).
			String texto = "Justificativa em linguagem natural indisponível no momento. Evidências: "
					+ item.evidencias().stream()
						.map(ev -> ev.codigo() + " " + ev.nome() + " (similaridade " + ev.similaridade() + ")")
						.collect(Collectors.joining("; "))
					+ ".";
			return new Justificativa(texto, List.of(), "nenhum", Instant.now().toString(), true);
		}
	}

	static String prompt(AnaliseService.Item item) {
		StringBuilder sb = new StringBuilder();
		sb.append("Competência: ").append(item.rotulo()).append(" (fonte: ").append(item.fonte()).append(")\n");
		sb.append("Descrição: ").append(item.descricao()).append('\n');
		sb.append("Classificação calculada: ").append(item.status()).append('\n');
		if ("citacao".equals(item.criterio())) {
			sb.append("Critério: tecnologia nomeada. A classificação vem de o nome aparecer na ementa, nos objetivos ou "
					+ "no conteúdo (coberta), só na bibliografia básica (parcial) ou em nenhum lugar do PPC e dos "
					+ "programas de disciplina (não documentada: pode ser ensinada sem estar registrada, porque o "
					+ "professor escolhe as ferramentas a cada semestre); a similaridade não conta.\n");
		}
		sb.append(item.evidencias().stream().anyMatch(ev -> ev.citadaEm() != null) ? "Onde o nome aparece:\n"
				: "Ementas mais próximas no PPC:\n");
		for (var ev : item.evidencias()) {
			sb.append("[").append(ev.codigo()).append("] ").append(ev.nome());
			if (ev.citadaEm() != null) {
				sb.append(" (").append(ev.citadaEm()).append(')');
			}
			sb.append(" (similaridade ").append(ev.similaridade()).append("): ").append(ev.ementa()).append('\n');
		}
		return sb.toString();
	}

}
