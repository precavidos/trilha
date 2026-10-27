package br.ufc.trilha.ia;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.request.ChatRequest;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.ollama.OllamaChatModel;

/** Instancia o modelo de linguagem manualmente, sem starters (ADR 0005). */
@Configuration
class LlmConfig {

	record ModeloEmUso(String provedor, String modelo) {
	}

	@Bean
	ModeloEmUso modeloEmUso(@Value("${trilha.llm.provider}") String provedor,
			@Value("${trilha.llm.gemini.model}") String gemini, @Value("${trilha.llm.ollama.model}") String ollama) {
		return new ModeloEmUso(provedor, "ollama".equals(provedor) ? ollama : gemini);
	}

	@Bean
	ChatModel chatModel(ModeloEmUso uso, @Value("${trilha.llm.gemini.api-key}") String chave,
			@Value("${trilha.llm.ollama.base-url}") String ollamaUrl) {
		if ("ollama".equals(uso.provedor())) {
			return OllamaChatModel.builder().baseUrl(ollamaUrl).modelName(uso.modelo()).temperature(0.2)
				.timeout(Duration.ofSeconds(120)).build();
		}
		if (chave == null || chave.isBlank()) {
			// Sem chave (ex.: CI): o sistema funciona e as justificativas degradam para as evidências.
			return new ChatModel() {
				@Override
				public ChatResponse doChat(ChatRequest requisicao) {
					throw new IllegalStateException("GEMINI_API_KEY não configurada");
				}
			};
		}
		return GoogleAiGeminiChatModel.builder().apiKey(chave).modelName(uso.modelo()).temperature(0.2)
			.timeout(Duration.ofSeconds(60)).build();
	}

}
