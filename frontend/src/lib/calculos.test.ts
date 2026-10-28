import { test } from "node:test";
import assert from "node:assert/strict";
import {
  contarBibliografiasAntigas,
  extremosDaBibliografia,
  larguraDaSimilaridade,
  posicaoNoEixo,
  segmentos,
} from "./calculos.ts";
import type { IdadeBibliografia } from "./api";

function bib(over: Partial<IdadeBibliografia> = {}): IdadeBibliografia {
  return {
    codigo: "X",
    nome: "X",
    referencias: 8,
    comAno: 8,
    mediana: 2008,
    maisAntiga: 2000,
    maisRecente: 2010,
    fracaoComMaisDe10Anos: 1,
    ...over,
  };
}

test("segmentos divide a barra em lacunas, parciais e cobertas", () => {
  const s = segmentos({ lacuna: 50, parcial: 32, coberta: 20, naoDocumentada: 0 }, 20);
  assert.equal(s.length, 20);
  assert.deepEqual(
    [s.filter((x) => x === "lacuna").length, s.filter((x) => x === "parcial").length, s.filter((x) => x === "coberta").length],
    [10, 6, 4],
  );
  assert.equal(s[0], "lacuna");
  assert.equal(s[19], "coberta");
});

test("segmentos põe as não documentadas no fim, depois das cobertas", () => {
  const s = segmentos({ lacuna: 5, parcial: 5, coberta: 5, naoDocumentada: 5 }, 8);
  assert.deepEqual(s, ["lacuna", "lacuna", "parcial", "parcial", "coberta", "coberta", "naoDocumentada", "naoDocumentada"]);
});

test("segmentos com contagem zerada fica todo vazio", () => {
  assert.deepEqual(segmentos({ lacuna: 0, parcial: 0, coberta: 0, naoDocumentada: 0 }, 4), ["vazio", "vazio", "vazio", "vazio"]);
});

test("segmentos nunca passa de n quando o arredondamento soma demais", () => {
  assert.equal(segmentos({ lacuna: 1, parcial: 1, coberta: 0, naoDocumentada: 0 }, 3).length, 3);
});

test("contarBibliografiasAntigas conta metade ou mais acima de 10 anos e ignora sem ano", () => {
  assert.equal(contarBibliografiasAntigas([
    bib({ fracaoComMaisDe10Anos: 0.5 }), bib({ fracaoComMaisDe10Anos: 0.49 }),
    bib({ comAno: 0, fracaoComMaisDe10Anos: 0, mediana: null, maisAntiga: null, maisRecente: null }),
  ]), 1);
});

test("extremosDaBibliografia ignora componentes sem referência datada", () => {
  assert.deepEqual(extremosDaBibliografia([
    bib({ maisAntiga: 1964, maisRecente: 2011 }), bib({ maisAntiga: 1999, maisRecente: 2023 }),
    bib({ comAno: 0, mediana: null, maisAntiga: null, maisRecente: null }),
  ]), { maisAntiga: 1964, maisRecente: 2023 });
  assert.equal(extremosDaBibliografia([bib({ comAno: 0, mediana: null, maisAntiga: null, maisRecente: null })]), null);
});

test("posicaoNoEixo é percentual com uma casa e limitado ao eixo", () => {
  assert.equal(posicaoNoEixo(2008, 1960, 2026), 72.7);
  assert.equal(posicaoNoEixo(2016, 1960, 2026), 84.8);
  assert.equal(posicaoNoEixo(1955, 1960, 2026), 0);
  assert.equal(posicaoNoEixo(2030, 1960, 2026), 100);
});

test("larguraDaSimilaridade mapeia 0,80–0,92 para 0–100", () => {
  assert.equal(larguraDaSimilaridade(0.879), 66);
  assert.equal(larguraDaSimilaridade(0.75), 0);
  assert.equal(larguraDaSimilaridade(0.95), 100);
});
