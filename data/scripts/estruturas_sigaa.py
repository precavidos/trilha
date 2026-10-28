"""Converte estruturas curriculares exportadas do SIGAA (HTML) em JSON (ADR 0009).

Uso (só biblioteca padrão):
    python -I data/scripts/estruturas_sigaa.py

Lê data/private/fontes/sigaa-estrutura-smd-diurno-<versão>.html (fora do git; exportar no SIGAA com
Ctrl+S → "Página da Web, somente HTML") e escreve data/seed/estruturas/smd-diurno-<versão>.json.

Pré-requisitos e equivalências viram forma normal disjuntiva: uma lista de alternativas, cada uma com
os códigos exigidos em conjunto. "( A E B ) OU ( C )" → [["A", "B"], ["C"]].
"""

import html
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
FONTES = RAIZ / "data" / "private" / "fontes"
SAIDA = RAIZ / "data" / "seed" / "estruturas"
CODIGO = re.compile(r"[A-Z]{2,5}\d{3,4}")


class Linhas(HTMLParser):
    """Cada <tr> vira uma lista com o texto das células."""

    def __init__(self):
        super().__init__()
        self.linhas, self.linha, self.celula = [], None, None

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self.linha = []
        elif tag in ("td", "th") and self.linha is not None:
            self.celula = []
        elif tag == "br" and self.celula is not None:
            self.celula.append(" ")

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.celula is not None and self.linha is not None:
            self.linha.append(re.sub(r"\s+", " ", "".join(self.celula)).strip())
            self.celula = None
        elif tag == "tr" and self.linha is not None:
            if any(self.linha):
                self.linhas.append(self.linha)
            self.linha = None

    def handle_data(self, data):
        if self.celula is not None:
            self.celula.append(data)


def dnf(texto: str) -> list[list[str]]:
    """"( A E B ) OU ( C OU D )" → [["A","B"], ["C"], ["D"]]. "E" tem precedência sobre "OU"."""
    texto = texto.replace("(", " ").replace(")", " ")
    alternativas = []
    for parte in re.split(r"\bOU\b", texto):
        codigos = CODIGO.findall(parte)
        if codigos:
            alternativas.append(codigos)
    return alternativas


def numero(padrao: str, texto: str):
    m = re.search(padrao, texto)
    return int(m.group(1)) if m else None


def converter(versao: str) -> dict:
    fonte = FONTES / f"sigaa-estrutura-smd-diurno-{versao.replace('.', '-')}.html"
    bruto = fonte.read_bytes().decode("utf-8")
    texto = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", bruto)))
    p = Linhas()
    p.feed(bruto)

    componentes, grupos = [], []
    semestre, grupo = None, None
    for linha in p.linhas:
        primeira = linha[0]
        m_sem = re.fullmatch(r"(\d+)º Semestre", primeira)
        if m_sem:
            semestre, grupo = int(m_sem.group(1)), None
            continue
        if primeira == "Grupos de Componentes Específicos":
            semestre = None
            continue
        if len(linha) == 1 and re.fullmatch(r"[A-ZÀ-Ý0-9ºª ]{6,}", primeira) and not CODIGO.match(primeira):
            grupo = {"nome": primeira.title().replace("Do ", "do ").replace("De ", "de "), "componentes": [], "minimo": None, "maximo": None}
            grupos.append(grupo)
            continue
        if grupo is not None:
            m_membro = re.match(rf"({CODIGO.pattern}) - ", primeira)
            if m_membro and len(linha) == 1:
                grupo["componentes"].append(m_membro.group(1))
                continue
            if primeira.startswith("Qtd. de Componentes Mínima"):
                grupo["minimo"] = numero(r"(\d+) componentes", primeira)
                continue
            if primeira.startswith("Qtd. de Componentes Máxima"):
                grupo["maximo"] = numero(r"(\d+) componentes", primeira)
                continue
        if CODIGO.fullmatch(primeira) and len(linha) >= 7:
            nome_ch, ch_det, tipo, natureza, pre, equiv = linha[1:7]
            nome = re.sub(r"\s+-\s+\d+h\s.*$", "", nome_ch).strip()
            natureza_norm = "obrigatorio" if natureza.startswith("OBRIGAT") else "optativo"
            componentes.append({
                "codigo": primeira,
                "nome": nome,
                "ch": numero(r"-\s+(\d+)h", nome_ch),
                "chExtensao": numero(r"(\d+)h ext\.", ch_det) or 0,
                "tipo": tipo.lower(),
                "natureza": natureza_norm,
                "semestre": semestre if natureza_norm == "obrigatorio" else None,
                "preRequisitos": dnf(pre),
                "equivalencias": dnf(equiv),
            })

    vistos, unicos = set(), []
    for c in componentes:  # o SIGAA pode repetir um componente em seções diferentes
        if c["codigo"] not in vistos:
            vistos.add(c["codigo"])
            unicos.append(c)

    return {
        "fonte": f"SIGAA/UFC — estrutura curricular {versao} do curso de Sistemas e Mídias Digitais (Diurno)",
        "codigo": versao,
        "chTotalMinima": numero(r"Total M[ií]nima (\d+)", texto),
        "chObrigatoria": numero(r"Carga Hor[áa]ria Obrigat[óo]ria: (\d+)h", texto),
        "chOptativaMinima": numero(r"Carga Hor[áa]ria Optativa Minima: (\d+)", texto),
        "chOptativosLivresMaxima": numero(r"Componentes Curriculares Optativos Livres: (\d+)", texto),
        "chAtividadesComplementares": numero(r"Atividades Complementares: Exigido \((\d+)", texto),
        "chExtensao": numero(r"Extens[ãa]o: Exigido \((\d+)", texto),
        "chTcc": numero(r"Trabalho de Conclus[ãa]o de Curso: Exigido \((\d+)", texto),
        "grupos": grupos,
        "componentes": unicos,
    }


def main() -> None:
    SAIDA.mkdir(parents=True, exist_ok=True)
    versoes = sys.argv[1:] or ["2025.1", "2013.2", "2010.1"]
    for v in versoes:
        e = converter(v)
        destino = SAIDA / f"smd-diurno-{v.replace('.', '-')}.json"
        destino.write_text(json.dumps(e, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        obr = sum(1 for c in e["componentes"] if c["natureza"] == "obrigatorio")
        print(f"{v}: {len(e['componentes'])} componentes ({obr} obrigatórios), {len(e['grupos'])} grupos → {destino.relative_to(RAIZ)}", file=sys.stderr)


if __name__ == "__main__":
    main()
