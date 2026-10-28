import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CH_PADRAO,
  alternarNoRascunho,
  extensaoPendente,
  filtrar,
  filtrosDisponiveis,
  passoAtual,
  somarRascunho,
} from "./discente.ts";
import type { ItemRecomendado, Recomendacao, Trajetoria } from "./api";

function item(over: Partial<ItemRecomendado> = {}): ItemRecomendado {
  return {
    codigo: "X0001",
    nome: "Componente",
    ch: 64,
    pontuacao: 1,
    codigoNoPpc: null,
    ementa: null,
    competencias: [],
    itinerarios: [],
    grupo: null,
    contaExtensao: false,
    preRequisitos: [],
    evidencias: [],
    contagem: { porProfissao: {}, total: 0, naoCobertas: 0 },
    notaEmenta: null,
    ...over,
  };
}

function rec(over: Partial<Recomendacao> = {}): Recomendacao {
  return {
    estrutura: "E",
    turno: "diurno",
    profissoes: ["Designer de UX/UI"],
    aprovados: 0,
    emCurso: 0,
    chOptativaPendente: null,
    componentesSugeridos: 0,
    avisos: [],
    itens: [],
    foraDasSugestoes: { lacunasEssenciais: [], naoDocumentadas: [] },
    ...over,
  };
}

function traj(cargas: Trajetoria["cargas"] = {}): Trajetoria {
  return { estrutura: "E", turno: "diurno", componentes: [], cargas, obrigatoriosPendentes: [] };
}

test("passoAtual segue o avanço do fluxo", () => {
  const t = traj();
  const r = rec();
  assert.equal(passoAtual({ trajetoria: null, recomendacao: null, rascunho: [] }), 0);
  assert.equal(passoAtual({ trajetoria: t, recomendacao: null, rascunho: [] }), 1);
  assert.equal(passoAtual({ trajetoria: t, recomendacao: r, rascunho: [] }), 2);
  assert.equal(passoAtual({ trajetoria: t, recomendacao: r, rascunho: [item()] }), 3);
  assert.equal(passoAtual({ trajetoria: t, recomendacao: null, rascunho: [item()] }), 1);
});

test("extensaoPendente só vale com carga pendente", () => {
  assert.equal(extensaoPendente(traj({})), false);
  assert.equal(extensaoPendente(traj({ extensao: { exigido: 128, integralizado: 128, pendente: 0 } })), false);
  assert.equal(extensaoPendente(traj({ extensao: { exigido: 128, integralizado: 0, pendente: 128 } })), true);
});

test("filtrar por profissão e por extensão", () => {
  const a = item({ codigo: "A", contagem: { porProfissao: { "Designer de UX/UI": 2, Outra: 0 }, total: 2, naoCobertas: 0 } });
  const b = item({ codigo: "B", contaExtensao: true, contagem: { porProfissao: { Outra: 1 }, total: 1, naoCobertas: 0 } });
  assert.deepEqual(filtrar([a, b], "profissao:Designer de UX/UI").map((i) => i.codigo), ["A"]);
  assert.deepEqual(filtrar([a, b], "profissao:Outra").map((i) => i.codigo), ["B"]);
  assert.deepEqual(filtrar([a, b], "extensao").map((i) => i.codigo), ["B"]);
  assert.equal(filtrar([a, b], "todas").length, 2);
});

test("filtrosDisponiveis lista rótulos e contagens", () => {
  const a = item({ codigo: "A", contagem: { porProfissao: { "Designer de UX/UI": 1 }, total: 1, naoCobertas: 0 } });
  const b = item({ codigo: "B", contaExtensao: true });
  const r = rec({ itens: [a, b] });
  const sem = filtrosDisponiveis(r, false);
  assert.ok(!sem.some((f) => f.valor === "extensao"));
  const com = filtrosDisponiveis(r, true);
  assert.deepEqual(com.map((f) => f.rotulo), ["Todas", "Para Designer de UX/UI", "Contam extensão"]);
  for (const f of com) assert.equal(f.contagem, filtrar(r.itens, f.valor).length);
});

test("alternarNoRascunho acrescenta e remove pelo código", () => {
  const a = item({ codigo: "A" });
  const um = alternarNoRascunho([], a);
  assert.deepEqual(um.map((i) => i.codigo), ["A"]);
  assert.deepEqual(alternarNoRascunho(um, item({ codigo: "A" })), []);
});

test("somarRascunho soma horas com a carga padrão e conta extensão", () => {
  const r = somarRascunho([
    item({ codigo: "A", ch: 64, contaExtensao: true }),
    item({ codigo: "B", ch: 64 }),
    item({ codigo: "C", ch: null }),
  ]);
  assert.equal(CH_PADRAO, 64);
  assert.deepEqual(r, { horas: 192, contamExtensao: 1 });
});
