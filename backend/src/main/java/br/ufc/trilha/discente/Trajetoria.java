package br.ufc.trilha.discente;

import java.util.List;
import java.util.Map;

/**
 * O que o Trilha guarda de um histórico (ADR 0003): a estrutura curricular, os componentes cursados e as
 * cargas horárias. Nada de nome, matrícula, notas, frequência, turma ou nomes de docentes. {@code turno}:
 * diurno | noturno, ou {@code null} quando o histórico não o informa.
 */
public record Trajetoria(String estrutura, String turno, List<Cursado> componentes, Map<String, Carga> cargas,
		List<String> obrigatoriosPendentes) {

	/** {@code situacao}: aprovado | matriculado | reprovado | trancado | outro. {@code marcador}: legenda do SIGAA (* optativo, @ atividade, e equivalente…). */
	public record Cursado(String codigo, String periodo, String situacao, Integer ch, String marcador) {
	}

	/** Uma linha da tabela "Exigido / Integralizado / Pendente" do histórico. */
	public record Carga(int exigido, int integralizado, int pendente) {
	}

}
