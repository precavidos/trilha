package br.ufc.trilha.api;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.ufc.trilha.analise.Analise;
import br.ufc.trilha.analise.AnaliseService;
import br.ufc.trilha.analise.Cobertura;
import br.ufc.trilha.ia.JustificativaService;

@RestController
@RequestMapping("/api")
class ApiController {

	private final AnaliseService analise;
	private final JustificativaService justificativas;
	private final Cobertura cobertura;

	ApiController(AnaliseService analise, JustificativaService justificativas, Cobertura cobertura) {
		this.analise = analise;
		this.justificativas = justificativas;
		this.cobertura = cobertura;
	}

	@GetMapping("/resumo")
	AnaliseService.Resumo resumo() {
		return analise.resumo();
	}

	@GetMapping("/profissoes/{id}/lacunas")
	List<AnaliseService.Item> lacunas(@PathVariable String id) {
		return analise.lacunas(id);
	}

	@GetMapping("/lente-ia")
	List<AnaliseService.Item> lenteIa() {
		return analise.lenteIa();
	}

	@GetMapping("/bibliografia")
	List<Analise.IdadeBibliografia> bibliografia() {
		return analise.bibliografia();
	}

	/** Parâmetro, não caminho: IDs ESCO são URIs com barras. */
	@PostMapping("/justificativas")
	JustificativaService.Justificativa justificar(@RequestParam String competencia) {
		return justificativas.justificar(competencia);
	}

	/** Transparência: como os resultados foram produzidos. */
	@GetMapping("/sobre")
	Map<String, Object> sobre() {
		return Map.of("metadados", analise.metadados(), "limiares", cobertura, "modeloDeLinguagem",
				justificativas.modeloDeLinguagem());
	}

	@ExceptionHandler(NoSuchElementException.class)
	@ResponseStatus(HttpStatus.NOT_FOUND)
	Map<String, String> naoEncontrado(NoSuchElementException e) {
		return Map.of("erro", e.getMessage());
	}

}
