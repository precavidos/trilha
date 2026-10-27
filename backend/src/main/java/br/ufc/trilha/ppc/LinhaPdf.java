package br.ufc.trilha.ppc;

/** Um trecho de texto contínuo do PDF, com a posição horizontal de seu primeiro caractere. */
public record LinhaPdf(int pagina, float x, String texto) {
}
