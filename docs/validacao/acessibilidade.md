# Relatório de acessibilidade do front

Anexo do memorial. Cobre as 5 telas do front novo (`/`, `/coordenacao`, `/coordenacao/bibliografia`, `/sobre-ia` e `/discente`), nos temas claro e escuro, em 1440 px e em 375 px.

## Método

- **Data:** 27/10/2026.
- **Ferramenta:** axe-core 4.10.2, injetado na página pelo navegador do app.
- **Regras:** `wcag2a`, `wcag2aa`, `wcag21aa` e `wcag22aa` (WCAG 2.0 A/AA, 2.1 AA e 2.2 AA).
- **Chamada:** `await axe.run(document, { runOnly: ["wcag2a","wcag2aa","wcag21aa","wcag22aa"] })`.
- **Temas:** emulação de `prefers-color-scheme` (claro e escuro). Não há botão de alternar. Depois desta auditoria, o app passou a usar sempre o tema claro, como o protótipo: a paleta escura continua nos tokens, mas só vale com `data-theme="dark"`, que nenhuma tela aplica. As colunas "Escuro" registram a auditoria dessa paleta.
- **Dados:** backend local com a análise real (311 competências, 57 componentes com ementa).
- **Estados auditados além da página aberta:** em `/coordenacao`, um "Por que isto?" aberto (1440 px, nos dois temas) e, em 375 px, a lente transversal de IA com o painel aberto na linha "Avaliação ética e de vieses em sistemas e conteúdos de IA".
- **Regras de boas práticas também rodadas** (fora das tags WCAG): `heading-order`, `page-has-heading-one`, `landmark-one-main` e `region`, em 1440 px.

## Resultado: violações por rota e tema

Rodada final, depois das correções.

| Rota | Claro 1440 | Escuro 1440 | Claro 375 | Escuro 375 |
|---|---|---|---|---|
| `/` | 0 | 0 | 0 | 0 |
| `/coordenacao` | 0 | 0 | 0 | 0 |
| `/coordenacao` com "Por que isto?" aberto | 0 | 0 | 0 (lente de IA) | 0 (lente de IA) |
| `/coordenacao/bibliografia` | 0 | 0 | 0 | 0 |
| `/sobre-ia` | 0 | 0 | 0 | 0 |
| `/discente` | 0 | 0 | 0 | 0 |

As regras de boas práticas (`heading-order` e as demais) também deram 0 em 1440 px, nos dois temas. Antes da correção do nível dos títulos, `/discente` saltava de `h1` para `h3` (regra `heading-order`, fora das tags WCAG).

A primeira rodada, antes de qualquer correção, também deu 0 violações do axe nas rotas e nos temas. Os defeitos achados na verificação visual não são do tipo que o axe detecta; estão em "Correções feitas".

## Rolagem horizontal em 375 px

`document.documentElement.scrollWidth <= window.innerWidth` em todas as rotas e nos dois temas. Em `/coordenacao`, a conferência foi repetida para cada uma das 7 profissões/lente, com cada um dos 8 primeiros "Por que isto?" aberto e fechado: `scrollWidth` ficou em 375 em todos os casos. A linha "Avaliação ética e de vieses em sistemas e conteúdos de IA" quebra em 3 linhas, sem rolagem.

## Correções feitas

| Problema | Onde | Correção |
|---|---|---|
| Painel "Por que isto?" aberto estourava a largura em 375 px (a página passava a 420–431 px): as colunas de grid sem `minmax(0, …)` cresciam até o conteúdo da ementa | `PainelPorQue.tsx` (`Painel` e a lista de evidências) | `grid-cols-[minmax(0,1fr)]` nos dois e `min-w-0` no nome da evidência |
| Linha de competência com `grid-cols-[1fr_auto]` sem `minmax(0, …)` | `LinhaCompetencia.tsx` | `grid-cols-[minmax(0,1fr)_auto]` |
| Mesmo padrão na linha de bibliografia | `LinhaBibliografia.tsx` | `grid-cols-[minmax(0,1fr)_auto]` |
| `h1` de `/coordenacao` e de `/coordenacao/bibliografia` sem `font-extrabold` (o preflight zera o peso e o Figtree só carrega 600 e 800; a prancha usa 800) | `lacunas.tsx`, `bibliografia/conteudo.tsx` | `font-extrabold` |
| `/discente`: salto de `h1` para `h3` nos títulos dos passos | `TrilhaDePassos.tsx`, `discente/page.tsx` | prop `nivelDoTitulo` (padrão `h3`); `/discente` passa `h2` |
| Linha de bibliografia sem referência datada mostraria "0% > 10 anos" | `LinhaBibliografia.tsx` | mostra "—" (hoje nenhum componente cai nesse caso) |

## Contraste dos tokens

Razões calculadas com a fórmula de luminância relativa da WCAG 2.2 sobre os tokens de `globals.css`. Texto precisa de 4,5:1; bordas de componentes e foco, de 3:1.

| Par | Uso | Claro | Escuro |
|---|---|---|---|
| `ink` sobre `canvas` | texto | 13,75:1 | 15,85:1 |
| `ink` sobre `surface` | texto | 15,45:1 | 14,00:1 |
| `ink-muted` sobre `surface` | texto | 6,86:1 | 7,86:1 |
| `ink-muted` sobre `canvas` | texto | 6,11:1 | 8,90:1 |
| `ink-muted` sobre `surface-sunken` | texto | 5,68:1 | 8,40:1 |
| `on-panel` sobre `panel` | texto | 12,16:1 | 10,42:1 |
| `on-panel-muted` sobre `panel` | texto | 7,54:1 | 7,19:1 |
| `on-panel` sobre `panel-raised` | texto | 9,08:1 | 8,33:1 |
| `on-panel-muted` sobre `panel-raised` | texto | 5,63:1 | 5,75:1 |
| `on-lime` sobre `lime` | texto | 11,49:1 | 11,49:1 |
| `ink` sobre `lime-soft` | texto | 13,50:1 | 10,20:1 |
| `coberta` sobre `coberta-bg` | texto (chip) | 6,19:1 | 7,79:1 |
| `parcial` sobre `parcial-bg` | texto (chip) | 7,12:1 | 8,77:1 |
| `lacuna` sobre `lacuna-bg` | texto (chip) | 4,99:1 | 7,43:1 |
| `lacuna` sobre `surface` | texto (percentual, números) | 6,07:1 | 7,63:1 |
| `line-strong` sobre `surface` | borda | 4,12:1 | 4,93:1 |
| `line-strong` sobre `canvas` | borda | 3,66:1 | 5,58:1 |
| `focus` sobre `canvas` | foco | 4,61:1 | 10,47:1 |
| `focus` sobre `surface` | foco | 5,18:1 | 9,24:1 |
| `focus-on-panel` sobre `panel` | foco nos painéis | 9,04:1 | 8,62:1 |

Pior caso de texto: `lacuna` sobre `lacuna-bg` no tema claro, 4,99:1. Pior caso de borda: `line-strong` sobre `canvas` no claro, 3,66:1 (sobre `surface`, 4,12:1). `parcial-mark` só aparece em barras com `aria-hidden`, sempre com os números em texto ao lado, e por isso fica fora da tabela.

## Verificado manualmente

- **Teclado e foco:** o foco visível vem de uma regra global (`:focus-visible`, 3 px, laranja; lima dentro de `.on-panel`), com contraste de pelo menos 4,6:1 (tabela acima). Os controles são elementos nativos (`button`, `a`, `input type="radio"`, `details`/`summary`), com `aria-pressed`, `aria-expanded` e `aria-controls`; o axe não apontou nenhum problema de papel, nome ou foco. Não foi feita uma passagem completa de Tab com leitor de tela.
- **375 px:** sem rolagem horizontal em nenhuma rota, nos dois temas, inclusive com o painel "Por que isto?" aberto (seção "Rolagem horizontal"). A barra do topo rola por dentro de si mesma em 375 px, sem alargar a página.
- **Situação sem cor:** cada situação aparece como ícone e palavra ("Coberta", "Parcial", "Lacuna") no chip, nas legendas e nos blocos de limiar de `/sobre-ia`; conferido nas capturas dos dois temas. As barras de segmentos têm os números em texto ao lado.
- **Comparação visual com as pranchas** (`docs/design/claude-design/*.dc.html`): estrutura, tamanhos de fonte (40 px e 56 px dos títulos e KPIs), raios, espaçamentos dos painéis (24 px no celular, 32 px no desktop), cores e a trilha de passos conferidos contra `bundle.css` e `tokens.css`. A única divergência de peso de fonte (`h1`) está em "Correções feitas".

## Pendências conhecidas (não bloqueiam)

- `/coordenacao`: o parágrafo `aria-live` "Mostrando X de Y" é remontado a cada troca de profissão, e o anúncio pode se perder em leitores de tela.
- `/coordenacao`: a linha aberta mantém a borda superior.
- O `h1` é 32 px em 375 px (a prancha mantém 40 px); a escolha evita quebras longas em títulos como "Onde o PPC não acompanha as profissões-alvo".
- A justificativa em linguagem natural (`POST /api/justificativas`) não foi auditada no estado "pronta", porque o ambiente local não tem a chave do LLM; o estado degradado é o que aparece (texto e nota em `aria-live`).
