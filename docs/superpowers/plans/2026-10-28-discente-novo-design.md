# Discente: tela nova do protótipo — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levar `/discente` ao desenho da prancha "Discente · histórico, profissões e sugestões" do protótipo, com os dados novos vindos da própria recomendação.

**Architecture:** O `Recomendador` passa a devolver, além do que já devolve, as evidências completas de cada item, uma contagem por profissão, a nota de ementa com ressalva e o bloco "fora das sugestões". Pontuação e ordem não mudam. Um endpoint novo serve uma trajetória fictícia de exemplo. No front, `app/discente/fluxo.tsx` vira um arquivo por seção, com um estado único e as regras em funções puras de `lib/discente.ts`.

**Tech Stack:** Java 21 + Spring Boot 4.1 (records, Jackson 3 `tools.jackson`), JUnit 5 + AssertJ + MockMvc; Next.js 16 + React 19 + Tailwind v4; testes de front com `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-28-discente-novo-design-design.md` (ler antes de começar). Referência visual: `project/Discente.dc.html` do artifact https://claude.ai/artifact/FitF84Re3tNtK2gp99FWQX.

## Global Constraints

- Branch `feat/programas-e-tecnologias` (PR #14). Não alterar `data/analise/analise-smd-2024-2.json`, `programas-smd.json`, `tecnologias-nomeadas.json`, limiares nem `PESO_*` / `MAX_COMPETENCIAS` do `Recomendador`.
- Commits sem `Co-Authored-By` e sem rodapé do Claude Code (regra da equipe).
- Textos, identificadores e comentários em PT-BR, como o resto do código. Glossário em `CONTEXT.md`: "componente curricular", "competência", "profissão-alvo", "itinerário formativo"; nunca "matéria" nem "skill".
- Os testes de front usam `node:test` + `node:assert/strict` (como `lib/calculos.test.ts`), e não Vitest como a spec diz. O arquivo de teste importa com a extensão `.ts`.
- O tema das telas é sempre claro. A verificação visual é em 1440 px e 375 px.
- Nenhum dado pessoal no exemplo nem no resumo impresso. O rascunho só existe na memória da página.
- Antes de escrever código Next, ler o guia relevante em `frontend/node_modules/next/dist/docs/` (`frontend/AGENTS.md`).
- Verificação final: `cd backend && ./mvnw verify`; `cd frontend && npm run lint && npx tsc --noEmit && npm test && npm run build`.

## Review Focus

1. **Trajetória sem a carga `extensao` ou `optativa`:** a tela mostra "não informada", sem medidor, e o filtro "Contam extensão" some. Pinado na Task 5 (`extensaoPendente`, `filtrosDisponiveis`).
2. **Item com `ch: null` no rascunho:** entra na soma como 64 h, o `CH_PADRAO`. Pinado na Task 5 (`somarRascunho`).
3. **Competência exigida pelas duas profissões escolhidas:** aparece uma vez em `evidencias`, contada só na profissão da relação mais forte, e `contagem.total == evidencias.size()`. Pinado na Task 2.
4. **Mudar as profissões com o rascunho cheio:** a recomendação some, o passo volta a 1 e o rascunho continua. Pinado na Task 5 (`passoAtual`) e conferido na Task 9.
5. **Nenhum item elegível:** `lacunasEssenciais` traz todas as essenciais em lacuna, e a seção "fora" continua visível. Pinado na Task 4 (teste estático de `fora`) e na Task 10.

---

## Mapa de arquivos

**Backend**
- Modify `backend/src/main/java/br/ufc/trilha/discente/Recomendador.java`: records novos, evidências, contagem, nota, fora.
- Modify `backend/src/main/java/br/ufc/trilha/api/DiscenteController.java`: `GET /historico-exemplo`.
- Modify `backend/src/main/resources/application.yml`: dois caminhos em `trilha.dados`.
- Create `data/seed/historico-exemplo.json` e `data/seed/ementas-com-ressalva.json`; modify `data/seed/README.md`.
- Modify `docs/adr/0003-*.md` e `docs/adr/0009-*.md`.
- Test `backend/src/test/java/br/ufc/trilha/discente/DiscenteApiTest.java` e `RecomendadorTest.java`.

**Frontend** (`frontend/src/`)
- Modify `lib/api.ts`; create `lib/discente.ts` e `lib/discente.test.ts`.
- Modify `components/trilha/TrilhaDePassos.tsx`; create `components/ui/Medidor.tsx`.
- Modify `app/discente/page.tsx` e `app/discente/fluxo.tsx`; create `app/discente/{envio,onde-voce-esta,profissoes,sugestoes,rascunho,fora-das-sugestoes,resumo-impressao}.tsx`.
- Modify `app/globals.css` (regra de impressão).

---

### Task 1: Histórico de exemplo e proteção da ordem atual

**Files:**
- Create: `data/seed/historico-exemplo.json`
- Modify: `backend/src/main/java/br/ufc/trilha/api/DiscenteController.java`, `backend/src/main/resources/application.yml`, `data/seed/README.md`, `docs/adr/0003-historico-parseado-localmente-sem-dados-pessoais.md`
- Test: `backend/src/test/java/br/ufc/trilha/discente/DiscenteApiTest.java`

**Interfaces:**
- Produces: `GET /api/discente/historico-exemplo` → JSON de `Trajetoria`. Propriedade `trilha.dados.historico-exemplo: ${TRILHA_HISTORICO_EXEMPLO:../data/seed/historico-exemplo.json}`.

- [ ] **Step 1: Escrever `historico-exemplo.json`.** É uma `Trajetoria` com `estrutura: "2025.1"`, `turno: "diurno"`, `obrigatoriosPendentes: []` e `cargas: { "optativa": {exigido 384, integralizado 128, pendente 256}, "extensao": {exigido 320, integralizado 192, pendente 128} }` (os valores do protótipo). Componentes, todos de `smd-diurno-2025-1.json`:
  - **aprovados (31):** os 17 obrigatórios dos semestres 1 a 5, 4 eletivas do 4º semestre, 3 do 5º e mais 7 componentes. Entre os aprovados ficam a SMD0108, a SMD0143, a SMD0015, a SMD0095, a SMD0137 e a SMD0098, os pré-requisitos das sugestões que aparecem no protótipo.
  - **matriculados (4):** obrigatórios do 6º e do 7º semestre.

  Em cada componente: `periodo` "2023.1"…"2025.2", `ch` igual ao da estrutura e `marcador: null`.
- [ ] **Step 2: Escrever os testes que falham** em `DiscenteApiTest`:
  - `historicoDeExemploExisteNaEstrutura()`: lê os dois JSON e verifica que todo `codigo` da trajetória existe em `smd-diurno-2025-1.json` e que há 31 aprovados e 4 matriculados.
  - `serveOHistoricoDeExemplo()`: `GET /api/discente/historico-exemplo` → 200, `$.estrutura` é "2025.1" e `$.cargas.extensao.pendente` é 128.
  - `recomendacaoDoExemploNaoMuda()`: `POST /recomendacao` com o exemplo e `["ux-ui","web"]`. Compara a lista `[codigo, pontuacao]` dos itens, na ordem, com uma constante `ORDEM_DO_PR_14`.
- [ ] **Step 3: Rodar e ver falhar:** `cd backend && ./mvnw -q test -Dtest=DiscenteApiTest`. O resultado esperado é 404 no endpoint e uma constante vazia que não confere.
- [ ] **Step 4: Gravar `ORDEM_DO_PR_14`** com a saída real do recomendador **antes de qualquer mudança nele**. Imprima os pares uma vez no teste, copie para a constante e apague o print. Um comentário na constante diz que ela protege o "só exibição" da spec.
- [ ] **Step 5: Implementar o endpoint.** O `DiscenteController` recebe `@Value("${trilha.dados.historico-exemplo}") String` e o `JsonMapper`, lê a `Trajetoria` uma vez no construtor e expõe `@GetMapping("/historico-exemplo") Trajetoria historicoExemplo()`. Acrescente a propriedade em `trilha.dados`.
- [ ] **Step 6: Documentar.** No README dos seeds, uma seção `historico-exemplo.json` diz que a trajetória é fictícia, montada à mão, e que não deriva de histórico real. No ADR 0003, uma linha nas consequências: o exemplo é fictício e serve para avaliar o sistema sem expor um histórico.
- [ ] **Step 7: Rodar:** `./mvnw -q test -Dtest=DiscenteApiTest`. Tudo deve passar.
- [ ] **Step 8: Commit:** `git add data/seed backend docs/adr/0003* && git commit -m "Discente: histórico de exemplo fictício e teste que fixa a ordem das sugestões"`

### Task 2: Evidências completas e contagem por item

**Files:**
- Modify: `backend/src/main/java/br/ufc/trilha/discente/Recomendador.java`, `docs/adr/0009-recomendador-suporta-multiplas-estruturas-curriculares.md`
- Test: `DiscenteApiTest.java`

**Interfaces:**
- Produces (records aninhados em `Recomendador`):
  - `record ContagemDeEvidencias(Map<String, Integer> porProfissao, int total, int naoCobertas)`. A chave é o rótulo da profissão. `naoCobertas` soma PARCIAL, LACUNA e NAO_DOCUMENTADA.
  - `Item` ganha, no fim: `List<CompetenciaContemplada> evidencias, ContagemDeEvidencias contagem`. No JSON, os campos saem como `evidencias` e `contagem`.

- [ ] **Step 1: Testes que falham** em `DiscenteApiTest`, com o exemplo da Task 1 e `["ux-ui","web"]`:
  - `evidenciasIncluemLacunasEContagemBate()`: algum item tem uma evidência com `situacaoNoPpc == "LACUNA"`; em todo item, `contagem.total == evidencias.length` e a soma de `porProfissao` dá `total`; `naoCobertas` é igual ao número de evidências que não são `COBERTA`.
  - `competenciaDasDuasProfissoesApareceUmaVez()`: em todo item, as `evidencias[*].competencia` não se repetem.
  - `evidenciasOrdenadasPorPosicao()`: em todo item, `posicao` não decresce e, no empate, a similaridade não cresce.
  - `recomendacaoDoExemploNaoMuda()` (Task 1) continua passando.
- [ ] **Step 2: Rodar e ver falhar:** `./mvnw -q test -Dtest=DiscenteApiTest`. O esperado é que `$.itens[0].evidencias` não exista.
- [ ] **Step 3: Implementar.** No laço de `analise.competenciasDoComponente(noPpc)`, construa `evidencias` com **toda** competência de `exigidas`, sem pular LACUNA nem NAO_DOCUMENTADA, e com o mesmo `peso` que a fórmula atual dá (0 para essas). Ordene por `posicao` e depois por similaridade decrescente. `todas`, a lista que alimenta `competencias` e `pontos`, continua com o filtro `PESO_STATUS.get(...) == 0.0 → continue`. A `ContagemDeEvidencias` é calculada sobre `evidencias`, com um `LinkedHashMap` que segue a ordem das profissões escolhidas e inclui as profissões com 0.
- [ ] **Step 4: Rodar:** `./mvnw -q test -Dtest=DiscenteApiTest`. Tudo deve passar, inclusive `recomendacaoDoExemploNaoMuda`.
- [ ] **Step 5: ADR 0009.** Em "Consequences", um parágrafo: a resposta traz todas as competências próximas (`evidencias`) para explicar a sugestão, mas só as cobertas e parciais pontuam (`competencias`, top 5).
- [ ] **Step 6: Commit:** `git commit -am "Recomendador: evidências completas e contagem por profissão, sem mudar a pontuação"`

### Task 3: Nota de ementa com ressalva

**Files:**
- Create: `data/seed/ementas-com-ressalva.json`
- Modify: `Recomendador.java`, `application.yml`, `data/seed/README.md`
- Test: `DiscenteApiTest.java`

**Interfaces:**
- Produces: `Item` ganha, no fim, `String notaEmenta`, que é nulo quando não há ressalva. Propriedade `trilha.dados.ementas-com-ressalva: ${TRILHA_EMENTAS_COM_RESSALVA:../data/seed/ementas-com-ressalva.json}`. O record do seed é `record EmentaComRessalva(String codigo, String nota, String fonte)`.

- [ ] **Step 1: Escrever o seed**, com este conteúdo exato:
  ```json
  [{ "codigo": "SMD0057", "nota": "Ementa de uma linha: atrai competências genéricas e errou em 4 de 7 pares na validação. Confirme o conteúdo com o docente.", "fonte": "ADR 0011" }]
  ```
- [ ] **Step 2: Teste que falha**, `notaDaEmentaCurtaChegaAoItem()`. Use o helper `pedido("2013.2", "diurno", List.of("animacao"))` acrescentando a SMD0098 como aprovada (o pré-requisito da SMD0057 na 2013.2). Afirme que `$.itens[?(@.codigo=='SMD0057')].notaEmenta` contém "4 de 7" e que nenhum outro item tem `notaEmenta` preenchida. Se a SMD0057 não entrar no limite de itens com "animacao", troque para a profissão em que ela entra e registre o motivo num comentário do teste.

  Diferença em relação à spec: nenhuma estrutura tem equivalente da SMD0057 (o código é o mesmo em todas). Por isso o teste usa uma estrutura antiga, e não uma equivalência.
- [ ] **Step 3: Rodar e ver falhar.**
- [ ] **Step 4: Implementar.** O construtor do `Recomendador` recebe o caminho, lê `List<EmentaComRessalva>` e guarda um `Map<String, String>` de código para nota. No item, a busca é `notas.get(noPpc)`.
- [ ] **Step 5: README dos seeds.** Uma seção `ementas-com-ressalva.json`: componentes cuja ementa a validação mostrou ser fraca, com a nota exibida ao discente; entra um componente só quando a validação registrar o erro.
- [ ] **Step 6: Rodar:** `./mvnw -q test`. Tudo deve passar.
- [ ] **Step 7: Commit:** `git add data/seed backend && git commit -m "Recomendador: nota de ementa com ressalva (SMD0057, ADR 0011)"`

### Task 4: Fora das sugestões

**Files:**
- Modify: `Recomendador.java`
- Test: `RecomendadorTest.java`, `DiscenteApiTest.java`

**Interfaces:**
- Consumes: `AnaliseService.lacunas(String profissaoId) → List<AnaliseService.Item>`, que traz `id`, `rotulo`, `relacao` e `status`.
- Produces:
  - `record CompetenciaFora(String rotulo, String profissao)`
  - `record ForaDasSugestoes(List<CompetenciaFora> lacunasEssenciais, List<CompetenciaFora> naoDocumentadas)`
  - `Recomendacao` ganha, no fim, `ForaDasSugestoes foraDasSugestoes`.
  - `static ForaDasSugestoes fora(Map<String, List<AnaliseService.Item>> competenciasPorProfissao, Set<String> idsNasSugestoes)`. A chave do mapa é o rótulo da profissão, na ordem da escolha.

- [ ] **Step 1: Testes estáticos que falham** em `RecomendadorTest`, com `AnaliseService.Item` montados à mão por um helper `item(id, rotulo, relacao, status)`:
  - `foraTrazLacunasEssenciaisLongeDasSugestoes()`: com {a: essencial/LACUNA, b: essencial/LACUNA, c: opcional/LACUNA, d: essencial/COBERTA} e `idsNasSugestoes = {b}`, `lacunasEssenciais` é `[a]`.
  - `foraSemSugestoesTrazTodasAsLacunasEssenciais()`: com `idsNasSugestoes` vazio, a lista traz `a` e `b`.
  - `foraTrazNaoDocumentadasSemRepetir()`: a mesma tecnologia NAO_DOCUMENTADA nas duas profissões aparece uma vez (com a primeira profissão), e as tecnologias saem em ordem alfabética de rótulo.
  - Ordem de `lacunasEssenciais`: profissão (na ordem do mapa), depois rótulo.
- [ ] **Step 2: Rodar e ver falhar:** `./mvnw -q test -Dtest=RecomendadorTest`.
- [ ] **Step 3: Implementar `fora`** e chamá-la em `recomendar`. O mapa vem de `analise.lacunas(id)` para cada profissão escolhida. `idsNasSugestoes` é a união de `evidencias[*].competencia` dos itens **depois** do `limit(limite)`.
- [ ] **Step 4: Teste de integração**, `foraDasSugestoesNaoRepeteEvidencias()` em `DiscenteApiTest`, com o exemplo e `["ux-ui","web"]`: nenhum rótulo de `lacunasEssenciais` aparece nas `evidencias[*].rotulo` de algum item, e `naoDocumentadas` não está vazia.
- [ ] **Step 5: Rodar:** `./mvnw verify`. Tudo deve passar.
- [ ] **Step 6: Commit:** `git commit -am "Recomendador: lacunas essenciais e tecnologias não documentadas fora das sugestões"`

### Task 5: Tipos e regras do fluxo no front

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/discente.ts`, `frontend/src/lib/discente.test.ts`

**Interfaces:**
- Produces, em `api.ts`:
  - `ItemRecomendado` ganha `evidencias: CompetenciaContemplada[]`, `contagem: { porProfissao: Record<string, number>; total: number; naoCobertas: number }` e `notaEmenta: string | null`.
  - `Recomendacao` ganha `foraDasSugestoes: { lacunasEssenciais: CompetenciaFora[]; naoDocumentadas: CompetenciaFora[] }`, com `export type CompetenciaFora = { rotulo: string; profissao: string }`.
  - `historicoDeExemplo(): Promise<Trajetoria>`, com `GET ${API_URL}/api/discente/historico-exemplo` e erro por `erroDaResposta`.
- Produces, em `discente.ts`:
  - `export const CH_PADRAO = 64`
  - `export type Filtro = "todas" | "extensao" | \`profissao:${string}\``
  - `export function passoAtual(e: { trajetoria: Trajetoria | null; recomendacao: Recomendacao | null; rascunho: ItemRecomendado[] }): 0 | 1 | 2 | 3`: sem trajetória devolve 0; sem recomendação, 1; com rascunho não vazio, 3; nos demais casos, 2.
  - `export function extensaoPendente(t: Trajetoria): boolean`: verdadeiro quando `cargas.extensao?.pendente > 0`.
  - `export function filtrosDisponiveis(r: Recomendacao, comExtensao: boolean): { valor: Filtro; rotulo: string; contagem: number }[]`: `todas` ("Todas"); um `profissao:<rótulo>` ("Para <rótulo>") por profissão em `r.profissoes`; e `extensao` ("Contam extensão"), só quando `comExtensao`. Cada contagem é `filtrar(r.itens, valor).length`.
  - `export function filtrar(itens: ItemRecomendado[], f: Filtro): ItemRecomendado[]`: `profissao:X` mantém os itens com `contagem.porProfissao[X] > 0`; `extensao` mantém os com `contaExtensao`.
  - `export function alternarNoRascunho(rascunho: ItemRecomendado[], item: ItemRecomendado): ItemRecomendado[]`, pelo `codigo`.
  - `export function somarRascunho(rascunho: ItemRecomendado[]): { horas: number; contamExtensao: number }`, com `ch ?? CH_PADRAO`.

- [ ] **Step 1: Testes que falham** em `discente.test.ts`, com um helper `item(over)` e outro `rec(over)`:
  - `passoAtual`: as quatro situações, mais "recomendação nula com rascunho cheio → 1".
  - `extensaoPendente`: `cargas: {}` é falso; `pendente: 0` é falso; 128 é verdadeiro.
  - `filtrosDisponiveis`: com `comExtensao` falso não há `extensao`; os rótulos são exatamente "Todas", "Para Designer de UX/UI" e "Contam extensão"; as contagens batem com `filtrar`.
  - `filtrar`: profissão com contagem 0 sai; `extensao` mantém só os itens com `contaExtensao`.
  - `alternarNoRascunho`: acrescenta e depois remove pelo código.
  - `somarRascunho`: dois itens de 64 h e um com `ch: null` dão `{ horas: 192, contamExtensao: <n> }`.
- [ ] **Step 2: Rodar e ver falhar:** `cd frontend && npm test`. O esperado é falha de importação.
- [ ] **Step 3: Implementar** `api.ts` e `discente.ts`.
- [ ] **Step 4: Rodar:** `npm test && npx tsc --noEmit`. Tudo deve passar (os campos novos são aditivos; o `fluxo.tsx` atual continua compilando).
- [ ] **Step 5: Commit:** `git add frontend/src/lib && git commit -m "Discente (front): tipos novos da recomendação e regras do fluxo"`

### Task 6: Trilha com passo atual e medidor

**Files:**
- Modify: `frontend/src/components/trilha/TrilhaDePassos.tsx`
- Create: `frontend/src/components/ui/Medidor.tsx`

**Interfaces:**
- Produces:
  - `TrilhaDePassos` ganha `atual?: number` (índice de base 0). Sem ele, a renderização fica idêntica à de hoje: Sobre a IA não muda.
  - `export function Medidor({ valor, maximo, tom = "padrao" }: { valor: number; maximo: number; tom?: "padrao" | "painel" })`: barra decorativa (`aria-hidden`); a largura é `min(100, round(valor / maximo * 100))%` e é 0 quando `maximo` é 0; o preenchimento é `bg-green`; o trilho é `bg-surface-sunken` no tom padrão e `bg-panel-raised` no painel.

- [ ] **Step 1: Implementar `atual`** seguindo `Discente.dc.html`, linhas 68 a 75 e 226 a 235:
  - **Passos com `i < atual`:** pino `bg-green` com o número em `text-on-lime` e a etiqueta "feito" (`bg-coberta-bg text-coberta`).
  - **Passo `i === atual`:** `aria-current="step"` e a etiqueta "você está aqui" (`bg-lime text-on-lime`).
  - **Passos com `i > atual`:** a etiqueta "a seguir" (`bg-sky text-ink`).
  - **Caminho:** um segundo `<path>` com o trecho de `caminho()` até o pino atual, desenhado por cima em verde e com traço contínuo. Extraia um `caminhoAte(n, k)` que reaproveita a mesma geometria.

  Com `atual` definido, a etiqueta de estado substitui `p.tag`.
- [ ] **Step 2: Implementar `Medidor`.**
- [ ] **Step 3: Verificar:** `npx tsc --noEmit && npm run lint`, e abrir `/sobre-ia` no navegador para confirmar que a trilha não mudou.
- [ ] **Step 4: Commit:** `git commit -am "Trilha de passos com passo atual; medidor de carga"`

### Task 7: Cabeçalho, fluxo, envio e "Onde você está"

**Files:**
- Modify: `frontend/src/app/discente/page.tsx`, `frontend/src/app/discente/fluxo.tsx`
- Create: `frontend/src/app/discente/envio.tsx`, `frontend/src/app/discente/onde-voce-esta.tsx`

**Interfaces:**
- Consumes: `passoAtual`, `historicoDeExemplo`, `lerHistorico`, `TrilhaDePassos({ passos, atual })`, `Medidor`.
- Produces:
  - **Estado em `FluxoDiscente`:** `trajetoria`, `origem: "arquivo" | "exemplo" | null`, `nomeDoArquivo: string | null`, `escolhidas: string[]`, `recomendacao`, `filtro: Filtro` e `rascunho: ItemRecomendado[]`.
  - `function novaTrajetoria(t: Trajetoria, origem, nome)`: limpa a escolha, a recomendação, o filtro e o rascunho.
  - `function recomecar()`: volta ao inicial e leva o foco ao `h2#t-envio`.
  - `EnvioDoHistorico({ lido: { origem; nome } | null, aoLer(t, origem, nome): void, aoComecar(): void })`. `aoComecar` é chamada ao iniciar uma leitura e limpa a trajetória.
  - `OndeVoceEsta({ trajetoria, exemplo: boolean })`.

- [ ] **Step 1: `page.tsx`.** Sobretítulo "Discente · Sistemas e Mídias Digitais" (maiúsculas, `text-ink-muted`, 14 px, negrito, `tracking-[.06em]`), `h1` "Sua trilha até a profissão que você quer", o subtítulo "Optativas e eletivas que aproximam sua trajetória das profissões-alvo, com o porquê de cada sugestão. Leva uns dois minutos." e, no fim, o `Aviso tom="info"` com "A recomendação apoia, mas não substitui, a orientação do Grupo de Professores Tutores e da coordenação." Sai a `TrilhaDePassos` estática.
- [ ] **Step 2: `fluxo.tsx`.**
  - O botão fantasma "Recomeçar e apagar dados da página" aparece quando há trajetória.
  - A `TrilhaDePassos` recebe os quatro passos do protótipo: "Envie o histórico" / "PDF do SIGAA, lido em memória."; "Escolha profissões-alvo" / "Até duas, ligadas aos itinerários."; "Veja as sugestões" / "Optativas e eletivas elegíveis, com o porquê."; "Leve ao tutor" / "Um rascunho de semestre para conversar."
  - `atual={passoAtual(...)}`, e as seções em ordem.
  - Trocar as profissões zera `recomendacao` e mantém o `rascunho`.
- [ ] **Step 3: `envio.tsx`** (protótipo, linhas 77 a 90):
  - **Cabeçalho:** "01" e "Envie seu histórico do SIGAA", com o caminho "SIGAA → Ensino → Documentos e Declarações → Histórico Escolar".
  - **Área de soltar:** um `<label>` que envolve o `<input type="file" accept="application/pdf,.pdf">` visualmente oculto, mas focável, com `onDragOver` (`preventDefault`) e `onDrop` (`dataTransfer.files[0]`). Textos: "Selecione o histórico em PDF" / "ou arraste o arquivo para cá".
  - **Exemplo:** o botão "Experimentar com um histórico de exemplo" e a nota "Para avaliar o sistema sem expor o seu."
  - **Estado lido:** "<nome> lido" ou "Histórico de exemplo lido", com "Dados pessoais descartados na leitura. O arquivo não foi gravado."
  - **Quadro lê / descarta:** o texto das linhas 87 e 88.
  - **Avisos:** "Lendo o histórico…" e os erros vão numa região `aria-live`.
- [ ] **Step 4: `onde-voce-esta.tsx`** (protótipo, linhas 93 a 102):
  - **Painel:** `Painel` com o título "Onde você está na trilha" e o selo "HISTÓRICO DE EXEMPLO" quando `exemplo`.
  - **Quatro dados:** a estrutura e o turno; os componentes ("N" / "aprovados · M em curso"); a carga optativa ("P h" / "faltam, de E h (≈ ceil(P/64) componentes de 64 h)" + `Medidor tom="painel"` de integralizado/exigido); e a carga de extensão ("P h" / "faltam, de E h" + medidor).
  - **Carga ausente:** "não informada", sem medidor.
  - **Nota final:** "Nada disso é guardado: a trajetória fica só nesta página e é reenviada ao pedir as sugestões."
- [ ] **Step 5: Verificar** com `npx tsc --noEmit && npm run lint` e, no navegador, `/discente`: o exemplo carrega, a trilha mostra o passo 2 e "Recomeçar" volta ao início com o foco no título da seção 01.
- [ ] **Step 6: Commit:** `git commit -am "Discente (front): cabeçalho, trilha com estado, envio com exemplo e painel da trajetória"`

### Task 8: Cards de profissão

**Files:**
- Create: `frontend/src/app/discente/profissoes.tsx`
- Modify: `fluxo.tsx` (troca a `EscolhaDeProfissoes` antiga)

**Interfaces:**
- Consumes: `useApi<Resumo>("/api/resumo")`, `IconeProfissao({ id })`, `recomendar`.
- Produces: `EscolhaDeProfissoes({ trajetoria, escolhidas, aoMudar(ids: string[]): void, aoRecomendar(r: Recomendacao): void })`.

- [ ] **Step 1: Implementar** seguindo o protótipo, linhas 106 a 129:
  - **Cabeçalho:** "02" e "Escolha até duas profissões-alvo", com "n de 2 escolhidas" em `aria-live="polite"`.
  - **Grade:** `repeat(auto-fill, minmax(min(100%, 260px), 1fr))`.
  - **Card:** `<button aria-pressed>`, desabilitado quando já há 2 e ele não é um deles. Traz o rótulo, "Itinerário " + `itinerarios.join(" · ")`, o ícone e o estado "Escolhida" / "Desmarque uma para trocar" / "Toque para escolher".
  - **Ação:** o botão lima "Ver sugestões" ("Calculando…" enquanto espera) e "A ordem é calculada sem IA generativa."
  - **Erros:** os avisos atuais, sem mudança.

  O estilo de card vem de `.tr-prof` em `project/ds/trilha/components/bundle.css` do artifact, traduzido para Tailwind como na spec de 27/10.
- [ ] **Step 2: Verificar:** `npx tsc --noEmit && npm run lint`. No navegador, escolha 2 profissões e confirme que o terceiro card fica desabilitado e que o teclado (Tab e Espaço) funciona.
- [ ] **Step 3: Commit:** `git commit -am "Discente (front): cards de profissão-alvo com itinerário"`

### Task 9: Sugestões e rascunho

**Files:**
- Create: `frontend/src/app/discente/sugestoes.tsx`, `frontend/src/app/discente/rascunho.tsx`
- Modify: `fluxo.tsx`

**Interfaces:**
- Consumes: `filtrosDisponiveis`, `filtrar`, `alternarNoRascunho`, `somarRascunho`, `extensaoPendente`, `FiltroPilulas`, `ChipSituacao`, `Medidor`, `RELACOES` e `formatarSimilaridade` de `lib/formato`.
- Produces:
  - `Sugestoes({ recomendacao, filtro, aoFiltrar, rascunho, aoAlternar(item), comExtensao })`
  - `Rascunho({ rascunho, chPendente: number | null, aoImprimir(): void })`

- [ ] **Step 1: `sugestoes.tsx`** (protótipo, linhas 133 a 182):
  - **Título:** `h2` "03" e "Sugestões para X e Y" (`tabIndex={-1}`, recebe o foco quando chega uma recomendação, como hoje).
  - **Linha de carga:** a do código atual (pendente, ≈ componentes, estrutura).
  - **Avisos e filtros:** os `avisos`, depois o `FiltroPilulas legenda="Mostrar sugestões" nome="filtro-sugestoes"`.
  - **Grade:** `minmax(0,1fr) 300px`; abaixo de 980 px, uma coluna.
  - **Sem itens:** fica o aviso atual "Nenhum componente elegível tem relação com as profissões escolhidas."
- [ ] **Step 2: `ItemSugerido`** (mesmo arquivo):
  - **Posição:** o pino da posição, com o primeiro em lima.
  - **Cabeçalho:** código, nome e "N h"; à direita, o botão "Adicionar ao rascunho" / "No rascunho" (`aria-pressed`, `sr-only` " — <nome>").
  - **Etiquetas:** itinerário · papel, grupo e "Conta carga de extensão".
  - **Linha de contagem:** um span por profissão com contagem > 0, em ordem decrescente ("**N** competências de X"), mais "M delas o PPC cobre só em parte ou não cobre", que só aparece se M > 0.
  - **Ressalva:** a `notaEmenta` num alerta (`bg-parcial-bg text-parcial`, com ícone de triângulo).
  - **"Por que isto?":** `<details>`, com `open` no primeiro item. O texto de abertura é "A ementa está entre as três mais próximas destas competências das profissões que você escolheu (N no total; as mais próximas primeiro):". Seguem as 5 primeiras `evidencias` (chip, rótulo, "<relação> para <profissão> · situação no PPC" e "<posicao+1>ª mais próxima · <similaridade>") e um botão "Ver todas (N)" quando há mais de 5.
  - **Depois das evidências:** a equivalência (`codigoNoPpc`), a ementa em `blockquote` e "Pré-requisito cumprido: …" ou "Sem pré-requisito.", seguido de "A ordem é calculada sem IA generativa."
  - **Sem evidências:** fica o texto atual de "Sem competências associadas".
- [ ] **Step 3: `rascunho.tsx`** (protótipo, linhas 169 a 180):
  - **Contêiner:** `aside` `sticky top-4`, estático abaixo de 980 px, com o título "Seu rascunho de semestre".
  - **Horas:** em `aria-live`, "**H h** de P h pendentes" e o `Medidor`.
  - **Vazio:** a dica "Use “Adicionar ao rascunho” nas sugestões para montar uma proposta."
  - **Lista:** `ol` com código e nome, mais "N delas conta(m) carga de extensão."
  - **Botão:** "Baixar resumo para o tutor (PDF)", que chama `aoImprimir` e fica desabilitado com o rascunho vazio.
  - **Nota:** "O resumo leva os códigos, as competências e as evidências; nenhum dado pessoal. Confira a oferta de turmas no SIGAA antes da matrícula."
- [ ] **Step 4: Ligar no `fluxo.tsx`.** `aoImprimir = () => window.print()`. O filtro volta a `"todas"` a cada recomendação nova.
- [ ] **Step 5: Verificar:** `npx tsc --noEmit && npm run lint`. No navegador, com o exemplo e UX/UI + web, confira:
  - as contagens dos filtros e a filtragem;
  - adicionar e remover do rascunho, com a trilha indo para o passo 4;
  - que trocar uma profissão esconde as sugestões e mantém o rascunho;
  - o "Ver todas";
  - a nota da SMD0057, se ela aparecer.
- [ ] **Step 6: Commit:** `git commit -am "Discente (front): sugestões com filtros, evidências e rascunho de semestre"`

### Task 10: Fora das sugestões e resumo para impressão

**Files:**
- Create: `frontend/src/app/discente/fora-das-sugestoes.tsx`, `frontend/src/app/discente/resumo-impressao.tsx`
- Modify: `fluxo.tsx`, `frontend/src/app/globals.css`

**Interfaces:**
- Produces:
  - `ForaDasSugestoes({ fora: Recomendacao["foraDasSugestoes"] })`
  - `ResumoParaImpressao({ recomendacao, rascunho, trajetoria })`, que renderiza `<section id="resumo-tutor" className="hidden print:block">`.

- [ ] **Step 1: `fora-das-sugestoes.tsx`** (protótipo, linhas 184 a 200):
  - **Cabeçalho:** "O que nenhuma optativa do curso cobre" e o texto "Para chegar a essas profissões, estas competências vão exigir caminhos fora da matriz: projetos de extensão, monitoria, estágio, cursos livres."
  - **Card de lacunas** (`bg-lacuna-bg`): "N lacunas essenciais longe de qualquer sugestão", com a lista "**rótulo** · profissão".
  - **Card de tecnologias** (`bg-surface-sunken`): "N tecnologias que os documentos não citam", o texto "Podem ser usadas em sala sem estar na ementa. Pergunte aos docentes antes de procurar fora." e os chips com `PontoSituacao status="NAO_DOCUMENTADA"`. São 8 visíveis e um botão "+ K outras" que expande (`aria-expanded`).
  - **Vazios:** o card some quando a lista dele está vazia, e a seção some quando as duas estão.
  - **Ligação:** no `fluxo.tsx`, a seção é renderizada sempre que há recomendação, mesmo com `itens` vazio.
- [ ] **Step 2: `resumo-impressao.tsx`**, com o conteúdo da spec:
  - **Topo:** "Trilha · rascunho de semestre", a data de hoje (`toLocaleDateString("pt-BR")`), a estrutura e o turno, as profissões-alvo e a carga optativa pendente.
  - **Por componente:** código, nome, CH, as etiquetas, as 5 primeiras evidências (rótulo e situação) e a ementa.
  - **Rodapé:** o aviso do GPT e "Confira a oferta de turmas no SIGAA antes da matrícula."
  - Nenhum campo de dado pessoal.
- [ ] **Step 3: `globals.css`.** Uma regra `@media print { body * { visibility: hidden } #resumo-tutor, #resumo-tutor * { visibility: visible } #resumo-tutor { position: absolute; inset: 0 auto auto 0; width: 100% } }`, com fundo branco e texto preto dentro do resumo.
- [ ] **Step 4: Verificar:** `npx tsc --noEmit && npm run lint`. No navegador, emule a mídia de impressão (`javascript_tool` ou a prévia de impressão) e confirme que só o resumo aparece. Confirme também o "+ K outras".
- [ ] **Step 5: Commit:** `git commit -am "Discente (front): o que nenhuma optativa cobre e resumo imprimível para o tutor"`

### Task 11: Verificação final e descrição do PR

**Files:**
- Modify: nada no código, salvo correções que esta verificação encontrar.

- [ ] **Step 1: Bateria completa:** `cd backend && ./mvnw verify` e `cd frontend && npm run lint && npx tsc --noEmit && npm test && npm run build`. Tudo deve passar.
- [ ] **Step 2: Navegador, em 1440 px e 375 px:**
  - o fluxo completo com o exemplo, sem rolagem horizontal em 375 px;
  - a navegação por teclado: área de soltar, cards, filtros, botões e "Por que isto?";
  - a comparação visual com a prancha do protótipo;
  - um screenshot de cada largura como prova.
- [ ] **Step 3: Descrição do PR #14.** Pedir a aprovação do usuário antes de publicar. Depois, `gh pr edit 14 --repo precavidos/trilha --body-file <arquivo>` com uma seção nova "Tela do discente":
  - o que mudou;
  - "a ordem e a pontuação das sugestões não mudam (teste `recomendacaoDoExemploNaoMuda`)";
  - o histórico de exemplo é fictício;
  - a verificação.

  O texto atual do PR fica preservado.
- [ ] **Step 4: Push** da branch só com a aprovação do usuário: `git push`.
