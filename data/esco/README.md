# Vocabulário de competências

O vocabulário de competências do Trilha é a **ESCO v1.2.1** mais a **Extensão IA** (ADR 0001).

| Arquivo | O que é | Quem edita |
|---|---|---|
| [`profissoes-alvo.json`](profissoes-alvo.json) | As 6 profissões-alvo e a ocupação ESCO de cada uma, com as alternativas consideradas | Equipe (decisão) |
| `snapshot-esco-v1.2.1.json` | Snapshot congelado: profissões, competências essenciais/opcionais, detalhes de cada competência e buscas por IA | Gerado pelo script |
| [`extensao-ia.json`](extensao-ia.json) | Competências de IA que a ESCO não cobre | Equipe (curadoria) |

## Regerar o snapshot

```bash
python -I data/scripts/esco_snapshot.py
```

Usa a API pública da ESCO (`https://ec.europa.eu/esco/api`, sem chave) fixada na versão `v1.2.1`, a mais recente aceita pela API em 09/10/2026.

## Observações

- Os rótulos `pt` da ESCO estão em **português europeu** ("utilizador", "conceção"). A interface deve mostrar o rótulo como está, citando a ESCO, ou adaptá-lo para pt-BR de forma explícita.
- **Cobertura de IA:** a ESCO v1.2.1 só traz competências genéricas de IA. Das 298 competências das 6 ocupações-alvo, apenas uma é ligada à IA ("processamento das línguas naturais", em designer de interfaces) e nenhuma trata de IA generativa. Detalhes no campo `buscasIa` do snapshot e em `extensao-ia.json` → `lacunaNaEsco`.

## Licença

ESCO © União Europeia, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Fonte: https://esco.ec.europa.eu/
