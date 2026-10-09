package br.ufc.trilha.ppc;

import java.util.regex.Pattern;

/** Uma referência bibliográfica de um componente, com o ano de publicação quando identificável. */
public record Referencia(String texto, Integer ano) {

	private static final Pattern ISBN = Pattern.compile("ISBN[:\\s]*[\\dXx\\-]+");
	private static final Pattern ACESSO = Pattern.compile("Acesso em:.*", Pattern.CASE_INSENSITIVE);
	private static final Pattern ANO = Pattern.compile("(?<!\\d)(19|20)\\d{2}(?!\\d)");

	public static Referencia de(String texto) {
		return new Referencia(texto, anoDePublicacao(texto));
	}

	/** O último ano plausível do texto, ignorando ISBN e data de acesso. */
	static Integer anoDePublicacao(String texto) {
		String limpo = ACESSO.matcher(ISBN.matcher(texto).replaceAll(" ")).replaceAll(" ");
		Integer ano = null;
		var m = ANO.matcher(limpo);
		while (m.find()) {
			ano = Integer.valueOf(m.group());
		}
		return ano;
	}

}
