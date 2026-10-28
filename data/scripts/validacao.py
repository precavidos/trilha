"""Validação da análise com rótulos humanos (docs/PLANO.md, "Replanejamento de 27/10").

1) Gerar a amostra (uma vez):
    python -I data/scripts/validacao.py amostra

   Cria docs/validacao/rotulos.csv (o que os avaliadores preenchem, SEM a situação do sistema)
   e docs/validacao/gabarito-sistema.csv (a situação calculada, para comparar depois).

2) Cada integrante preenche a sua coluna em rotulos.csv (avaliador_1, avaliador_2, avaliador_3)
   com: sim | parcial | nao — "a ementa contempla esta competência?". Sem conversar entre si.
   Funciona com 2 ou 3 avaliadores (kappa de Cohen ou de Fleiss).

3) Calcular os resultados:
    python -I data/scripts/validacao.py avaliar

   Escreve docs/validacao/resultado.md com concordância (kappa de Fleiss) e acerto do sistema.

Revalidação (ADR 0011: programas de disciplina e tecnologias nomeadas). Os rótulos da primeira rodada
continuam valendo para os pares (competência, componente) que não mudaram; só os pares novos vão aos
avaliadores, em docs/validacao/revalidacao/:
    python -I data/scripts/validacao.py revalidacao          # gera a planilha dos pares novos (uma vez)
    python -I data/scripts/validacao.py avaliar-revalidacao  # junta as duas rodadas e escreve o resultado
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
    # Tecnologias nomeadas: a situação vem da citação do nome (ADR 0011).
    if c.get("citacao"):
        return {"forte": "COBERTA", "fraca": "PARCIAL"}.get(c["citacao"]["nivel"], "NAO_DOCUMENTADA")
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


def cohen_kappa(pares: list[tuple[str, str]]) -> float:
    n = len(pares)
    concordancia = sum(1 for a, b in pares if a == b) / n
    ca, cb = Counter(a for a, _ in pares), Counter(b for _, b in pares)
    acaso = sum((ca[c] / n) * (cb[c] / n) for c in CATEGORIAS)
    return (concordancia - acaso) / (1 - acaso) if acaso < 1 else 1.0


def avaliar() -> None:
    existentes = set(json.loads(ANALISE.read_text(encoding="utf-8"))["competencias"])
    with GABARITO.open(encoding="utf-8-sig") as f:
        gabarito = {int(r["n"]): r for r in csv.DictReader(f)}
    # Itens removidos na curadoria da Extensão IA saem do cálculo (ex.: ia-15).
    removidos = sorted(n for n, r in gabarito.items() if r["id_competencia"] not in existentes)
    sistema = {n: r["situacao_sistema"] for n, r in gabarito.items() if n not in removidos}

    with ROTULOS.open(encoding="utf-8-sig") as f:
        linhas = [r for r in csv.DictReader(f) if int(r["n"]) in sistema]
    # Um avaliador conta quando preencheu todas as linhas válidas.
    ativos = [a for a in AVALIADORES if all(r[a].strip().lower() in CATEGORIAS for r in linhas)]
    if len(ativos) < 2:
        sys.exit(f"São necessários pelo menos 2 avaliadores com todas as linhas preenchidas; completos: {ativos or 'nenhum'}.")
    rotulos = {int(r["n"]): [r[a].strip().lower() for a in ativos] for r in linhas}

    if len(ativos) == 2:
        kappa_nome = "kappa de Cohen, 2 avaliadores"
        kappa = cohen_kappa([(a, b) for a, b in rotulos.values()])
    else:
        kappa_nome = f"kappa de Fleiss, {len(ativos)} avaliadores"
        kappa = fleiss_kappa(list(rotulos.values()))

    # Referência: rótulo com maioria; sem maioria (divergência) conta como parcial.
    referencia = {}
    for n, r in rotulos.items():
        rotulo, votos = Counter(r).most_common(1)[0]
        referencia[n] = rotulo if votos > len(r) / 2 else "parcial"

    equivalente = {"COBERTA": "sim", "PARCIAL": "parcial", "LACUNA": "nao"}
    acertos = sum(1 for n in referencia if equivalente[sistema[n]] == referencia[n])
    tabela = []
    for s in ("COBERTA", "PARCIAL", "LACUNA"):
        ns = [n for n in referencia if sistema[n] == s]
        dist = Counter(referencia[n] for n in ns)
        tabela.append(f"| {s} | {len(ns)} | {dist['sim']} | {dist['parcial']} | {dist['nao']} |")
    cobertas = [n for n in referencia if sistema[n] == "COBERTA"]
    lacunas = [n for n in referencia if sistema[n] == "LACUNA"]
    prec_cob = sum(1 for n in cobertas if referencia[n] in ("sim", "parcial")) / len(cobertas) if cobertas else 0
    prec_lac = sum(1 for n in lacunas if referencia[n] == "nao") / len(lacunas) if lacunas else 0

    RESULTADO.write_text(chr(10).join([
        "# Resultado da validação",
        "",
        f"- Julgamentos avaliados: **{len(referencia)}**"
        + (f" (excluídos por curadoria da Extensão IA: linha(s) {', '.join(map(str, removidos))})" if removidos else ""),
        f"- Avaliadores: **{len(ativos)}** ({', '.join(ativos)})",
        f"- Concordância entre avaliadores ({kappa_nome}, 3 categorias): **{kappa:.2f}**",
        f"- Acerto exato do sistema contra a referência (3 categorias): **{acertos / len(referencia):.0%}**",
        f"- Precisão de COBERTA (referência diz sim ou parcial): **{prec_cob:.0%}**",
        f"- Precisão de LACUNA (referência diz não): **{prec_lac:.0%}**",
        "",
        "| Situação do sistema | n | Referência: sim | parcial | não |",
        "|---|---|---|---|---|",
        *tabela,
        "",
        "Os rótulos são dos próprios integrantes da equipe, atribuídos sem conhecer a situação calculada. "
        "A referência é o rótulo da maioria dos avaliadores; quando não há maioria, conta como parcial.",
        "",
    ]), encoding="utf-8")
    print(RESULTADO.read_text(encoding="utf-8"))


REVALIDACAO = PASTA / "revalidacao"
ROTULOS_REV = REVALIDACAO / "rotulos.csv"
GABARITO_REV = REVALIDACAO / "gabarito-sistema.csv"
RESULTADO_REV = REVALIDACAO / "resultado.md"


def par_avaliado(c: dict) -> tuple[str, str | None]:
    """O componente que sustenta a situação e, para tecnologias citadas, onde o nome aparece."""
    ci = c.get("citacao")
    if ci and ci["componentes"]:
        x = ci["componentes"][0]
        return x["codigo"], f'{x["onde"]}: "{x["termo"]}"'
    return c["proximos"][0]["codigo"], None


def revalidacao() -> None:
    """Pares que a primeira rodada não julgou: tecnologias citadas e competências cuja ementa mais
    próxima passou a ser uma das vindas dos programas de disciplina."""
    analise = json.loads(ANALISE.read_text(encoding="utf-8"))
    componentes = {c["codigo"]: c for c in analise["componentes"]}
    exigidas = {e["competencia"] for p in analise["profissoes"] for e in p["competencias"]}
    with ROTULOS.open(encoding="utf-8-sig") as f:
        rotulados = {(r["competencia"], r["componente"].split()[0]) for r in csv.DictReader(f)}
    novos = []
    for cid in sorted(exigidas):
        c = analise["competencias"][cid]
        s = situacao(c)
        codigo, onde = par_avaliado(c)
        if s == "NAO_DOCUMENTADA" or (c["rotulo"], codigo) in rotulados:
            continue  # não documentada não afirma cobertura; par já rotulado vale da primeira rodada
        ementa_nova = componentes[codigo].get("fonteEmenta") == "programa"
        if onde is not None or (ementa_nova and s != "LACUNA"):
            novos.append((cid, c, s, codigo, onde))
    random.Random(SEMENTE).shuffle(novos)
    REVALIDACAO.mkdir(parents=True, exist_ok=True)
    with ROTULOS_REV.open("w", newline="", encoding="utf-8-sig") as f, \
            GABARITO_REV.open("w", newline="", encoding="utf-8-sig") as g:
        w = csv.writer(f)
        w.writerow(["n", "competencia", "descricao_da_competencia", "componente", "ementa", "onde_o_nome_aparece",
                    *AVALIADORES[:2]])
        wg = csv.writer(g)
        wg.writerow(["n", "id_competencia", "situacao_sistema", "componente"])
        for n, (cid, c, s, codigo, onde) in enumerate(novos, 1):
            comp = componentes[codigo]
            w.writerow([n, c["rotulo"], c["descricao"], f'{codigo} {comp["nome"]}', comp["ementa"], onde or "", "", ""])
            wg.writerow([n, cid, s, codigo])
    print(f"{len(novos)} pares novos → {ROTULOS_REV.relative_to(RAIZ)}", file=sys.stderr)


def avaliar_revalidacao() -> None:
    comps = json.loads(ANALISE.read_text(encoding="utf-8"))["competencias"]
    julgamentos = []  # (situação atual do sistema, [rótulo do avaliador 1, do avaliador 2], rodada)
    with GABARITO.open(encoding="utf-8-sig") as f:
        gab1 = {r["n"]: r for r in csv.DictReader(f)}
    with ROTULOS.open(encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            cid = gab1[r["n"]]["id_competencia"]
            if cid not in comps:
                continue  # removida na curadoria da Extensão IA
            c = comps[cid]
            if situacao(c) != "NAO_DOCUMENTADA" and par_avaliado(c)[0] != r["componente"].split()[0]:
                continue  # o par mudou: o rótulo antigo não julga a situação atual
            julgamentos.append((situacao(c), [r[a].strip().lower() for a in AVALIADORES[:2]], 1))
    with GABARITO_REV.open(encoding="utf-8-sig") as f:
        gab2 = {r["n"]: r for r in csv.DictReader(f)}
    with ROTULOS_REV.open(encoding="utf-8-sig") as f:
        linhas2 = list(csv.DictReader(f))
    if not all(r[a].strip().lower() in CATEGORIAS for r in linhas2 for a in AVALIADORES[:2]):
        sys.exit("Os dois avaliadores precisam preencher todas as linhas de revalidacao/rotulos.csv.")
    for r in linhas2:
        julgamentos.append((gab2[r["n"]]["situacao_sistema"], [r[a].strip().lower() for a in AVALIADORES[:2]], 2))

    def referencia(r: list[str]) -> str:
        return r[0] if r[0] == r[1] else "parcial"

    kappa_novos = cohen_kappa([(r[0], r[1]) for _, r, rodada in julgamentos if rodada == 2])
    afirmam = [(s, referencia(r)) for s, r, _ in julgamentos if s != "NAO_DOCUMENTADA"]
    nao_doc = Counter(referencia(r) for s, r, _ in julgamentos if s == "NAO_DOCUMENTADA")
    equivalente = {"COBERTA": "sim", "PARCIAL": "parcial", "LACUNA": "nao"}

    def precisao(sit: str, ok: tuple[str, ...]) -> tuple[float, int]:
        xs = [ref for s, ref in afirmam if s == sit]
        return (sum(1 for x in xs if x in ok) / len(xs) if xs else 0), len(xs)

    pc, nc = precisao("COBERTA", ("sim", "parcial"))
    pl, nl = precisao("LACUNA", ("nao",))
    acerto = sum(1 for s, ref in afirmam if equivalente[s] == ref) / len(afirmam)
    tabela = []
    for s in ("COBERTA", "PARCIAL", "LACUNA"):
        dist = Counter(ref for x, ref in afirmam if x == s)
        tabela.append(f"| {s} | {sum(dist.values())} | {dist['sim']} | {dist['parcial']} | {dist['nao']} |")
    rodada1 = sum(1 for *_, r in julgamentos if r == 1)
    RESULTADO_REV.write_text(chr(10).join([
        "# Resultado da revalidação (ADR 0011)",
        "",
        f"- Julgamentos: **{len(julgamentos)}** ({rodada1} da primeira rodada, cujo par não mudou, e {len(linhas2)} pares novos)",
        f"- Concordância entre os 2 avaliadores nos pares novos (kappa de Cohen): **{kappa_novos:.2f}**",
        f"- Acerto exato do sistema (3 categorias, sem as não documentadas): **{acerto:.0%}**",
        f"- Precisão de COBERTA (referência diz sim ou parcial): **{pc:.0%}** (n = {nc})",
        f"- Precisão de LACUNA (referência diz não): **{pl:.0%}** (n = {nl})",
        f"- Não documentadas: {sum(nao_doc.values())}; referência diz não em {nao_doc['nao']}, "
        f"parcial em {nao_doc['parcial']}, sim em {nao_doc['sim']}",
        "",
        "| Situação do sistema | n | Referência: sim | parcial | não |",
        "|---|---|---|---|---|",
        *tabela,
        "",
        "Referência: o rótulo em que os dois avaliadores concordam; quando divergem, conta como parcial. "
        "\"Não documentada\" não afirma cobertura nem ausência e fica fora das precisões.",
        "",
    ]), encoding="utf-8")
    print(RESULTADO_REV.read_text(encoding="utf-8"))


if __name__ == "__main__":
    {"amostra": amostra, "avaliar": avaliar, "revalidacao": revalidacao,
     "avaliar-revalidacao": avaliar_revalidacao}[sys.argv[1] if len(sys.argv) > 1 else "amostra"]()
