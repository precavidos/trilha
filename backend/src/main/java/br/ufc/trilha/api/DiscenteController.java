package br.ufc.trilha.api;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.ufc.trilha.discente.LeitorHistorico;
import br.ufc.trilha.discente.Recomendador;
import br.ufc.trilha.discente.Trajetoria;

/**
 * Módulo discente. O histórico é lido em memória e nunca é gravado; a resposta é só a trajetória
 * anonimizada (ADR 0003), que o navegador reenvia para pedir a recomendação.
 */
@RestController
@RequestMapping("/api/discente")
class DiscenteController {

	private static final long LIMITE_BYTES = 5 * 1024 * 1024;

	private final Recomendador recomendador;

	DiscenteController(Recomendador recomendador) {
		this.recomendador = recomendador;
	}

	@GetMapping("/estruturas")
	List<String> estruturas() {
		return recomendador.estruturasSuportadas();
	}

	@PostMapping("/historico")
	Trajetoria historico(@RequestParam("arquivo") MultipartFile arquivo) throws IOException {
		if (arquivo.isEmpty() || arquivo.getSize() > LIMITE_BYTES) {
			throw new IllegalArgumentException("envie o histórico em PDF, com até 5 MB");
		}
		try {
			return LeitorHistorico.ler(arquivo.getBytes());
		}
		catch (IOException e) {
			throw new IllegalArgumentException("não consegui ler o arquivo como PDF");
		}
	}

	record PedidoDeRecomendacao(Trajetoria trajetoria, List<String> profissoes) {
	}

	@PostMapping("/recomendacao")
	Recomendador.Recomendacao recomendacao(@RequestBody PedidoDeRecomendacao pedido) {
		if (pedido.trajetoria() == null || pedido.profissoes() == null) {
			throw new IllegalArgumentException("envie a trajetória e uma ou duas profissões-alvo");
		}
		return recomendador.recomendar(pedido.trajetoria(), pedido.profissoes());
	}

	@ExceptionHandler({ IllegalArgumentException.class, LeitorHistorico.HistoricoInvalidoException.class })
	@ResponseStatus(HttpStatus.UNPROCESSABLE_CONTENT)
	Map<String, String> invalido(RuntimeException e) {
		return Map.of("erro", e.getMessage());
	}

	@ExceptionHandler(NoSuchElementException.class)
	@ResponseStatus(HttpStatus.UNPROCESSABLE_CONTENT)
	Map<String, String> naoSuportado(NoSuchElementException e) {
		return Map.of("erro", e.getMessage());
	}

}
