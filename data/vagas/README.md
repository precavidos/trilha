# Vagas: coleta manual

Parte do corpus de mercado (ADR 0004). Meta: **~20 vagas por profissão-alvo** (120 no total), publicadas nos últimos 6 meses, de preferência no Brasil (vagas remotas valem).

## Como coletar

1. Busque vagas públicas (LinkedIn, Gupy, Programathor, Glassdoor, sites de estúdios e agências) para cada profissão de [`../esco/profissoes-alvo.json`](../esco/profissoes-alvo.json).
2. Para cada vaga, adicione uma linha em [`vagas.csv`](vagas.csv).
3. Salve o **texto integral** do anúncio em `data/private/vagas/<id>.txt` (fora do git: o texto é de terceiros).
4. Não registre nomes de recrutadores nem dados pessoais.

## Colunas de `vagas.csv`

| Coluna | Exemplo | Observação |
|---|---|---|
| `id` | `ux-001` | `<profissão>-<número>` |
| `profissao` | `ux-ui` | um `id` de `profissoes-alvo.json` |
| `titulo` | `Product Designer Pleno` | como aparece no anúncio |
| `senioridade` | `pleno` | `estagio`, `junior`, `pleno`, `senior`, `nao-informada` |
| `modalidade` | `remoto` | `presencial`, `hibrido`, `remoto` |
| `uf` | `CE` | vazio se remoto sem UF |
| `fonte` | `LinkedIn` | |
| `url` | `https://...` | |
| `dataPublicacao` | `2026-09-28` | aproximada, se o site disser "há 2 semanas" |
| `dataColeta` | `2026-10-10` | |
| `mencionaIa` | `sim` | o anúncio cita IA, ferramentas de IA ou automação inteligente? |

As competências de cada vaga são extraídas depois, pelo pipeline, a partir do texto integral, e revisadas pela equipe.

## Dica para a Extensão IA

Quando uma vaga mencionar IA (`mencionaIa = sim`), anote o trecho em [`../esco/extensao-ia.json`](../esco/extensao-ia.json), no campo `evidenciasNasVagas` da competência correspondente (formato: `"<id da vaga>: <trecho curto>"`). É assim que a lista proposta vira lista curada.
