"""Congela um snapshot da ESCO para as profissões-alvo (ADR 0001, ADR 0004).

Uso (só biblioteca padrão):
    python data/scripts/esco_snapshot.py

Lê data/esco/profissoes-alvo.json e escreve data/esco/snapshot-esco-<versão>.json com:
- cada profissão-alvo e suas competências essenciais/opcionais;
- os detalhes de cada competência (rótulos pt/en, alternativas pt, tipo, descrição pt);
- o resultado das buscas por termos de IA, para documentar a cobertura de IA da ESCO.

Os rótulos "pt" da ESCO são em português europeu.
"""

import json
import sys
import time
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

API = "https://ec.europa.eu/esco/api"
RAIZ = Path(__file__).resolve().parents[1]
CONFIG = RAIZ / "esco" / "profissoes-alvo.json"


def get(caminho: str, **params) -> dict:
    url = f"{API}/{caminho}?{urllib.parse.urlencode(params)}"
    for tentativa in range(4):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                return json.load(r)
        except Exception as erro:  # rede instável: tenta de novo com espera crescente
            if tentativa == 3:
                raise RuntimeError(f"falha em {url}") from erro
            time.sleep(2 ** tentativa)
    raise AssertionError


def literal(campo: dict | None, idioma: str) -> str | None:
    valor = (campo or {}).get(idioma)
    if isinstance(valor, dict):
        return valor.get("literal")
    return valor


def main() -> None:
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    versao = config["versaoEsco"]
    competencias: dict[str, dict] = {}
    profissoes = []

    for p in config["profissoes"]:
        pt = get("resource/occupation", uri=p["esco"], language="pt", selectedVersion=versao)
        en = get("resource/occupation", uri=p["esco"], language="en", selectedVersion=versao)
        titulo_en = {l["uri"]: l["title"] for rel in ("hasEssentialSkill", "hasOptionalSkill")
                     for l in en["_links"].get(rel, [])}
        relacoes = []
        for rel, nome in (("hasEssentialSkill", "essencial"), ("hasOptionalSkill", "opcional")):
            for link in pt["_links"].get(rel, []):
                relacoes.append({"uri": link["uri"], "relacao": nome})
                competencias.setdefault(link["uri"], {"tituloEn": titulo_en.get(link["uri"])})
        profissoes.append({
            "id": p["id"],
            "rotulo": p["rotulo"],
            "itinerarios": p["itinerarios"],
            "uri": p["esco"],
            "tituloPt": pt["title"],
            "tituloEn": en["title"],
            "descricaoPt": literal(pt.get("description"), "pt"),
            "competencias": relacoes,
        })
        print(f"{p['id']}: {len(relacoes)} competências", file=sys.stderr)

    buscas_ia = []
    for termo in config["buscaIa"]:
        r = get("search", text=termo, language="en", type="skill", limit=5, selectedVersion=versao)
        achados = [{"uri": x["uri"], "tituloEn": x["title"]} for x in r["_embedded"]["results"]]
        buscas_ia.append({"termo": termo, "resultados": achados})
        for a in achados:
            competencias.setdefault(a["uri"], {"tituloEn": a["tituloEn"]})

    for i, (uri, c) in enumerate(sorted(competencias.items()), 1):
        s = get("resource/skill", uri=uri, language="pt", selectedVersion=versao)
        tipo = (s["_links"].get("hasSkillType") or [{}])[0].get("uri", "")
        c.update({
            "tituloPt": s["title"],
            "alternativasPt": (s.get("alternativeLabel") or {}).get("pt", []),
            "tipo": "conhecimento" if tipo.endswith("/knowledge") else "habilidade",
            "descricaoPt": literal(s.get("description"), "pt"),
        })
        if i % 50 == 0:
            print(f"  {i}/{len(competencias)} competências", file=sys.stderr)
        time.sleep(0.05)

    saida = RAIZ / "esco" / f"snapshot-esco-{versao}.json"
    saida.write_text(json.dumps({
        "fonte": "ESCO — European Skills, Competences, Qualifications and Occupations (© União Europeia, CC BY 4.0)",
        "versao": versao,
        "recuperadoEm": date.today().isoformat(),
        "profissoes": profissoes,
        "buscasIa": buscas_ia,
        "competencias": dict(sorted(competencias.items())),
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{len(profissoes)} profissões · {len(competencias)} competências → {saida}", file=sys.stderr)


if __name__ == "__main__":
    main()
