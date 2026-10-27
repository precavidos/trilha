---
status: accepted (substitui, para o protótipo, a ADR 0006)
---

# Análise pré-calculada em arquivo; sem banco no protótipo

A 4 dias da submissão, cortamos o escopo para o fluxo da coordenação (docs/PLANO.md, "Replanejamento de 27/10"). A análise (similaridade entre cada competência do vocabulário e cada ementa, mais a idade da bibliografia) é calculada **offline** por `GerarAnalise`, com o modelo de embeddings multilíngue local (`intfloat/multilingual-e5-small`, ONNX), e gravada em `data/analise/analise-smd-2024-2.json`, versionado. O backend apenas lê esse arquivo e aplica a classificação de cobertura com limiares configuráveis; o LLM entra só nas justificativas sob demanda (RAG sobre as evidências já recuperadas).

Motivos: o volume é pequeno (313 competências × 57 ementas), o resultado fica reprodutível e auditável no git, a demonstração não depende de Postgres nem de Docker, e o backend sobe em segundos. PostgreSQL + pgvector (ADR 0006) voltam a fazer sentido quando houver upload de PPCs pela interface, vários cursos ou o módulo discente.

## Consequences

- Alterar o PPC, a ESCO ou a Extensão IA exige regerar a análise (ver README).
- Os limiares podem ser recalibrados sem regerar nada: eles ficam em `application.yml`.
- O modelo ONNX (~120 MB) só é necessário para regerar a análise, não para rodar o sistema.
