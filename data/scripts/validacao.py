"""Validação da análise com rótulos humanos (docs/PLANO.md, "Replanejamento de 27/10").

1) Gerar a amostra (uma vez):
    python -I data/scripts/validacao.py amostra

   Cria docs/validacao/rotulos.csv (o que os avaliadores preenchem, SEM a situação do sistema)
   e docs/validacao/gabarito-sistema.csv (a situação calculada, para comparar depois).

2) Cada integrante preenche a sua coluna em rotulos.csv (avaliador_1, avaliador_2, avaliador_3)
   com: sim | parcial | nao — "a ementa contempla esta competência?". Sem conversar entre si.

3) Calcular os resultados:
    python -I data/scripts/validacao.py avaliar

   Escreve docs/validacao/resultado.md com concordância (kappa de Fleiss) e acerto do sistema.
"""

import csv
import json
import random
import sys
from collections import Counter
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
ANALISE = RAIZ / "data" / "analise" / "analise-smd-2024-2.json"
PASTA = RAIZ / "docs" / "validacao"
ROTULOS = PASTA / "rotulos.csv"
GABARITO = PASTA / "gabarito-sistema.csv"
RESULTADO = PASTA / "resultado.md"
AVALIADORES = ["avaliador_1", "avaliador_2", "avaliador_3"]
CATEGORIAS = ["sim", "parcial", "nao"]
POR_SITUACAO = 14  # 14 COBERTA + 14 PARCIAL + 14 LACUNA = 42 julgamentos
SEMENTE = 20261027

# Mesmos limiares de backend/src/main/resources/application.yml
COBERTA_SIM, COBERTA_ESC, PARCIAL_SIM, PARCIAL_ESC = 0.89, 2.8, 0.88, 2.4


def situacao(c: dict) -> str:
    sim = c["proximos"][0]["similaridade"]
    escore = (sim - c["media"]) / c["desvio"] if c["desvio"] else 0
    if sim >= COBERTA_SIM or escore >= COBERTA_ESC:
        return "COBERTA"
    if sim >= PARCIAL_SIM or escore >= PARCIAL_ESC:
        return "PARCIAL"
    return "LACUNA"


def amostra() -> None:
    analise = json.loads(ANALISE.read_text(encoding="utf-8"))
    componentes = {c["codigo"]: c for c in analise["componentes"]}
    exigidas = {e["competencia"] for p in analise["profissoes"] for e in p["competencias"]}
    por_situacao: dict[str, list] = {"COBERTA": [], "PARCIAL": [], "LACUNA": []}
    for cid, c in analise["competencias"].items():
        if cid in exigidas and c["proximos"]:
            por_situacao[situacao(c)].append((cid, c))

    rng = random.Random(SEMENTE)
    escolhidas = []
    for s, itens in por_situacao.items():
        ia = [x for x in itens if x[1]["fonte"] == "Extensão IA"]
        resto = [x for x in itens if x[1]["fonte"] != "Extensão IA"]
        # Garante a lente de IA na amostra sem deixá-la dominar.
        pegar_ia = rng.sample(ia, min(len(ia), 3))
        escolhidas += [(s, x) for x in pegar_ia + rng.sample(resto, POR_SITUACAO - len(pegar_ia))]
    rng.shuffle(escolhidas)

    PASTA.mkdir(parents=True, exist_ok=True)
    with ROTULOS.open("w", newline="", encoding="utf-8-sig") as f, \
            GABARITO.open("w", newline="", encoding="utf-8-sig") as g:
        w = csv.writer(f)
        w.writerow(["n", "competencia", "descricao_da_competencia", "componente", "ementa", *AVALIADORES])
        wg = csv.writer(g)
        wg.writerow(["n", "id_competencia", "situacao_sistema", "similaridade"])
        for n, (s, (cid, c)) in enumerate(escolhidas, 1):
            px = c["proximos"][0]
            comp = componentes[px["codigo"]]
            w.writerow([n, c["rotulo"], c["descricao"], f'{comp["codigo"]} {comp["nome"]}', comp["ementa"], "", "", ""])
            wg.writerow([n, cid, s, px["similaridade"]])
    print(f"{len(escolhidas)} julgamentos → {ROTULOS.relative_to(RAIZ)}", file=sys.stderr)


def fleiss_kappa(linhas: list[list[str]]) -> float:
    n = len(linhas[0])
    p_i, total = [], Counter()
    for rotulos in linhas:
        cont = Counter(rotulos)
        total.update(cont)
        p_i.append((sum(v * v for v in cont.values()) - n) / (n * (n - 1)))
    p_bar = sum(p_i) / len(p_i)
    p_e = sum((v / (len(linhas) * n)) ** 2 for v in total.values())
    return (p_bar - p_e) / (1 - p_e) if p_e < 1 else 1.0


def avaliar() -> None:
    with ROTULOS.open(encoding="utf-8-sig") as f:
        rotulos = {int(r["n"]): [r[a].strip().lower() for a in AVALIADORES] for r in csv.DictReader(f)}
    with GABARITO.open(encoding="utf-8-sig") as f:
        sistema = {int(r["n"]): r["situacao_sistema"] for r in csv.DictReader(f)}

    completos = {n: r for n, r in rotulos.items() if all(x in CATEGORIAS for x in r)}
    faltando = len(rotulos) - len(completos)
    if not completos:
        sys.exit("Nenhuma linha com os três rótulos preenchidos (sim | parcial | nao).")

    kappa = fleiss_kappa(list(completos.values()))
    maioria = {}
    for n, r in completos.items():
        rotulo, votos = Counter(r).most_common(1)[0]
        maioria[n] = rotulo if votos >= 2 else "parcial"  # empate 1-1-1 conta como parcial

    equivalente = {"COBERTA": "sim", "PARCIAL": "parcial", "LACUNA": "nao"}
    acertos = sum(1 for n in maioria if equivalente[sistema[n]] == maioria[n])
    linhas = []
    for s in ("COBERTA", "PARCIAL", "LACUNA"):
        ns = [n for n in maioria if sistema[n] == s]
        dist = Counter(maioria[n] for n in ns)
        linhas.append(f"| {s} | {len(ns)} | {dist['sim']} | {dist['parcial']} | {dist['nao']} |")
    cobertas = [n for n in maioria if sistema[n] == "COBERTA"]
    lacunas = [n for n in maioria if sistema[n] == "LACUNA"]
    prec_cob = sum(1 for n in cobertas if maioria[n] in ("sim", "parcial")) / len(cobertas) if cobertas else 0
    prec_lac = sum(1 for n in lacunas if maioria[n] == "nao") / len(lacunas) if lacunas else 0

    RESULTADO.write_text("\n".join([
        "# Resultado da validação",
        "",
        f"- Julgamentos com os três rótulos: **{len(completos)}**" + (f" ({faltando} incompletos ignorados)" if faltando else ""),
        f"- Concordância entre avaliadores (kappa de Fleiss, 3 categorias): **{kappa:.2f}**",
        f"- Acerto exato do sistema contra a maioria (3 categorias): **{acertos / len(maioria):.0%}**",
        f"- Precisão de COBERTA (humanos dizem sim ou parcial): **{prec_cob:.0%}**",
        f"- Precisão de LACUNA (humanos dizem não): **{prec_lac:.0%}**",
        "",
        "| Situação do sistema | n | Maioria: sim | parcial | não |",
        "|---|---|---|---|---|",
        *linhas,
        "",
        "Os rótulos são dos próprios integrantes da equipe, sem conhecer a situação calculada; "
        "a maioria de votos é a referência (empate 1-1-1 conta como parcial).",
        "",
    ]), encoding="utf-8")
    print(RESULTADO.read_text(encoding="utf-8"))


if __name__ == "__main__":
    {"amostra": amostra, "avaliar": avaliar}[sys.argv[1] if len(sys.argv) > 1 else "amostra"]()
