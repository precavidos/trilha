# Corpus de mercado curado, datado e congelado — sem raspagem

A "demanda" vem de um corpus fixo e versionado: vagas públicas coletadas manualmente pela equipe (100–150, com URL e data), estudos e Masterplans da FIEC (inclusive a referência FIEC 2019 que o próprio PPC do SMD cita) e relatórios citados (WEF). Não há raspagem automática nem consulta "ao vivo".

Motivo: reprodutibilidade (o memorial descreve exatamente o que foi analisado), citação em ABNT, ausência de zona cinzenta jurídica e de fragilidade técnica. A coleta manual é também contribuição intelectual humana documentável.

Como o texto integral das vagas tem direitos de terceiros, o repositório público guarda apenas metadados (URL, data, título, profissão-alvo), competências extraídas e trechos curtos de evidência (até ~200 caracteres). O texto completo fica em `data/private/`, fora do git.

## Considered Options

- **Raspagem automatizada de portais de vagas**: rejeitada — frágil, juridicamente questionável, não reprodutível.
- **Pedir ao LLM o que o mercado exige**: rejeitada — é exatamente a resposta genérica que o projeto promete evitar.
