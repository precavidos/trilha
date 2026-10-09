# PostgreSQL + pgvector como único armazenamento

Dados relacionais (PPC, componentes, pré-requisitos, grupos, mapeamentos, vagas) e vetores (embeddings de ementas, competências e evidências) ficam no mesmo PostgreSQL, com a extensão pgvector. Rejeitamos um banco vetorial separado (Qdrant, Chroma etc.): o volume é pequeno (milhares de vetores), e um único serviço simplifica o `docker compose`, as consultas que cruzam vetor e relação, e a operação para uma equipe de três pessoas com ~1h/dia.
