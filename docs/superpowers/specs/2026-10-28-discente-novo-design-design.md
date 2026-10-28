# Discente: tela nova do protótipo sobre o PR #14

- **Data:** 28/10/2026
- **Status:** aprovada em brainstorming; aguarda revisão da spec escrita
- **Referência visual:** prancha "Discente · histórico, profissões e sugestões" do protótipo "Trilha — protótipo" no Claude Design (https://claude.ai/artifact/FitF84Re3tNtK2gp99FWQX), arquivos `project/Discente.dc.html` e `project/disc-data.json`
- **Base:** branch `feat/programas-e-tecnologias` (PR #14 do David). Os commits entram no próprio PR, que continua sem merge antes de 31/10

## Objetivo

Levar a tela do discente ao desenho do protótipo: trilha de passos com estado, envio com histórico de exemplo, painel "Onde você está na trilha", cards de profissão, sugestões com filtros e contagem de competências, rascunho de semestre com resumo imprimível para o tutor e o bloco "O que nenhuma optativa do curso cobre". O bloco usa a situação `NAO_DOCUMENTADA`, que o PR #14 criou.

**Critérios de sucesso**

1. A rota `/discente` reproduz a prancha em 1440 px e em 375 px, sem rolagem horizontal, no tema claro (o único que as telas aplicam; ver a spec de 27/10).
2. Todo número exibido vem da API ou da trajetória lida. Nada é fixado no código.
3. A ordem e a pontuação das sugestões não mudam em relação ao PR #14. Os números da revalidação continuam valendo.
4. O fluxo inteiro funciona com o histórico de exemplo, sem PDF real.
5. `./mvnw verify`, `npm run lint`, `tsc`, `npm test` e `npm run build` passam.

**Fora do escopo:** mudança nos pesos do recomendador, nos limiares, na análise pré-calculada ou nos seeds do PR #14; geração de PDF no servidor ou no cliente; persistência do rascunho; telas de coordenação.

## Decisões

| Decisão | Escolha | Motivo |
|---|---|---|
| Relação com o PR #14 | Commits na branch do próprio PR | Escolha da equipe: um PR só |
| Lacunas no "Por que isto?" | Só exibição: o item traz todas as competências em que a ementa está entre as 3 mais próximas, mas só cobertas e parciais pontuam (top 5), como hoje | Mantém a ordem validada e o peso 0 de lacuna e não documentada (ADR 0009 e PR #14) |
| Cálculo do que é novo | No backend, na própria `Recomendacao` | Lógica determinística no servidor (ADR 0002); o front só exibe e filtra; uma chamada só |
| Alerta de ementa curta | Lista curada em `data/seed/ementas-com-ressalva.json` | O texto cita o que a validação mediu (ADR 0011: SMD0057 errou em 4 de 7 pares), e não uma regra genérica de tamanho |
| Histórico de exemplo | Trajetória fictícia da Diurno 2025.1 em `data/seed/historico-exemplo.json`, servida por `GET /api/discente/historico-exemplo` | Sem dado de pessoa real; o backend testa se continua válida |
| "Baixar resumo para o tutor (PDF)" | `window.print()` com uma folha `@media print` que mostra só o resumo | Sem dependência nova e sem enviar o rascunho ao servidor |
| Rascunho | Só na memória da página; "Recomeçar e apagar dados da página" limpa tudo | Nada fica guardado (ADR 0003) |
| Passo atual da trilha | 1 envio → 2 escolha (histórico lido) → 3 sugestões (recomendação na tela) → 4 "Leve ao tutor" (rascunho com algum item) | O protótipo pula do 1 para o 4; esta sequência dá um passo atual a cada estado real |

## Backend

### `Recomendador.Item`: campos novos

A pontuação, a ordem e o campo `competencias` (top 5 que pontuou) não mudam.

- `evidencias: List<CompetenciaContemplada>`: todas as competências das profissões escolhidas em que a ementa do componente (pelo `codigoNoPpc`) está entre as 3 mais próximas, **em qualquer situação** (coberta, parcial, lacuna, não documentada). A ordem é por `posicao` e, no empate, por similaridade decrescente. Para essas, o `peso` é o que a competência teria (0 para lacuna e não documentada).
- `contagem: { porProfissao: Map<String, Integer>, total: int, naoCobertas: int }`, calculada sobre `evidencias`. A chave de `porProfissao` é o rótulo da profissão; `naoCobertas` soma parcial, lacuna e não documentada.
- `notaEmenta: String | null`: a nota de `ementas-com-ressalva.json` para o `codigoNoPpc`, ou `null`.

Uma competência exigida pelas duas profissões aparece uma vez em `evidencias`, com a relação mais forte, como já faz o mapa `exigidas`.

### `Recomendacao`: campo novo

`foraDasSugestoes: { lacunasEssenciais: [{rotulo, profissao}], naoDocumentadas: [{rotulo, profissao}] }`

- `lacunasEssenciais`: competências com relação `essencial` nas profissões escolhidas, situação `LACUNA` na análise e ausentes das `evidencias` de todos os itens **devolvidos** (depois do limite). Ordem: profissão, depois rótulo.
- `naoDocumentadas`: competências das profissões escolhidas com situação `NAO_DOCUMENTADA`, em ordem alfabética, sem repetição.

### Seeds novos

- `data/seed/ementas-com-ressalva.json`: `[{ "codigo": "SMD0057", "nota": "Ementa de uma linha: atrai competências genéricas e errou em 4 de 7 pares na validação. Confirme o conteúdo com o docente.", "fonte": "ADR 0011" }]`. Caminho em `trilha.dados.ementas-com-ressalva`.
- `data/seed/historico-exemplo.json`: uma `Trajetoria` fictícia da estrutura 2025.1, turno diurno, no meio do curso (por volta de 31 aprovados e 4 em curso), com cargas `optativa` e `extensao` pendentes, e sem nome, matrícula, notas ou docentes. O README dos seeds ganha uma linha dizendo que ela é fictícia. Caminho em `trilha.dados.historico-exemplo`.

### Endpoint

`GET /api/discente/historico-exemplo` → a `Trajetoria` do seed, no mesmo controller de `/api/discente/historico`.

### Documentação

O ADR 0009 ganha um parágrafo: a resposta traz todas as evidências próximas para explicar a sugestão, mas só as cobertas e parciais pontuam. O ADR 0003 ganha uma linha sobre o histórico de exemplo ser fictício.

## Frontend

### Tipos (`lib/api.ts`)

`ItemRecomendado` ganha `evidencias`, `contagem` e `notaEmenta`; `Recomendacao` ganha `foraDasSugestoes`; e entra a função `historicoDeExemplo(): Promise<Trajetoria>`.

### Arquivos em `app/discente/`

| Arquivo | Conteúdo |
|---|---|
| `page.tsx` | Sobretítulo "Discente · Sistemas e Mídias Digitais", o título "Sua trilha até a profissão que você quer", o subtítulo do protótipo e o aviso do GPT no rodapé. Sai a `TrilhaDePassos` estática com `PASSOS` |
| `fluxo.tsx` | Estado `{ trajetoria, origem, escolhidas, recomendacao, filtro, rascunho }`, a trilha com `atual`, o botão "Recomeçar e apagar dados da página" (visível com histórico lido) e a composição das seções |
| `envio.tsx` | Seção 01: o caminho no SIGAA; a área de soltar (`<label>` envolvendo `<input type="file">`, com `onDragOver` e `onDrop`); "Experimentar com um histórico de exemplo"; o estado "arquivo lido" (nome do arquivo ou "histórico de exemplo"); o quadro "O Trilha lê / e descarta na leitura"; e "lendo…" e erros numa região viva |
| `onde-voce-esta.tsx` | Painel escuro: estrutura e turno; componentes (aprovados · em curso); carga optativa (pendente, exigida, ≈ componentes de 64 h, medidor); carga de extensão (pendente, exigida, medidor); o selo "Histórico de exemplo" quando `origem === "exemplo"` |
| `profissoes.tsx` | Seção 02: cards com `IconeProfissao`, rótulo, "Itinerário …" (de `resumo.profissoes[].itinerarios`), `aria-pressed`, desabilitado quando já há 2 escolhidas e o estado em texto; "n de 2 escolhidas" numa região viva; "Ver sugestões" e "A ordem é calculada sem IA generativa." |
| `sugestoes.tsx` | Seção 03: título "Sugestões para X e Y" (recebe o foco), linha de carga pendente e elegibilidade, `avisos`, filtros com `FiltroPilulas` e a lista em grade com o rascunho ao lado. `ItemSugerido` traz posição (a primeira em lima), código, nome, carga horária, botão "Adicionar ao rascunho" / "No rascunho" (`aria-pressed`), etiquetas (itinerário · papel, grupo, extensão), a linha "**N** competências de X · M delas o PPC cobre só em parte ou não cobre", o alerta de `notaEmenta` e o "Por que isto?" (aberto no primeiro): as 5 primeiras `evidencias` com `ChipSituacao`, relação e profissão, "Nª mais próxima · similaridade", e "Ver todas (N)"; depois a ementa, a equivalência quando houver e o pré-requisito |
| `rascunho.tsx` | Painel lateral fixo (`sticky`; fica estático abaixo de 980 px): horas somadas "de X h pendentes", medidor, dica quando vazio, a lista de códigos e nomes, "N delas contam carga de extensão", o botão "Baixar resumo para o tutor (PDF)" (desabilitado quando vazio) e a nota de privacidade |
| `fora-das-sugestoes.tsx` | "O que nenhuma optativa do curso cobre": card de lacunas essenciais (fundo lacuna) e card de tecnologias não documentadas (chips com ponto tracejado, 8 visíveis e "+ N outras", que expande). Um card some quando a lista dele está vazia; a seção some quando as duas estão |
| `resumo-impressao.tsx` | `#resumo-tutor`, visível só na impressão: título, data, estrutura e turno, profissões-alvo, carga optativa pendente e, para cada componente do rascunho, o código, o nome, a carga horária, as etiquetas, as 5 primeiras evidências e a ementa; no rodapé, o aviso do GPT e "confira a oferta de turmas no SIGAA" |

### Funções puras (`lib/discente.ts`)

`passoAtual(estado)`, `filtrosDisponiveis(recomendacao, escolhidas, extensaoPendente)`, `filtrar(itens, filtro)`, `contarPorFiltro(itens, filtros)`, `somarRascunho(rascunho)` → `{ horas, contamExtensao }`.

Filtros: `todas`; `profissao:<rótulo>` (itens com `contagem.porProfissao[rótulo] > 0`); `extensao` (`contaExtensao`), que só existe com extensão pendente.

### Componentes compartilhados

- `TrilhaDePassos` ganha `atual?: number`: passos anteriores com pino verde e etiqueta "feito"; o atual com etiqueta lima "você está aqui" e `aria-current="step"`; os seguintes com "a seguir"; e o caminho percorrido desenhado por cima. Sem `atual`, o uso que já existe continua igual.
- `ui/Medidor.tsx`, para as barras de carga e do rascunho, a menos que `BarraCobertura` sirva sem distorção.

### Regras de estado

- Um histórico novo (arquivo ou exemplo) limpa a escolha, a recomendação, o filtro e o rascunho.
- Mudar as profissões depois da recomendação esconde as seções 03 e "fora" até um novo "Ver sugestões". O rascunho continua: ele guarda o `ItemRecomendado` inteiro.
- O filtro volta a "Todas" a cada recomendação nova.
- "Recomeçar e apagar dados da página" volta ao estado inicial e leva o foco ao início da seção 01.

### Impressão

Em `globals.css`, `@media print` esconde `body > *` exceto o conteúdo de `#resumo-tutor`, que fica `display: none` na tela. O botão chama `window.print()`.

## Erros e casos de borda

| Situação | Comportamento |
|---|---|
| PDF ilegível ou estrutura não suportada | `Aviso` de atenção com a mensagem do backend, na seção 01 |
| Falha ao buscar o exemplo | Mesmo `Aviso`, na seção 01 |
| Carga optativa ou de extensão ausente na trajetória | O dado mostra "não informada", sem medidor; o filtro de extensão some |
| Nenhum item elegível | O aviso atual de lista vazia; "fora das sugestões" continua aparecendo |
| Falha em `/api/resumo` | O aviso atual na seção 02 |
| Falha na recomendação | `Aviso` na seção 02, como hoje |

## Testes

**Backend (`RecomendadorTest`, `DiscenteApiTest`):**
- a ordem e as pontuações dos itens da trajetória de exemplo são iguais às de uma lista esperada, gravada no teste a partir do código do PR #14 antes da mudança;
- `evidencias` inclui competências em `LACUNA`, e `contagem.total`, `porProfissao` e `naoCobertas` batem com elas;
- nenhum rótulo de `foraDasSugestoes.lacunasEssenciais` aparece nas `evidencias` de algum item devolvido;
- `notaEmenta` chega a um componente de estrutura antiga cujo equivalente é a SMD0057;
- todos os códigos de `historico-exemplo.json` existem na estrutura 2025.1 diurno e a recomendação dele devolve itens;
- `GET /api/discente/historico-exemplo` responde 200 com a trajetória.

**Frontend (Vitest):** `lib/discente.ts`: o passo atual em cada estado, os filtros com e sem extensão, as contagens por filtro e a soma do rascunho.

**Verificação no navegador:** o fluxo completo com o exemplo; a trilha avançando nos quatro passos; os filtros; adicionar e remover do rascunho; a prévia de impressão; 375 px sem rolagem horizontal; teclado (Tab passa por área de soltar, cards, filtros, botões e "Por que isto?").

## Entrega

- Commits na `feat/programas-e-tecnologias`, separados entre backend e frontend, sem rodapé de coautoria.
- A descrição do PR #14 ganha a seção "Tela do discente", com o que mudou e a observação de que a ordem das sugestões não muda.
