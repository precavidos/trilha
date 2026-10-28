# Front novo a partir do protótipo do Claude Design: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a interface do Trilha pela do protótipo do Claude Design, com o design system traduzido para Tailwind v4 e os dados reais da API.

**Architecture:** Os tokens do protótipo viram o tema do Tailwind em `globals.css`. Cada classe `tr-*` do `bundle.css` vira um componente React em `components/ui/` (genéricos) ou `components/trilha/` (marca e domínio), estilizado só com utilidades. Os cálculos de exibição ficam em funções puras em `lib/calculos.ts`, testadas com `node --test`. O backend ganha um único campo aditivo: `competencias` em `/api/resumo`.

**Tech Stack:** Next.js 16.4.3 (App Router, `cacheComponents`), React 19, Tailwind CSS 4, TypeScript; Spring Boot 4 / Java 21 no backend; Node 24 local, 22 na CI (≥ 22.18, que já executa TypeScript).

**Spec:** [`docs/superpowers/specs/2026-10-27-front-claude-design-design.md`](../specs/2026-10-27-front-claude-design-design.md)

## Global Constraints

- O protótipo é a referência visual: a Task 1 copia as pranchas para `docs/design/claude-design/`, e cada valor (cor, raio, tamanho de fonte, espaçamento, SVG) é traduzido de lá, sem redesenhar.
- Só utilidades do Tailwind nos componentes. CSS global apenas para tokens, `@theme`, `@utility bg-topo-painel`, foco, `prefers-reduced-motion` e `summary::-webkit-details-marker`.
- Nenhuma dependência nova de npm ou Maven.
- Tema por `prefers-color-scheme`, sem botão de alternar.
- Layout padrão é o de celular; os quebras de 760 px do protótipo viram o prefixo `md:`.
- Contêiner com no máximo 1200 px, `px-4 md:px-8`. Nenhuma rolagem horizontal em 375 px.
- Toda situação aparece como ícone **e** palavra (`ChipSituacao`); nunca só cor.
- Similaridades e limiares exibidos com **3 casas decimais** (`0,879`, `0,880`); o escore com 2 (`2,03`). Com 2 casas, uma similaridade de 0,879 aparece como "0,88" e parece atingir o limiar de parcial.
- Paginação das competências: 25 por vez, com "Mostrar mais N".
- Textos em pt-BR. Rótulos da ESCO exibidos como vêm da API (português europeu).
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Contagem zerada:** uma barra de cobertura com 0 competências deve ficar toda neutra (`vazio`). O protótipo a pinta toda de "coberta". Teste em `segmentos` (Task 2).
2. **Componente sem nenhuma referência datada** (`mediana`, `maisAntiga` e `maisRecente` nulos): a linha da bibliografia mostra "sem referências datadas" no lugar da linha do tempo, sem `NaN%`, e não entra nos KPIs. Testes em `extremosDaBibliografia` e `contarBibliografiasAntigas` (Task 2); verificação visual na Task 6.
3. **Backend fora do ar ao abrir a coordenação:** aviso com `role="alert"` e "Tentar de novo", que recupera sem recarregar a página quando o backend volta. Verificação manual na Task 5.
4. **Trocar de profissão enquanto a lista carrega:** a lista nunca mostra competências de outra profissão (o `useApi` descarta respostas de caminho antigo). Verificação manual na Task 5.
5. **Nomes longos em 375 px** (por exemplo "Avaliação ética e de vieses em sistemas e conteúdos de IA"): quebram linha dentro da coluna, sem empurrar o layout para fora da tela. Verificação na Task 8.

---

## Mapa de arquivos

| Arquivo | Responsabilidade | Task |
|---|---|---|
| `docs/design/claude-design/*` | cópia de referência do protótipo (5 pranchas, `tokens.css`, `bundle.css`) | 1 |
| `frontend/public/trilha.svg`, `frontend/public/topo-painel.svg` | logo e textura | 1 |
| `frontend/src/app/icon.svg` | favicon (cópia do logo); substitui `favicon.ico` | 1 |
| `frontend/src/app/globals.css` | tokens, tema, utilidade de textura, globais mínimos | 1 |
| `frontend/src/app/layout.tsx` | fontes, fundo, contêiner, `BarraTopo`, rodapé | 1, 4 |
| `frontend/src/lib/cx.ts` | junta classes | 1 |
| `frontend/src/lib/formato.ts` | movido de `app/coordenacao/formato.ts` + `formatarSimilaridade` | 1 |
| `frontend/src/lib/calculos.ts` + `calculos.test.ts` | cálculos de exibição | 2 |
| `backend/.../analise/AnaliseService.java` | campo `competencias` no `Resumo` | 3 |
| `frontend/src/lib/api.ts` | tipos `Resumo.competencias`, `Sobre`, `Limiares` | 3 |
| `frontend/src/lib/use-api.ts` | `recarregar()` | 4 |
| `frontend/src/components/ui/*.tsx` | design system genérico | 4 |
| `frontend/src/components/trilha/*.tsx` | peças de marca e domínio | 5, 6, 7 |
| `frontend/src/app/**/page.tsx` | telas | 5, 6, 7 |
| `docs/validacao/acessibilidade.md` | relatório axe | 8 |

---

### Task 1: Referência do protótipo e fundação visual

**Files:**
- Create: `docs/design/claude-design/` (Inicio, Main, Bibliografia, SobreIa e Discente `.dc.html`, `tokens.css`, `bundle.css`, `README.md`)
- Create: `frontend/public/trilha.svg`, `frontend/public/topo-painel.svg`, `frontend/src/app/icon.svg`, `frontend/src/lib/cx.ts`
- Move: `frontend/src/app/coordenacao/formato.ts` → `frontend/src/lib/formato.ts` (atualizar os imports existentes)
- Modify: `frontend/src/app/globals.css` (substituir a paleta inteira), `frontend/src/app/layout.tsx` (fontes e fundo)
- Delete: `frontend/src/app/favicon.ico`

**Interfaces:**
- Produces: utilidades `bg-canvas`, `bg-surface`, `bg-surface-sunken`, `text-ink`, `text-ink-muted`, `border-line`, `border-line-strong`, `bg-panel`, `bg-panel-raised`, `text-on-panel`, `text-on-panel-muted`, `bg-lime`, `text-on-lime`, `bg-lime-soft`, `bg-green`, `bg-sky`, `bg-cream`, `text-/bg-coberta`, `bg-coberta-bg`, `text-/bg-parcial`, `bg-parcial-bg`, `bg-parcial-mark`, `text-/bg-lacuna`, `bg-lacuna-bg`; `rounded-sm` (8 px), `rounded-md` (16 px), `rounded-lg` (28 px); `shadow-card`; `font-display`, `font-sans`, `font-mono`; `bg-topo-painel`; classe `on-panel` (foco lima)
- Produces: `cx(...classes: (string | false | null | undefined)[]): string`
- Produces: `formatarSimilaridade(n: number): string` (3 casas, pt-BR), além de `formatarDecimal`, `formatarPorcento`, `SITUACOES` e `RELACOES`, que já existem

- [ ] **Step 1: Copiar a referência do protótipo**

Ler as pranchas pelo Artifact `read` (url `https://claude.ai/artifact/GXw9GtHywMj5JwPNQaAyeB`, paths `project/*.dc.html`, `project/ds/trilha/tokens.css`, `project/ds/trilha/components/bundle.css`) e copiar para `docs/design/claude-design/` sem alterar. Ler também os 3 assets: `0239ad7f22009800903032cd61380faf` (logo) e `ad613f555d09fcc6949a37be4972fa83` (relevo lima). O `README.md` diz em uma linha que é uma cópia de referência do protótipo do Claude Design, com a data de 27/10/2026, e que vale apenas como referência visual.

- [ ] **Step 2: Assets**

Logo → `public/trilha.svg` e `src/app/icon.svg`; relevo lima → `public/topo-painel.svg`. Apagar `src/app/favicon.ico`.

- [ ] **Step 3: Reescrever `globals.css`**

`@import "tailwindcss";`, os tokens de cor de `tokens.css` (claro em `:root`, escuro em `@media (prefers-color-scheme: dark) { :root {…} }`), `--shadow-card` e `@theme inline` com:
- `--color-*` para cada token;
- `--radius-sm: 8px`, `--radius-md: 16px`, `--radius-lg: 28px`;
- `--shadow-card: var(--sombra-card)`, com o valor do protótipo definido como `--sombra-card` no `:root` claro e `none` no escuro (nome diferente para não colidir com a variável do tema);
- `--font-display: var(--font-figtree)`, `--font-sans: var(--font-atkinson)`, `--font-mono` como no protótipo.

Mais:
- `@utility bg-topo-painel { background-image: url("/topo-painel.svg"); background-size: cover; background-position: center; }`;
- `body { background: var(--canvas); color: var(--ink); }`;
- `:focus-visible` com contorno `3px solid var(--focus)` e afastamento de 2 px, e `.on-panel :focus-visible { outline-color: var(--focus-on-panel); }`;
- o bloco de `prefers-reduced-motion` atual;
- `summary::-webkit-details-marker { display: none; }`.

- [ ] **Step 4: Fontes no `layout.tsx`**

Somar `Figtree` (pesos `600` e `800`, `variable: "--font-figtree"`) ao `Atkinson_Hyperlegible` existente, ambas de `next/font/google`. O `<body>` usa `bg-canvas text-ink font-sans`. Header e rodapé ficam como estão; a Task 4 os troca.

- [ ] **Step 5: `cx.ts` e mudança do `formato.ts`**

Criar `cx` (junta os argumentos verdadeiros com espaço). Mover `formato.ts` para `lib/` com `git mv`, ajustar os imports em `app/coordenacao/*` e somar `formatarSimilaridade` (`Intl.NumberFormat("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })`).

- [ ] **Step 6: Verificar**

Run: `cd frontend && npm run lint && npm run build`
Expected: os dois passam. As telas antigas podem ficar visualmente quebradas (as classes `bg-accent` e afins deixam de existir); elas são substituídas nas Tasks 5 a 7.

- [ ] **Step 7: Commit**

```bash
git add docs/design frontend
git commit -m "Front: referência do protótipo, tokens do design system e fontes"
```

---

### Task 2: Cálculos de exibição, com testes

**Files:**
- Create: `frontend/src/lib/calculos.ts`, `frontend/src/lib/calculos.test.ts`
- Modify: `frontend/package.json` (script `test`), `frontend/tsconfig.json` (`"allowImportingTsExtensions": true`), `.github/workflows/ci.yml` (passo `npm test` no job `frontend`, depois do lint)

**Interfaces:**
- Consumes: tipos `Contagem` e `IdadeBibliografia` de `./api` (só `import type`, apagado em tempo de execução)
- Produces:
  - `type Segmento = "lacuna" | "parcial" | "coberta" | "vazio"`
  - `segmentos(c: Contagem, n: number): Segmento[]`
  - `contarBibliografiasAntigas(linhas: IdadeBibliografia[]): number`
  - `extremosDaBibliografia(linhas: IdadeBibliografia[]): { maisAntiga: number; maisRecente: number } | null`
  - `posicaoNoEixo(ano: number, inicio: number, fim: number): number` (em %, uma casa decimal, limitada a 0–100)
  - `larguraDaSimilaridade(sim: number): number` (em %, inteiro, faixa de 0,80 a 0,92, limitada a 0–100)
  - `const EIXO_INICIO = 1960`

- [ ] **Step 1: Escrever os testes**

`calculos.test.ts` com `node:test` e `node:assert/strict`, importando de `"./calculos.ts"`. O helper `bib(over)` monta uma `IdadeBibliografia` com padrões `{codigo:"X", nome:"X", referencias:8, comAno:8, mediana:2008, maisAntiga:2000, maisRecente:2010, fracaoComMaisDe10Anos:1}`.

```ts
test("segmentos divide a barra em lacunas, parciais e cobertas", () => {
  const s = segmentos({ lacuna: 50, parcial: 32, coberta: 20 }, 20);
  assert.equal(s.length, 20);
  assert.deepEqual(
    [s.filter((x) => x === "lacuna").length, s.filter((x) => x === "parcial").length, s.filter((x) => x === "coberta").length],
    [10, 6, 4],
  );
  assert.equal(s[0], "lacuna");
  assert.equal(s[19], "coberta");
});
test("segmentos com contagem zerada fica todo vazio", () => {
  assert.deepEqual(segmentos({ lacuna: 0, parcial: 0, coberta: 0 }, 4), ["vazio", "vazio", "vazio", "vazio"]);
});
test("segmentos nunca passa de n quando o arredondamento soma demais", () => {
  assert.equal(segmentos({ lacuna: 1, parcial: 1, coberta: 0 }, 3).length, 3);
});
test("contarBibliografiasAntigas conta metade ou mais acima de 10 anos e ignora sem ano", () => {
  assert.equal(contarBibliografiasAntigas([
    bib({ fracaoComMaisDe10Anos: 0.5 }), bib({ fracaoComMaisDe10Anos: 0.49 }),
    bib({ comAno: 0, fracaoComMaisDe10Anos: 0, mediana: null, maisAntiga: null, maisRecente: null }),
  ]), 1);
});
test("extremosDaBibliografia ignora componentes sem referência datada", () => {
  assert.deepEqual(extremosDaBibliografia([
    bib({ maisAntiga: 1964, maisRecente: 2011 }), bib({ maisAntiga: 1999, maisRecente: 2023 }),
    bib({ comAno: 0, mediana: null, maisAntiga: null, maisRecente: null }),
  ]), { maisAntiga: 1964, maisRecente: 2023 });
  assert.equal(extremosDaBibliografia([bib({ comAno: 0, mediana: null, maisAntiga: null, maisRecente: null })]), null);
});
test("posicaoNoEixo é percentual com uma casa e limitado ao eixo", () => {
  assert.equal(posicaoNoEixo(2008, 1960, 2026), 72.7);
  assert.equal(posicaoNoEixo(2016, 1960, 2026), 84.8);
  assert.equal(posicaoNoEixo(1955, 1960, 2026), 0);
  assert.equal(posicaoNoEixo(2030, 1960, 2026), 100);
});
test("larguraDaSimilaridade mapeia 0,80–0,92 para 0–100", () => {
  assert.equal(larguraDaSimilaridade(0.879), 66);
  assert.equal(larguraDaSimilaridade(0.75), 0);
  assert.equal(larguraDaSimilaridade(0.95), 100);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Script em `package.json`: `"test": "node --test \"src/**/*.test.ts\""` (glob entre aspas, expandido pelo próprio Node).
Run: `cd frontend && npm test`
Expected: FAIL, porque `./calculos.ts` não existe.

- [ ] **Step 3: Implementar `calculos.ts`**

`segmentos`: com total 0, `n` vezes `"vazio"`. Senão, `l = round(lacuna/t·n)` e `p = min(round(parcial/t·n), n − l)`; o resto vira `"coberta"`, na ordem lacunas → parciais → cobertas. Os demais seguem das assinaturas e dos testes.

- [ ] **Step 4: Rodar e ver passar**

Run: `cd frontend && npm test && npm run lint && npm run build`
Expected: 7 testes passam; lint e build passam (o `allowImportingTsExtensions` permite o import com `.ts`).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/calculos.ts frontend/src/lib/calculos.test.ts frontend/package.json frontend/tsconfig.json .github/workflows/ci.yml
git commit -m "Front: cálculos de exibição com testes (node --test) e passo na CI"
```

---

### Task 3: Campo `competencias` no `/api/resumo`

**Files:**
- Modify: `backend/src/main/java/br/ufc/trilha/analise/AnaliseService.java` (record `Resumo` e `resumo()`)
- Test: `backend/src/test/java/br/ufc/trilha/TrilhaBackendApplicationTests.java`
- Modify: `frontend/src/lib/api.ts`

**Interfaces:**
- Produces (JSON): `/api/resumo` ganha `"competencias": 311`, o número de entradas em `analise.competencias()`
- Produces (TS), em `api.ts`:
  - `Resumo.competencias: number`;
  - `export type Limiares = { cobertaSimilaridade: number; cobertaEscore: number; parcialSimilaridade: number; parcialEscore: number }`;
  - `export type Sobre = { metadados: Metadados; modeloDeLinguagem: string; limiares: Limiares }`, movido de `app/sobre-ia/configuracao.tsx`.

- [ ] **Step 1: Escrever o teste**

Em `resumoTrazSeisProfissoes`, somar `.andExpect(jsonPath("$.competencias", is(311)))`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend && ./mvnw -q test -Dtest=TrilhaBackendApplicationTests`
Expected: FAIL, porque o campo `$.competencias` não existe.

- [ ] **Step 3: Implementar**

`Resumo` ganha `int competencias` logo depois de `componentesComBibliografia`, preenchido com `analise.competencias().size()`. Em `api.ts`, somar os tipos acima; `configuracao.tsx` passa a importar `Sobre` de `@/lib/api`.

- [ ] **Step 4: Rodar e ver passar**

Run: `cd backend && ./mvnw -q verify` e `cd frontend && npm run build`
Expected: os dois passam.

- [ ] **Step 5: Commit**

```bash
git add backend frontend/src/lib/api.ts frontend/src/app/sobre-ia/configuracao.tsx
git commit -m "API: total de competências no resumo"
```

---

### Task 4: Componentes `ui` e moldura das páginas

**Files:**
- Create em `frontend/src/components/ui/`: `Botao.tsx`, `Card.tsx`, `Painel.tsx`, `Kpi.tsx`, `ChipSituacao.tsx` (exporta `ChipSituacao` e `PontoSituacao`), `BarraCobertura.tsx`, `FiltroPilulas.tsx`, `Aviso.tsx`, `BarraTopo.tsx`, `ErroDaApi.tsx`
- Modify: `frontend/src/lib/use-api.ts`, `frontend/src/app/layout.tsx`

**Interfaces:**
- Consumes: `cx`, `segmentos`, `SITUACOES`, os tokens da Task 1
- Produces (props; elementos nativos repassam o restante das props):
  - `Botao({ variante: "lima" | "painel" | "fantasma", icone?: ReactNode, href?: string, ...button })`: com `href` vira `<Link>`. Altura mínima de 44 px, `rounded-full`, `px-6`, fonte de 14 px em negrito, borda de 2 px. Fantasma: borda `line-strong` e hover `surface-sunken`. Desabilitado: `cursor-progress` e opacidade de 75%.
  - `Card({ as?: ElementType, className?, children })`: `bg-surface rounded-lg shadow-card`; o padding fica com quem usa.
  - `Painel({ as?, relevo?: boolean, className?, children })`: `bg-panel text-on-panel rounded-lg p-6 md:p-8 on-panel`, mais `bg-topo-painel` quando `relevo`.
  - `Kpi({ valor: ReactNode, denominador?: ReactNode, rotulo: string, variante?: "padrao" | "painel" | "lima", relevo?: boolean, href?: string, destaque?: "lacuna" })`: valor em `font-display` de 56/56 px, peso 800, `tracking-[-0.03em]`; denominador em `<small>` de 18 px; rótulo de 14/20 px.
  - `ChipSituacao({ status: Status })` e `PontoSituacao({ status: Status, tamanho?: "normal" | "grande" })`: ponto de 12 px (grande: 18 px, borda de 3 px) com borda `currentColor`; parcial com `linear-gradient` meio cheio; coberta cheia.
  - `BarraCobertura({ contagem: Contagem, segmentos: number, fina?: boolean, legenda?: boolean })`: barra com `aria-hidden`, altura de 28 px (fina: 10 px), espaço de 3 px (fina: 2 px); `vazio` usa `bg-surface-sunken`. A legenda é `<ul>` com quadradinhos e números em negrito.
  - `FiltroPilulas<T extends string>({ legenda: string, nome: string, opcoes: { valor: T; rotulo: string; contagem: number; status?: Status }[], valor: T, aoMudar(v: T): void })`: `fieldset` com `legend` `sr-only`; cada `label` contém um `input type="radio"` transparente sobre a pílula; marcada `has-checked:bg-panel has-checked:text-on-panel has-checked:border-panel`; foco `has-focus-visible:outline-3`.
  - `Aviso({ tom: "atencao" | "info", role?: "alert" | "status", children })`: atenção usa `bg-parcial-bg text-parcial` em negrito; info usa `bg-sky text-ink` com peso normal; ícone de informação de 22 px do protótipo.
  - `ErroDaApi({ erro: string, aoTentarDeNovo(): void })`: `Aviso` de atenção com `role="alert"`, o texto "Não foi possível falar com o servidor da análise.", o detalhe e `Botao` fantasma "Tentar de novo".
  - `BarraTopo()` (cliente): barra `bg-panel rounded-full`, marca com `trilha.svg` de 32 px e "Trilha" em `font-display` de 22 px, e `nav aria-label="Perfil"` com Coordenação (`/coordenacao`), Discente (`/discente`, mais a tag "em breve") e Sobre a IA (`/sobre-ia`). O item ativo (`pathname` igual ou começando com o `href` + `/`) recebe `aria-current="page"` e `bg-lime text-on-lime`. No celular quebra linha e o `nav` rola na horizontal.
  - `useApi` passa a retornar também `recarregar(): void`, que refaz o GET do caminho atual.

- [ ] **Step 1: `recarregar` no `useApi`**

Um contador `tentativa` em estado entra nas dependências do efeito; `recarregar` o incrementa e limpa `dados` e `erro`.

- [ ] **Step 2: Componentes `ui`**

Traduzir de `docs/design/claude-design/bundle.css`: `tr-btn`, `tr-iconbtn`, `tr-card`, `tr-panel`, `tr-topo`, `tr-kpi`, `tr-status`, `tr-dot`, `tr-bar`, `tr-legend`, `tr-pills`, `tr-pill`, `tr-notice`, `tr-topbar`, `tr-brand`, `tr-switch`, `tr-tag`, com as props da seção Interfaces.

- [ ] **Step 3: Moldura no `layout.tsx`**

O `<body>` passa a ter o link "Pular para o conteúdo" (oculto até receber foco, depois `bg-lime text-on-lime rounded-full`) e um contêiner `mx-auto max-w-[1200px] px-4 md:px-8 pt-6 pb-12 flex flex-col gap-8` com `BarraTopo`, `<main id="conteudo">` e um rodapé com `Aviso tom="info"`: "Ferramenta de apoio à decisão. Não substitui o NDE, o GPT nem a coordenação do curso." O cabeçalho e o rodapé antigos saem.

- [ ] **Step 4: Verificar**

Run: `cd frontend && npm run lint && npm run build`
Expected: passam.
Com backend e frontend rodando (`.claude/launch.json`), abrir `http://localhost:3000/sobre-ia` no navegador do app. A barra do topo deve bater com a de `Main.dc.html`, com o item ativo em lima. Tab a partir do topo: primeiro aparece "Pular para o conteúdo", depois os links, com foco lima.

- [ ] **Step 5: Commit**

```bash
git add frontend/src
git commit -m "Front: componentes do design system e moldura das páginas"
```

---

### Task 5: Coordenação: lacunas por profissão-alvo

**Files:**
- Create em `frontend/src/components/trilha/`: `IconeProfissao.tsx`, `CardProfissao.tsx`, `LinhaCompetencia.tsx`, `PainelPorQue.tsx`
- Create: `frontend/src/app/coordenacao/lacunas.tsx` (cliente: estado e chamadas à API)
- Modify: `frontend/src/app/coordenacao/page.tsx`
- Delete: `frontend/src/app/coordenacao/painel.tsx`, `competencias.tsx`, `situacao.tsx`

**Interfaces:**
- Consumes: os componentes `ui` (Task 4), `segmentos`, `larguraDaSimilaridade`, `contarBibliografiasAntigas` (Task 2), `Resumo.competencias`, `Sobre`, `Limiares` (Task 3), `justificar`, `formatarSimilaridade`, `formatarDecimal`, `RELACOES`, `SITUACOES`
- Produces:
  - `IconeProfissao({ id: string })`: os 7 SVGs de `Main.dc.html` (`ux-ui`, `jogos`, `web`, `animacao`, `multimidia`, `audiovisual`, `lente-ia`); um id desconhecido não renderiza nada.
  - `CardProfissao({ id, rotulo, meta, contagem, selecionado, aoEscolher })`: um `button` com `aria-pressed={selecionado}`.
  - `LinhaCompetencia({ item: Item, aberta: boolean, aoAlternar(): void, profissao: string, limiares: Limiares | undefined })`.
  - `PainelPorQue({ item: Item, profissao: string, limiares: Limiares | undefined })`.
  - `const LENTE_IA = "lente-ia"`, exportado de `lacunas.tsx`.

- [ ] **Step 1: `CardProfissao` e `IconeProfissao`**

Traduzir `tr-prof`, `tr-prof--ia`, `tr-prof-head`, `tr-prof-icon` (a borda interna dupla vira `shadow-[inset_0_0_0_3px_var(--panel),inset_0_0_0_5px_var(--cream)]`, e as variantes de selecionado e de IA trocam essas cores), `tr-prof-num` e `tr-prof-meta`. Conteúdo: título, meta, "**N** lacunas de T competências", `BarraCobertura fina segmentos={20}`, "P parciais · C cobertas".

- [ ] **Step 2: `PainelPorQue`**

`Painel` com `tr-why`:
- Título: "Por que “{rotulo}” é {uma lacuna | parcial | coberta}?".
- Linha de descrição: `{tipo} · {fonte} · exigência {relação} para {profissão}`, mais a `descricao` do item.
- "Como a situação foi calculada · sem IA generativa": 3 passos em grade (`md:grid-cols-3`), cada um em `bg-panel-raised rounded-md p-4`:
  1. `formatarSimilaridade(item.similaridade)`, com "maior similaridade com uma ementa (Coberta ≥ {limiar} · Parcial ≥ {limiar})";
  2. `formatarDecimal(item.escore)`, com "escore: quanto essa ementa se destaca das demais (Coberta ≥ … · Parcial ≥ …)";
  3. `PontoSituacao` grande + o rótulo, com a regra: "abaixo dos dois limiares de Parcial" (lacuna), "atinge um limiar de Parcial, não o de Coberta" (parcial) ou "atinge um limiar de Coberta" (coberta).

  Sem `limiares` (a API ainda não respondeu), os parênteses somem.
- "Evidências · ementas mais próximas": `<ol>` de `<details>`, o primeiro com `open`. No `summary`: código em `bg-lime text-on-lime`, nome, similaridade e uma barra de 64×6 px com largura `larguraDaSimilaridade`. No `blockquote`: a ementa, ou "Componente sem ementa no PPC." quando vazia.
- Bloco `tr-ai` (borda tracejada): título, a nota "Um modelo de linguagem redige o texto a partir apenas das evidências acima. Ele não muda a situação calculada." e a máquina de estados de `JustificativaIa`/`TextoJustificativa` de `competencias.tsx` (inicial → gerando → pronta ou erro; aviso de degradada; modelo, data e ementas citadas), com `Botao variante="lima"` e o ícone de brilho do protótipo, e `aria-live="polite"`.

- [ ] **Step 3: `LinhaCompetencia`**

Grade `grid-cols-[1fr_auto]`, que no `md` vira `md:grid-cols-[minmax(0,2.2fr)_auto_minmax(0,1.6fr)_auto]`. Colunas:
1. nome em negrito, tag "IA" quando `fonte !== "ESCO"`, e a linha `{tipo} · {ESCO | Extensão IA} · {relação}`;
2. `ChipSituacao`;
3. ementa mais próxima, com o código em `bg-surface-sunken` e "mais próxima · similaridade {3 casas}" (no celular ocupa a linha inteira);
4. `Botao` "Por que isto?", fantasma quando fechado e painel quando aberto, com `aria-expanded`, `aria-controls` e um `sr-only` com " — {rotulo}".

Quando aberta, a linha ganha `bg-surface-sunken rounded-md` e o `PainelPorQue` aparece logo abaixo, com `id` igual ao `aria-controls`.

- [ ] **Step 4: `lacunas.tsx` e `page.tsx`**

`page.tsx` (servidor) exporta `metadata = { title: "Coordenação · Trilha" }` e renderiza `<Lacunas />`.

`Lacunas` (cliente) chama `useApi` para `/api/resumo`, `/api/bibliografia`, `/api/sobre` e para a lista da selecionada (`/api/lente-ia` quando a selecionada é `LENTE_IA`; senão `/api/profissoes/{id}/lacunas`). O conteúdo segue a tabela "/coordenacao" da spec:
- cabeçalho: kicker, `h1` `font-display` de 40/44 px (32/36 px no celular), texto e `Botao` fantasma "Como isto é calculado" → `/sobre-ia`;
- 4 `Kpi`: o 1º com `variante="painel" relevo`, o 3º com `destaque="lacuna"` e o 4º com `variante="lima" href="/coordenacao/bibliografia"` e rótulo terminando em " →";
- "Escolha a profissão-alvo", com a definição de lacuna e a grade de `CardProfissao`;
- a profissão selecionada num `Card` com `p-8`: título, subtítulo (ocupação ESCO com link e itinerário, ou o texto da lente de IA), `BarraCobertura segmentos={24} legenda`, `FiltroPilulas` (Todas/Lacunas/Parciais/Cobertas, com contagens) e o `<ul>` de `LinhaCompetencia`;
- a nota `aria-live` "Mostrando X de Y competências deste filtro, lacunas primeiro." e o `Botao` fantasma "Mostrar mais N".

Estado: `escolhida` (padrão: a primeira profissão), `filtro`, `limite` (25) e `aberta` (id da competência). Trocar de profissão reinicia filtro, limite e `aberta`; trocar de filtro reinicia limite e `aberta`.

Erros: se `/api/resumo` falhar, mostrar só `ErroDaApi` com `recarregar` do resumo; se a lista falhar, `ErroDaApi` dentro do card. Carregando: `<p aria-busy="true">Carregando a análise do PPC…</p>`.

- [ ] **Step 5: Apagar os componentes antigos**

`git rm frontend/src/app/coordenacao/{painel,competencias,situacao}.tsx`. A tabela de bibliografia (`bibliografia.tsx`) fica até a Task 6.

- [ ] **Step 6: Verificar**

Run: `cd frontend && npm test && npm run lint && npm run build`
Expected: passam.
Reiniciar o backend (para que ele carregue a análise do `main`) e abrir `/coordenacao`. Conferir:
- **(a)** os KPIs mostram 57/80, 311, 10/13 e 57/57;
- **(b)** a comparação lado a lado com `Main.dc.html` bate;
- **(c)** escolher "Lente transversal de IA" lista 13 itens, com tag IA;
- **(d)** o filtro "Lacunas" e "Mostrar mais" funcionam;
- **(e)** "Por que isto?" abre e fecha, e "Gerar justificativa" sem chave mostra o aviso de degradada;
- **(f)** *Review Focus 4:* clicar rápido em 3 profissões seguidas; a lista final é da última clicada;
- **(g)** *Review Focus 3:* parar o backend e recarregar mostra o aviso com "Tentar de novo"; ao subir o backend de novo, clicar nele recupera a tela sem recarregar a página.

- [ ] **Step 7: Commit**

```bash
git add -A frontend/src
git commit -m "Front: coordenação com cards de profissão, linhas e painel Por que isto?"
```

---

### Task 6: Página da bibliografia

**Files:**
- Create: `frontend/src/components/trilha/LinhaBibliografia.tsx`, `frontend/src/app/coordenacao/bibliografia/page.tsx`, `frontend/src/app/coordenacao/bibliografia/conteudo.tsx` (cliente)
- Delete: `frontend/src/app/coordenacao/bibliografia.tsx`

**Interfaces:**
- Consumes: `posicaoNoEixo`, `EIXO_INICIO`, `contarBibliografiasAntigas`, `extremosDaBibliografia`, `formatarPorcento`, `Kpi`, `Card`, `ErroDaApi`
- Produces: `LinhaBibliografia({ linha: IdadeBibliografia, anoDeReferencia: number })`

- [ ] **Step 1: `LinhaBibliografia`**

Grade `grid-cols-[1fr_auto]`, que no `md` vira `md:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_auto]`. Colunas:
1. código em `font-mono`, nome e o subtítulo "{comAno} de {referencias} referências com ano · mediana {mediana}";
2. a linha do tempo `relative h-7` (no celular vai para a 2ª linha, ocupando a largura toda), com `role="img"` e `aria-label="De {maisAntiga} a {maisRecente}, mediana {mediana}"`. Por dentro:
   - eixo de 2 px `bg-line` em `top-[13px]`;
   - intervalo `bg-green h-2.5 rounded-[5px] top-[9px]`, com `left` = `posicaoNoEixo(maisAntiga)` e `right` = `100 − posicaoNoEixo(maisRecente)`;
   - mediana `bg-ink w-1 h-5 top-1 -ml-0.5`;
   - corte com borda tracejada `border-lacuna` em `posicaoNoEixo(anoDeReferencia − 10)`;
3. "{formatarPorcento(fracao)} > 10 anos" em negrito, em `text-lacuna` quando ≥ 50%.

*Review Focus 2:* com `mediana === null`, a 2ª coluna vira o texto "sem referências datadas" em `text-ink-muted`, sem `role="img"`.

- [ ] **Step 2: Página**

`page.tsx` exporta `metadata = { title: "Idade da bibliografia · Trilha" }` e renderiza `<Conteudo />`. O `Conteudo` usa `/api/resumo` e `/api/bibliografia` e mostra:
- o link "← Lacunas por profissão-alvo", o `h1` "Idade da bibliografia" e o texto "Anos de publicação das referências básicas e complementares de cada componente curricular, segundo o PPC. Cálculo simples, sem nenhum modelo de IA. Ano de referência: {anoDeReferencia}.";
- 4 `Kpi`: antigas/total (painel), `medianaGeralDaBibliografia` e os dois `extremosDaBibliografia` (o último em lima);
- `Card p-8` "Por componente, mais antigas primeiro", com a legenda (intervalo, mediana, corte de 10 anos ({anoDeReferencia − 10})), o eixo com 4 rótulos igualmente espaçados de `EIXO_INICIO` até `anoDeReferencia` (1960, 1982, 2004, 2026) e um `<ol>` de `LinhaBibliografia`.

Erros e carregamento como na Task 5.

- [ ] **Step 3: Remover a tabela antiga**

`git rm frontend/src/app/coordenacao/bibliografia.tsx`.

- [ ] **Step 4: Verificar**

Run: `cd frontend && npm run lint && npm run build`
Expected: passam.
No navegador, o KPI 4 de `/coordenacao` leva a `/coordenacao/bibliografia`. Os KPIs mostram 57/57, 2008, 1964 e 2023; a primeira linha é SMD0149 Mitologias Universais, com mediana 1987; e a comparação com `Bibliografia.dc.html` bate. Na barra do topo, "Coordenação" continua ativo.

- [ ] **Step 5: Commit**

```bash
git add -A frontend/src
git commit -m "Front: página da idade da bibliografia com linha do tempo"
```

---

### Task 7: Trilha de passos, Início, Sobre a IA e Discente

**Files:**
- Create: `frontend/src/components/trilha/TrilhaDePassos.tsx`, `frontend/src/components/trilha/Hero.tsx`
- Modify: `frontend/src/app/page.tsx`, `frontend/src/app/sobre-ia/page.tsx`, `frontend/src/app/sobre-ia/configuracao.tsx`, `frontend/src/app/discente/page.tsx`

**Interfaces:**
- Consumes: os componentes `ui`, `Sobre`, `useApi`, `ErroDaApi`, `formatarSimilaridade`, `formatarDecimal`
- Produces:
  - `TrilhaDePassos({ passos: { titulo: string; texto: string; tag?: string; tagGenerativa?: boolean }[] })`
  - `Hero()`

- [ ] **Step 1: `TrilhaDePassos`**

Traduzir `tr-trail-wrap`, `tr-trail-line`, `tr-trail`, `tr-step`, `tr-pin` e `tr-step-tag`:
- `<ol>` em grade `md:grid-cols-(--passos)`, com `style={{ "--passos": "repeat(N, minmax(0,1fr))" }}`;
- passos pares `md:even:pt-7`;
- pino de 44 px com `rounded-[50%_50%_50%_8px] -rotate-45` e o número `rotate-45` em `font-display`:
  - 1º passo `bg-lime`;
  - último passo `bg-cream` com anel interno `panel`;
  - os demais `bg-panel`;
  - todos com um anel externo de 4 px na cor `canvas`;
- tag `bg-surface-sunken`, ou `bg-lime` quando `tagGenerativa`.

A linha ondulada é um `<svg viewBox="0 0 100 72" preserveAspectRatio="none" aria-hidden>`, visível só a partir do `md`, com o caminho gerado assim:

```ts
function caminho(n: number) {
  const passo = 100 / n, xs = Array.from({ length: n }, (_, i) => 2 + i * passo);
  let d = `M${xs[0]} 22`;
  for (let i = 1; i < n; i++) {
    const y0 = i % 2 ? 22 : 50, y1 = i % 2 ? 50 : 22, meio = (xs[i - 1] + xs[i]) / 2;
    d += ` C ${meio} ${y0}, ${meio} ${y1}, ${xs[i]} ${y1}`;
  }
  return d + ` C ${xs[n - 1] + 10} ${n % 2 ? 22 : 50}, 96 30, 100 30`;
}
```

Traço `stroke-line-strong`, 3 px, `stroke-dasharray="2 9"`, `vector-effect="non-scaling-stroke"`. No celular: `pl-15`, uma linha pontilhada vertical por `before:` e pinos `absolute -left-15`.

- [ ] **Step 2: `Hero` e Início**

`Hero` traduz `tr-hero`:
- `Painel` com relevo, grade `md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]`, `p-6 md:p-14`;
- kicker em lima com o logo de 28 px;
- título `font-display` de 64/60 px (40/42 px no celular) em `text-cream`;
- texto de apoio de 18/28 px em `on-panel-muted`;
- as 3 pílulas (lima, `cream`, `sky`, todas com `text-on-lime`);
- o SVG do caminho de `Inicio.dc.html`, com as cores trocadas por `stroke-lime`, `stroke-cream`, `fill-cream`, `fill-panel`, `fill-lime`, `fill-on-lime` e `fill-on-panel`.

`page.tsx` do Início: `Hero`, `h2` "Por onde você começa?" (`font-display`, 32/36 px) e os 2 `Card p-8`, com o texto e os botões de `Inicio.dc.html`.

- [ ] **Step 3: Sobre a IA**

`page.tsx`, na ordem da spec:
1. o `h1` e o subtítulo;
2. a `TrilhaDePassos` com os 5 passos (textos e tags de `SobreIa.dc.html`);
3. a grade `md:grid-cols-2` com `<Configuracao />` e o `Painel` "Dados tratados e privacidade" (3 itens de `SobreIa.dc.html`);
4. o `Card p-8` "Limitações conhecidas", com 5 itens:
   - os 3 primeiros de `SobreIa.dc.html`;
   - "A demanda de mercado vem das competências que a ESCO associa a cada ocupação; a coleta de vagas brasileiras fica como trabalho futuro.";
   - "Validação com rótulos humanos (`docs/validacao/resultado.md`): em 41 julgamentos, a concordância entre os dois avaliadores da equipe foi de 0,76 (kappa de Cohen). Quando o sistema diz *coberta*, acerta 79% das vezes; quando diz *lacuna*, 57%. *Parcial* é a situação menos confiável: em 9 de 13 casos, os avaliadores disseram que a ementa não trata do tema.";
5. a nota final de `SobreIa.dc.html`.

`configuracao.tsx` vira um `Card p-8` com:
- `dl` de 2 colunas (documento, vocabulário, embeddings "multilingual-e5-small, executado localmente", linguagem "{modelo}, só nas justificativas" e a data formatada em pt-BR);
- os 3 blocos de limiar (`bg-coberta-bg text-coberta` etc., `rounded-md p-3.5`), com "sim. ≥ {3 casas} ou escore ≥ {2 casas}" e "abaixo disso";
- `ErroDaApi` em caso de erro.

- [ ] **Step 4: Discente**

`page.tsx`:
- `h1` "Planeje sua trajetória rumo à profissão que você quer";
- `Aviso tom="atencao" role="status"`;
- `TrilhaDePassos` com os 4 passos de `Discente.dc.html`;
- `Painel relevo` "Como a recomendação vai aparecer", com a etiqueta "ESBOÇO · SEM DADOS REAIS", os 3 blocos `bg-panel-raised` e as 2 linhas de exemplo com os marcadores entre colchetes;
- a nota sobre o GPT.

- [ ] **Step 5: Verificar**

Run: `cd frontend && npm test && npm run lint && npm run build`
Expected: passam.
No navegador: `/`, `/sobre-ia` e `/discente` lado a lado com as pranchas. Em `/sobre-ia`, a configuração mostra "ESCO v1.2.1 + Extensão IA (curada)" e os limiares 0,890, 2,80, 0,880 e 2,40.

- [ ] **Step 6: Commit**

```bash
git add -A frontend/src
git commit -m "Front: início, Sobre a IA e discente com a trilha de passos"
```

---

### Task 8: Verificação final, relatório de acessibilidade e PR

**Files:**
- Create: `docs/validacao/acessibilidade.md`

- [ ] **Step 1: Verificação visual**

Com `resize_window` no navegador do app, para cada uma das 5 rotas: claro e escuro (`colorScheme`), em 1440 px e em 375 px (`preset: "mobile"`). Comparar com as pranchas e corrigir as divergências antes de seguir. *Review Focus 5:* em 375 px, abrir a lente de IA e conferir que "Avaliação ética e de vieses em sistemas e conteúdos de IA" quebra linha sem rolagem horizontal (`document.documentElement.scrollWidth <= innerWidth`).

- [ ] **Step 2: Auditoria axe**

Em cada rota e tema, injetar o axe-core (`https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js`, por um `<script>` criado pelo `javascript_tool`) e rodar `await axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] })`. Em `/coordenacao`, auditar também com um "Por que isto?" aberto. Corrigir as violações e auditar de novo.
Expected: 0 violações em todas as rotas e temas.

- [ ] **Step 3: Relatório**

`docs/validacao/acessibilidade.md`: data, versão do axe, regras (WCAG 2.0 A/AA, 2.1 AA, 2.2 AA), tabela rota × tema com o número de violações, a tabela de contraste dos tokens (da spec) e o que foi verificado manualmente (teclado, 375 px, leitura da situação sem cor).

- [ ] **Step 4: Rodar tudo**

Run: `cd backend && ./mvnw -q verify` e `cd frontend && npm test && npm run lint && npm run build`
Expected: tudo passa.

- [ ] **Step 5: Commit, push e PR**

```bash
git add docs/validacao/acessibilidade.md frontend
git commit -m "Acessibilidade: auditoria axe das 5 telas nos dois temas"
git push -u origin feat/front-claude-design
gh pr create --base main --title "Front novo a partir do protótipo do Claude Design" --body "<resumo, link da spec e do plano, prints de antes e depois>"
```
