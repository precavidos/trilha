package br.ufc.trilha.ppc;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;

/**
 * Lê um PDF como sequência de {@link LinhaPdf}, preservando a posição x de cada trecho.
 * A posição é o que permite separar as colunas "nome" e "texto" das tabelas do PPC.
 */
public final class LeitorPdf {

	/** Distância horizontal (pt) entre palavras acima da qual elas pertencem a colunas diferentes. */
	private static final float SALTO_DE_COLUNA = 40f;

	private LeitorPdf() {
	}

	private record Palavra(String texto, float inicio, float fim) {
	}

	public static List<LinhaPdf> ler(byte[] pdf) throws IOException {
		List<LinhaPdf> linhas = new ArrayList<>();
		try (var documento = Loader.loadPDF(pdf)) {
			var stripper = new PDFTextStripper() {
				private final List<Palavra> linhaAtual = new ArrayList<>();

				// O PDFBox entrega cada palavra separadamente; a linha fecha no separador de linha.
				@Override
				protected void writeString(String texto, List<TextPosition> posicoes) {
					if (!posicoes.isEmpty()) {
						TextPosition ultima = posicoes.getLast();
						linhaAtual.add(new Palavra(texto, posicoes.getFirst().getXDirAdj(),
								ultima.getXDirAdj() + ultima.getWidthDirAdj()));
					}
				}

				@Override
				protected void writeLineSeparator() throws IOException {
					fecharLinha();
					super.writeLineSeparator();
				}

				@Override
				protected void writePageEnd() throws IOException {
					fecharLinha();
					super.writePageEnd();
				}

				private void fecharLinha() {
					separarColunas(getCurrentPageNo(), linhaAtual, linhas);
					linhaAtual.clear();
				}
			};
			stripper.getText(documento);
		}
		return linhas;
	}

	private static void separarColunas(int pagina, List<Palavra> palavras, List<LinhaPdf> destino) {
		StringBuilder trecho = new StringBuilder();
		float inicio = 0;
		float fimAnterior = Float.NaN;
		for (Palavra p : palavras) {
			if (!Float.isNaN(fimAnterior) && p.inicio() - fimAnterior > SALTO_DE_COLUNA) {
				adicionar(pagina, inicio, trecho, destino);
				trecho.setLength(0);
			}
			if (trecho.isEmpty()) {
				inicio = p.inicio();
			}
			else {
				trecho.append(' ');
			}
			trecho.append(p.texto());
			fimAnterior = p.fim();
		}
		adicionar(pagina, inicio, trecho, destino);
	}

	private static void adicionar(int pagina, float x, StringBuilder trecho, List<LinhaPdf> destino) {
		// O PPC tem hifens suaves (U+00AD) invisíveis no meio das palavras e espaços não separáveis.
		String texto = trecho.toString().replace("­", "").replace(' ', ' ').strip();
		if (!texto.isEmpty()) {
			destino.add(new LinhaPdf(pagina, x, texto));
		}
	}

}
