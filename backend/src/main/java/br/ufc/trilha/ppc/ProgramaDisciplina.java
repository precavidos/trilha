package br.ufc.trilha.ppc;

import java.util.List;

/**
 * O que o Trilha aproveita de um formulário de criação/regulamentação de disciplina (PROGRAD/UFC): os
 * campos de conteúdo. Nomes de quem assinou, carimbos e atas ficam de fora; da assinatura, só a data.
 * Campos ausentes no formulário ficam {@code null}.
 */
public record ProgramaDisciplina(String codigo, String nome, String arquivo, String assinadoEm, List<String> curriculos,
		String objetivos, String competencias, String ementa, String conteudo, String bibliografiaBasica,
		String bibliografiaComplementar) {
}
