# Front novo a partir do protótipo do Claude Design

- **Data:** 27/10/2026
- **Status:** aprovada em brainstorming; aguarda revisão da spec escrita
- **Referência visual:** protótipo "Trilha — protótipo" no Claude Design (cópia em https://claude.ai/artifact/GXw9GtHywMj5JwPNQaAyeB), com 5 pranchas: Início, Coordenação, Bibliografia, Sobre a IA e Discente

## Objetivo

Trocar a interface atual, simples demais para a demonstração e as screenshots do memorial, pela do protótipo, mantendo os dados reais da API. Tem de estar pronta em **28/10**, para que o dia 29/10 fique livre para screenshots, vídeo e montagem do PDF (ver `docs/PLANO.md`).

**Critérios de sucesso**

1. As 5 telas reproduzem o protótipo, nos temas claro e escuro, em 1440 px e em 375 px, sem rolagem horizontal.
2. Todo número exibido vem da API, com uma exceção declarada: os números da validação na página Sobre a IA.
3. A auditoria axe não aponta violações nas 5 rotas e nos 2 temas.
4. Lint, build e testes passam na CI.

**Fora do escopo:** funcionalidade nova no módulo discente, botão para alternar o tema, mudanças no cálculo da análise e qualquer mudança visual que não esteja no protótipo.

## Decisões

| Decisão | Escolha | Motivo |
|---|---|---|
| Como trazer o design | **Traduzir o design system para Tailwind v4, valor por valor** (abordagem B) | Escolha da equipe: um único sistema de estilo, idiomático. A regra é traduzir o `bundle.css` do protótipo, sem redesenhar |
| Tema | Segue `prefers-color-scheme`, sem botão | Mantém o comportamento atual; os tokens já trazem as duas paletas |
| Fontes | Figtree (600, 800) e Atkinson Hyperlegible (400, 700) via `next/font` | Sem dependência do Google Fonts em tempo de execução |
| Paginação das competências | Mantém "Mostrar mais 25" | O protótipo lista tudo, mas 100+ linhas com painel cansam a navegação por teclado |
| Justificativa | Chamada real a `POST /api/justificativas` | O texto do protótipo é de exemplo |
| Backend | Só o campo aditivo `competencias` em `/api/resumo` | O KPI de competências comparadas precisa do total (311), que a API não informa |
| Quem implementa | Só o Guilherme mexe em `frontend/` | O David está no backend e na documentação de submissão |

## 1. Fundação

### Tokens → tema do Tailwind

Em `frontend/src/app/globals.css`, a paleta atual (`background`, `accent`, `border`, `muted`…) é substituída pelos tokens do protótipo:

- **Cores** (`:root` claro; `@media (prefers-color-scheme: dark)` escuro): `canvas`, `surface`, `surface-sunken`, `ink`, `ink-muted`, `line`, `line-strong`, `panel`, `panel-raised`, `on-panel`, `on-panel-muted`, `lime`, `on-lime`, `lime-soft`, `green`, `sky`, `cream`, `coberta`, `coberta-bg`, `parcial`, `parcial-bg`, `parcial-mark`, `lacuna`, `lacuna-bg`, `focus`, `focus-on-panel`. Os valores são os de `ds/trilha/tokens.css` do protótipo.
- `@theme inline` expõe as cores como `--color-*`, gerando utilidades como `bg-panel`, `text-ink-muted` e `border-line-strong`.
- **Raios:** `--radius-sm: 8px`, `--radius-md: 16px`, `--radius-lg: 28px`; o formato de pílula usa `rounded-full`.
- **Sombra:** `--shadow-card`, igual a `none` no tema escuro.
- **Espaçamento:** a escala do protótipo (4/8/12/16/24/32/48 px) coincide com a padrão do Tailwind (`1/2/3/4/6/8/12`). Nada a definir.
- **Fontes:** `--font-display` (Figtree) e `--font-sans` (Atkinson).
- **Breakpoint:** os `@media (max-width: 760px)` do protótipo viram o prefixo `md:`, com o layout de celular como padrão.

### Assets (`frontend/public/`)

| Arquivo | Origem no protótipo | Uso |
|---|---|---|
| `trilha.svg` | logo 64×64 | marca na barra do topo e no hero; também favicon, no lugar de `src/app/favicon.ico` |
| `topo-painel.svg` | relevo lima a 30% | fundo do KPI 1 da coordenação, do hero e do esboço do discente |

A textura vira a utilidade `bg-topo-painel` (`@utility`, com `background-size: cover` e `background-position: center`). O protótipo também define um relevo para o fundo claro (`tr-topo--canvas`), mas nenhuma prancha o usa, então ele fica de fora.

### Globais mínimos

Só o que não tem utilidade equivalente:

- `:focus-visible` com contorno de 3 px em `--focus` e afastamento de 2 px; dentro de `.on-panel`, o contorno usa `--focus-on-panel`.
- O bloco de `prefers-reduced-motion` que já existe.
- `summary::-webkit-details-marker { display: none }`.

### Estrutura

```
frontend/src/
  app/                    rotas (abaixo)
  components/ui/          design system genérico
  components/trilha/      peças de marca e de domínio
  lib/api.ts              cliente da API (existente; ganha o campo competencias)
  lib/use-api.ts          existente; ganha recarregar()
  lib/calculos.ts         funções puras usadas pelas telas, testadas
  lib/formato.ts          movido de app/coordenacao/formato.ts
  lib/cx.ts               junta classes condicionalmente (sem dependência)
```

Os componentes atuais de `app/coordenacao/` (`painel.tsx`, `competencias.tsx`, `situacao.tsx`, `bibliografia.tsx`) e `app/sobre-ia/configuracao.tsx` são reescritos sobre os componentes novos e depois removidos.

## 2. Componentes

Cada classe `tr-*` do protótipo vira um componente com props tipadas. As variantes ficam num objeto `VARIANTES` dentro do componente.

### `components/ui/`

| Componente | Classe de origem | Props |
|---|---|---|
| `Botao` | `tr-btn`, `--lime`, `--panel`, `--ghost`, `tr-iconbtn` | `variante: "lima" \| "painel" \| "fantasma"`, `icone?`, `href?` (vira `<Link>`), demais props de `button` |
| `BarraTopo` | `tr-topbar`, `tr-brand`, `tr-switch`, `tr-tag` | sem props; links de perfil com `aria-current="page"` via `usePathname` (corresponde também às sub-rotas); "Discente" com a tag "em breve" |
| `Card` | `tr-card` | `as?`, `className?`, `children` |
| `Painel` | `tr-panel`, `tr-topo` | `relevo?: boolean`, `as?`, `className?`; aplica `.on-panel` |
| `Kpi` | `tr-kpi`, `--panel`, `--lime`, `tr-kpi-value`, `tr-kpi-label` | `valor`, `denominador?`, `rotulo`, `variante: "padrao" \| "painel" \| "lima"`, `relevo?`, `href?`, `destaque?: "lacuna"` |
| `ChipSituacao` | `tr-status` | `status: Status` |
| `PontoSituacao` | `tr-dot`, `--p`, `--c` | `status`, `tamanho?: "normal" \| "grande"` |
| `BarraCobertura` | `tr-bar`, `--thin`, `tr-legend` | `contagem`, `segmentos: number`, `fina?`, `legenda?` |
| `FiltroPilulas` | `tr-pills`, `tr-pill`, `tr-count` | `legenda`, `opcoes: {valor, rotulo, contagem, status?}[]`, `valor`, `aoMudar`; rádios reais, estilo marcado via `has-checked:` |
| `Aviso` | `tr-notice`, `--info` | `tom: "atencao" \| "info"`, `role?`, `children` |

### `components/trilha/`

| Componente | Classe de origem | Observações |
|---|---|---|
| `Hero` | `tr-hero` e SVG `tr-hero-path` | SVG inline do protótipo, com cores por utilidades `fill-*` e `stroke-*`; os 3 princípios como pílulas |
| `TrilhaDePassos` | `tr-trail-wrap`, `tr-trail`, `tr-trail-line`, `tr-step`, `tr-pin`, `tr-step-tag` | `passos: {titulo, texto, tag?, tagGenerativa?}[]`; o primeiro passo é o marco "aqui" e o último o "destino"; passos pares descem 28 px; a linha ondulada é gerada a partir do número de passos; no celular vira lista vertical com linha pontilhada à esquerda |
| `CardProfissao` | `tr-prof`, `--ia`, `tr-prof-icon`, `tr-prof-num` | `id`, `rotulo`, `meta`, `contagem`, `selecionado`, `aoEscolher`; `button` com `aria-pressed`; ícone por id (7 SVGs do protótipo) |
| `LinhaCompetencia` | `tr-row`, `is-open`, `tr-row-near`, `tr-tag-ia` | `item: Item`, `aberta`, `aoAlternar`; botão "Por que isto?" com `aria-expanded` e nome acessível que inclui a competência; renderiza `PainelPorQue` quando aberta |
| `PainelPorQue` | `tr-panel`, `tr-why`, `tr-why-steps`, `tr-ev`, `tr-simbar`, `tr-ai` | `item`, `profissao`, `limiares`; título "Por que “X” é uma lacuna/parcial/coberta?"; 3 passos (similaridade, escore, situação e regra); evidências em `<details>`, a primeira aberta; justificativa com estados ocioso → gerando → pronta ou degradada |
| `LinhaBibliografia` | `tr-bib`, `tr-tl`, `tr-bib-old`, `tr-axis` | `linha: IdadeBibliografia`, `anoDeReferencia`; intervalo, mediana e corte posicionados em % de 1960 a `anoDeReferencia`; `role="img"` com `aria-label` "De A a B, mediana M"; percentual em destaque quando ≥ 50% |

São componentes de cliente (`"use client"`) `BarraTopo`, `FiltroPilulas`, `CardProfissao`, `LinhaCompetencia`, `PainelPorQue` e as páginas que chamam a API. Os demais são componentes de servidor.

## 3. Telas e dados

O layout raiz (`app/layout.tsx`) tem fundo `canvas`, contêiner de no máximo 1200 px (`px-4 md:px-8`), link "Pular para o conteúdo", `BarraTopo`, `<main id="conteudo">` e o aviso "Ferramenta de apoio à decisão…" no rodapé de cada página.

### `/`: Início (estático)

- `Hero`: kicker "Sistemas e Mídias Digitais · UFC", título "Do PPC de hoje às profissões do futuro", texto de apoio e as pílulas "Toda conclusão com evidência", "A IA só redige justificativas" e "Nenhum dado pessoal enviado".
- "Por onde você começa?", com 2 cards:
  - **Coordenação e NDE:** três chips de exemplo (lacunas, parciais, cobertas) e o botão "Analisar o PPC" → `/coordenacao`.
  - **Discente:** aviso "Em desenvolvimento neste protótipo" e o botão "Ver o que está projetado" → `/discente`.

### `/coordenacao`: lacunas por profissão-alvo

| Bloco | Conteúdo | Fonte |
|---|---|---|
| Cabeçalho | kicker "Coordenação e NDE · SMD Diurno", título "Onde o PPC não acompanha as profissões-alvo", linha com documento, vocabulário e data de geração; botão "Como isto é calculado" → `/sobre-ia` | `GET /api/resumo` → `metadados` |
| KPI 1 (painel, com relevo) | `componentesComEmenta`/`componentes` | `resumo` |
| KPI 2 | `competencias` | `resumo` (campo novo) |
| KPI 3 (valor em cor de lacuna) | `lenteIa.lacuna`/total da lente | `resumo.lenteIa` |
| KPI 4 (lima, link para `/coordenacao/bibliografia`) | bibliografias com `fracaoComMaisDe10Anos ≥ 0,5` / total | `GET /api/bibliografia` |
| Cards | 6 profissões + "Lente transversal de IA"; cada card mostra itinerários (ou "Extensão IA · todas as profissões"), "N lacunas de T competências", barra fina de 20 segmentos, parciais e cobertas | `resumo.profissoes`, `resumo.lenteIa` |
| Selecionada (padrão: a primeira profissão) | título, ocupação ESCO com link (ou o texto da lente), barra de 24 segmentos com legenda, `FiltroPilulas` (Todas, Lacunas, Parciais, Cobertas) e lista de `LinhaCompetencia`, lacunas primeiro, 25 por vez | `GET /api/profissoes/{id}/lacunas` ou `GET /api/lente-ia` |
| "Por que isto?" | ver `PainelPorQue`; os limiares exibidos vêm da API | item da linha, `GET /api/sobre` → `limiares`, `POST /api/justificativas` |

Trocar de profissão volta o filtro para "Todas", fecha o painel aberto e reinicia a paginação.

### `/coordenacao/bibliografia` (rota nova)

- Link "← Lacunas por profissão-alvo", título "Idade da bibliografia" e texto explicando que o cálculo não usa IA, com o ano de referência.
- 4 KPIs:
  1. Componentes com metade ou mais das referências acima de 10 anos / total (painel).
  2. Mediana dos anos medianos (`resumo.medianaGeralDaBibliografia`).
  3. Referência datada mais antiga (menor `maisAntiga`).
  4. Referência datada mais recente (maior `maisRecente`; lima).
- Card "Por componente, mais antigas primeiro", com legenda (intervalo, mediana, corte de 10 anos em `anoDeReferencia − 10`), eixo de 1960 a `anoDeReferencia` e uma `LinhaBibliografia` por componente, na ordem da API.
- A tabela de bibliografia sai de `/coordenacao`.

### `/sobre-ia`

1. Título "Sobre a IA neste sistema" e subtítulo.
2. "Como as conclusões são produzidas": `TrilhaDePassos` com 5 passos: Extração do PPC (sem IA), Vocabulário de competências (curadoria humana), Similaridade semântica (IA local, não generativa), Situação por limiares (sem IA) e Justificativa sob demanda (IA generativa).
3. Dois blocos lado a lado:
   - **Configuração em uso** (`Card`): documento, vocabulário, embeddings, modelo de linguagem, data de geração e os 3 blocos de limiar coloridos. Tudo de `GET /api/sobre`.
   - **Dados tratados e privacidade** (`Painel`): o texto do protótipo.
4. **Limitações conhecidas** (`Card`): os itens do protótipo, com o 4º reescrito para o estado atual (demanda vinda da ESCO, vagas como trabalho futuro), mais um item com o resultado da validação: 41 julgamentos, kappa de Cohen 0,76 entre os 2 avaliadores da equipe, precisão de 79% em "coberta" e de 57% em "lacuna", e "parcial" como a situação menos confiável. **Exceção declarada:** esses números são texto fixo, copiado de `docs/validacao/resultado.md` (congelado), que a página cita.
5. A nota sobre o uso de IA generativa no desenvolvimento.

### `/discente` (estático)

Título "Planeje sua trajetória rumo à profissão que você quer", `Aviso` "Módulo em desenvolvimento…", `TrilhaDePassos` com os 4 passos e o `Painel` "Como a recomendação vai aparecer", marcado como "ESBOÇO · SEM DADOS REAIS", com os marcadores entre colchetes do protótipo.

### Backend: campo `competencias`

- `AnaliseService.Resumo` ganha `int competencias`, o número de entradas em `analise.competencias()` (311 hoje).
- `frontend/src/lib/api.ts`: `Resumo` ganha `competencias: number`.
- A mudança é aditiva; nenhum consumidor quebra.

## 4. Acessibilidade, erros e testes

### Acessibilidade (WCAG 2.2 AA)

- **Contraste:** verificado nos tokens dos dois temas. O texto fica sempre ≥ 4,5:1 (pior caso: `lacuna` sobre `lacuna-bg` no claro, 4,99:1) e bordas e foco ≥ 3:1 (pior caso: `line-strong` sobre `surface`, 4,12:1). `parcial-mark` só aparece em barras com `aria-hidden`, sempre com os números em texto ao lado.
- **Situação nunca só por cor:** o chip sempre traz ícone e palavra.
- **Estrutura:**
  - Um `h1` por página, títulos sem saltos de nível e `section` com `aria-labelledby`.
  - `nav aria-label="Perfil"` com `aria-current`.
  - Cards de profissão como `button aria-pressed`, filtros como `fieldset` + `legend` com `input type="radio"`, e "Por que isto?" com `aria-expanded`.
  - A justificativa usa `aria-live="polite"`; carregamentos, `aria-busy`.
- **Teclado:** foco visível em tudo (laranja; lima nos painéis) e alvos de pelo menos 40 px de altura.
- **Responsivo:** sem rolagem horizontal em 375 px. Linhas de competência e de bibliografia viram 2 colunas, os passos do "Por que isto?" empilham e a trilha vira lista vertical.

### Estados e erros

| Situação | Comportamento |
|---|---|
| Carregando | texto com `aria-busy` no lugar do bloco |
| Backend inacessível | `Aviso` com `role="alert"`: "Não foi possível falar com o servidor da análise.", o detalhe do erro e o botão "Tentar de novo" (`recarregar()` do `useApi`) |
| Profissão desconhecida (404) | o mesmo aviso, com a mensagem da API |
| LLM indisponível | a justificativa mostra o texto degradado da API e a nota de que a versão em linguagem natural não está disponível |
| Evidência sem ementa | "Componente sem ementa no PPC." |

### Testes e verificação

1. **Backend (antes da mudança):** asserção em `TrilhaBackendApplicationTests` de que `/api/resumo` traz `competencias` igual a 311.
2. **`lib/calculos.ts`**, com funções puras e sem imports de runtime, testadas com `node --test` (Node 24 executa TypeScript nativamente):
   - `segmentos(contagem, n)`: divisão da barra entre lacuna, parcial e coberta.
   - `contarBibliografiasAntigas(linhas)`.
   - `extremosDaBibliografia(linhas)`: mais antiga e mais recente.
   - `posicaoNoEixo(ano, inicio, fim)`, em %.
   - `larguraDaSimilaridade(sim)`: barra de 0,80 a 0,92 → 0 a 100%, limitada.

   O script `npm test` roda os testes, e a CI do frontend ganha o passo.
3. **Lint e build** na CI, como hoje.
4. **Verificação visual** no navegador do app: cada rota comparada à prancha correspondente, nos temas claro e escuro, em 1440 px e 375 px.
5. **Auditoria axe** nas 5 rotas e nos 2 temas, com o relatório em `docs/validacao/acessibilidade.md` (anexo do memorial).

## Entrega

- Branch `feat/front-claude-design`, um commit por etapa e um PR.
- Ordem: fundação → `components/ui` → `/coordenacao` (e o campo no backend) → `/coordenacao/bibliografia` → `/sobre-ia`, `/` e `/discente` → verificação (visual e axe).
