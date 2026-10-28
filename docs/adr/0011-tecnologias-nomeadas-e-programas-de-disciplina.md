---
status: accepted
---

# Tecnologias nomeadas pela citação; programas de disciplina como fonte complementar

As descrições da ESCO para linguagens, frameworks e programas repetem um texto-padrão ("técnicas e princípios de desenvolvimento de software… em C#"). Por similaridade, qualquer uma delas fica perto de qualquer disciplina de programação: C#, Scala, Joomla e WebSphere apareciam como cobertas, e a validação humana marcou C#, Assembly, Groovy, STAF e ASP.NET como erros. Para essas competências, listadas em `data/seed/tecnologias-nomeadas.json` com os termos que as identificam, a situação passa a vir de onde o nome aparece:

- **coberta**: na ementa, nos objetivos, nas competências ou no conteúdo de um componente;
- **parcial**: só na bibliografia básica (livro indicado não é conteúdo ensinado);
- **não documentada**: em nenhum desses lugares. A bibliografia complementar não conta.

"Não documentada" é uma situação à parte, fora da contagem de lacunas: professores escolhem linguagens e ferramentas a cada semestre e alteram o conteúdo ao dar a disciplina, sem que a ementa registre. Chamar isso de lacuna afirmaria algo que os documentos não sustentam; o que eles mostram é que o PPC não formaliza a tecnologia.

O nome precisa aparecer como palavra inteira ("Java" não casa com "JavaScript"); termos ambíguos ("R", "Puppet") ficam de fora de propósito, e o erro aceito é o de não reconhecer uma citação, nunca o de inventar uma.

Os formulários de criação/regulamentação de disciplina da PROGRAD (`data/seed/programas-smd.json`, extraídos por `ExportarProgramas`) entram como fonte complementar ao PPC: completam 12 das 23 ementas ausentes e trazem objetivos e conteúdo, onde se procuram os nomes. Ementas completadas pelos programas são embutidas com os objetivos e as competências do formulário, porque algumas são telegráficas ("Concept art. Design de personagens.") e, sozinhas, viravam vizinhas de quase tudo. O texto embutido dos demais componentes continua sendo nome + ementa do PPC, para não invalidar a calibração dos limiares.

Rejeitamos: subir os limiares (pioraria as competências que hoje acertam); pedir ao LLM que julgue (ADR 0002); e remover as linguagens do vocabulário (esconderia um achado real: o PPC quase não nomeia as tecnologias que o mercado pede).

## Consequences

- A tela mostra, para cada tecnologia, onde o nome aparece; a justificativa por LLM recebe o critério.
- O resultado mede o que os documentos dizem, não o que se ensina em sala: uma disciplina que usa JavaScript sem citá-lo deixa JavaScript como não documentada. Uma fonte do que é dado em sala (planos de ensino do SIGAA, respostas dos professores), com semestre e origem, pode entrar depois como evidência própria.
- As 12 ementas novas mudam a distribuição das similaridades e, com ela, o escore relativo de outras competências; os limiares, calibrados com 57 ementas, devem ser revistos na revalidação.
- A validação de `docs/validacao/` foi medida antes desta decisão e precisa ser refeita.
