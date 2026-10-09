# Ranking determinístico; o LLM só redige justificativas

A recomendação de componentes e a detecção de lacunas são calculadas de forma determinística (mapeamentos, pré-requisitos, regras dos grupos de componentes, itinerários formativos, demanda). O LLM nunca escolhe nem ordena componentes: ele recebe as evidências já recuperadas e apenas redige a justificativa, que deve citá-las.

Motivo: elimina alucinação de códigos de componentes, garante que nenhuma recomendação viole pré-requisitos e torna cada resultado auditável — que é o que o requisito "justificar recomendações sem emitir respostas genéricas" exige de fato.

## Consequences

- Se o LLM estiver indisponível, o sistema continua recomendando; só a justificativa em prosa degrada para a lista de evidências.
- A qualidade da recomendação depende da qualidade dos mapeamentos, por isso a validação concentra-se neles.
