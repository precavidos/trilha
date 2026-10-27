# Plano do projeto — Trilha

Prêmio Inteligência Artificial e Formação Universitária — Edital nº 1/2026, Cátedra Luíza de Teodoro (CEA/UFC). Edital em [`edital/edital-1-2026-catedra-ia.pdf`](edital/edital-1-2026-catedra-ia.pdf).

| Campo | Escolha |
|---|---|
| Categoria | III — Soluções Tecnológicas (protótipo + memorial técnico descritivo) |
| Eixo temático | IV — Currículos e Profissões do Futuro |
| Área do conhecimento | 4 — Ciências Humanas e Educação (Ensino e Educação) |
| Recorte | Sistemas e Mídias Digitais — Diurno, UFC (PPC 2024.2, matriz 2025.1) |
| Equipe | 3 discentes do SMD (vínculo ativo) |

## O que pontua (item 8.3 do edital)

| Critério | Peso | Como o Trilha responde |
|---|---|---|
| Originalidade e relevância | 3,0 | Confronto PPC × mercado com lente de IA; PPC recém-implantado; referência FIEC que o próprio PPC cita |
| Rigor metodológico / funcionalidade | 3,0 | Vocabulário canônico (ESCO), rótulos de validação, precisão reportada, protótipo funcional |
| Aplicabilidade e impacto | 2,0 | Fala a língua dos itinerários formativos e do GPT; apoio ao NDE; generalizável a outros cursos |
| Clareza e uso ético da IA | 2,0 | Painel "Por que isto?", anonimização, LLM só justifica, declaração explícita de uso de IA |

A avaliação usa **apenas o PDF submetido** (item 8.4). Repositório e vídeo entram como links opcionais (documento 8).

## Escopo

### Dentro
1. **Ingestão do PPC** — seed revisado por humanos + upload "melhor esforço" no mesmo extrator (ADR 0007).
2. **Mapeamento** componente → competência (ESCO + Extensão IA) com evidência (ADR 0001).
3. **Dashboard de lacunas** por profissão-alvo + lente transversal de IA.
4. **Idade da bibliografia** por componente.
5. **Recomendador discente** — histórico SIGAA → trajetória anonimizada → ranking determinístico respeitando a estrutura curricular do discente (2013.2 ou 2025.1), pré-requisitos, grupos, itinerários e a carga horária pendente (ADRs 0002, 0003, 0009).
6. **Transparência** — painel "Por que isto?" em todo resultado + página "Sobre a IA neste sistema".
7. **Acessibilidade** — WCAG 2.2 AA: contraste, HTML semântico, navegação por teclado, auditoria axe/Lighthouse.

### Profissões-alvo (ocupações ESCO)
Designer de UX/UI · Desenvolvedor(a) de jogos digitais · Desenvolvedor(a) web/front-end · Animador(a) 2D/3D · Designer multimídia/motion · Editor(a) de vídeo/audiovisual.

### Fora (trabalho futuro)
Autenticação/SSO, outros cursos, raspagem de vagas, deploy público.

### Ordem de corte se o prazo apertar
1. Publicações recentes via OpenAlex (vira só fundamentação citada no memorial)
2. WEF como fonte processada (só citado)
3. Modo offline Ollama (só configuração documentada)
4. Teste SUS reduzido a 3 participantes

**Não sai:** mapeamento, coleta de vagas, dashboard de lacunas, recomendador, acessibilidade.

## Papéis

| Pessoa | Código | Não-código | Seção do memorial |
|---|---|---|---|
| Back | Backend, pipeline de IA | ADRs | Arquitetura e implementação |
| Front A | Frontend (coordenação) | Coleta de vagas, revisão das profissões-alvo, contato com o tutor do GPT | Metodologia e validação |
| Front B | Frontend (discente) | Auditoria de acessibilidade, teste SUS, vídeo | Interface, acessibilidade e ética |

Introdução e conclusão: a seis mãos. Capacidade estimada: ~1h/dia/pessoa (~40h humanas até o code freeze). O código é majoritariamente gerado com apoio de IA (Claude Code); a contribuição humana concentra-se nas decisões, curadoria, validação e texto — ver "Autoria e uso de IA".

## Cronograma

| Data | Marco |
|---|---|
| 09–12/10 | E-mail à coordenação; CONTEXT, ADRs, esqueleto do monorepo |
| até 14/10 | Seed do PPC revisado; estruturas curriculares 2013.2 e 2025.1 + tabela de equivalências revisadas; vagas coletadas; lista Extensão IA |
| 15/10 | Início do memorial (Google Docs, em paralelo ao código) |
| até 18/10 | Fluxo da coordenação ponta a ponta (lacunas + bibliografia) |
| até 21/10 | Fluxo do discente ponta a ponta (histórico → recomendação) |
| 20–24/10 | Validação: tutor do GPT rotula ~50 mapeamentos; SUS com 3–5 estudantes; axe/Lighthouse |
| **22/10 (qui)** | **Code freeze** — repositório público |
| 23–28/10 | Memorial, resultados da validação, vídeo de 3–5 min |
| 29/10 | Assinaturas digitais (gov.br) dos Anexos II, III, IV; montagem do PDF único (≤ 40 MB) |
| **30/10 (sex)** | **Submissão** (o edital recomenda evitar as últimas 24 h; prazo final 31/10 23h59) |

## Replanejamento de 27/10

O projeto ficou parado entre 10 e 26/10 por pendências da universidade. Com o prazo final em 31/10, o escopo foi cortado:

- **Entregue no protótipo:** fluxo da coordenação (lacunas por profissão-alvo, lente de IA, idade da bibliografia, painel "Por que isto?" com justificativa por RAG, página "Sobre a IA").
- **Projetado, não implementado:** módulo discente (ADRs 0003 e 0009). Aparece na interface como "em desenvolvimento".
- **Demanda de mercado:** competências essenciais e opcionais da ESCO, sem as vagas coletadas (ficam como trabalho futuro).
- **Validação:** os três integrantes rotulam a mesma amostra de mapeamentos; o memorial reporta precisão e concordância, declarando que os rótulos são da própria equipe.
- **Arquitetura:** análise pré-calculada, sem banco (ADR 0010).

| Data | Marco |
|---|---|
| 27/10 | Backend, análise, dashboard |
| 28/10 | Planilha de validação rotulada; rascunho do memorial |
| 29/10 | Memorial revisado pela equipe; vídeo; assinaturas gov.br |
| 30/10 | Repositório público; PDF único; envio |

## Validação

- **Mapeamentos:** um tutor do GPT rotula ~50 mapeamentos (correto/incorreto). Reportar precisão; usar os rótulos para calibrar limiares de cobertura.
- **Usabilidade:** 3–5 estudantes do SMD, tarefa guiada + questionário SUS.
- **Acessibilidade:** axe + Lighthouse em todas as telas; relatório anexado ao memorial.

## Dados e licenças

| Dado | Onde | Licença / regra |
|---|---|---|
| PPC e estrutura SIGAA (fontes) | `data/private/fontes/` (fora do git) | Documento institucional; seed derivado versionado |
| Seed do PPC, mapeamentos, Extensão IA | `data/` | CC BY 4.0 |
| ESCO | baixado no setup | CC BY 4.0 — atribuição obrigatória |
| Vagas | metadados + competências + trechos ≤ 200 caracteres em `data/`; texto integral em `data/private/` | ADR 0004 |
| Históricos | reais só locais; sintéticos no repositório | ADR 0003 |
| Código | — | MIT |

## Fluxo de trabalho

PR curto por mudança, cada integrante com a própria conta GitHub (a autoria fica comprovável no histórico), auto-merge após CI verde (build do back, build do front, lint de acessibilidade). Repositório numa organização de nome neutro, sem nomes pessoais no README (avaliação cega, item 8.1.3).

## Autoria e uso de IA (itens 7.1–7.3 do edital)

- O memorial declara, **no corpo do texto**, quais ferramentas de IA generativa foram usadas e em quê (geração de código, revisão de texto), além do Anexo III assinado.
- Contribuição humana comprovável: decisões de design (este documento, `CONTEXT.md`, ADRs), escolha das profissões-alvo, coleta de vagas, curadoria da Extensão IA, revisão do seed, rótulos de validação, condução dos testes e texto central do memorial.
- Nenhum dado, resultado ou imagem do memorial é gerado ou alterado por IA sem verificação humana (item 7.2).

## Checklist de submissão (item 6.1)

- [ ] 1. Documento oficial com foto — todos os integrantes
- [ ] 2. Comprovante de vínculo (atestado de matrícula SIGAA) — todos
- [ ] 3. Resumo (≤ 1.500 caracteres sem espaços: título, categoria, eixo, integrantes)
- [ ] 4. Memorial descritivo (≤ 20 laudas; Times New Roman 12; espaçamento 1,5; margens de 3 cm em todos os lados; justificado; capa, resumo, introdução, desenvolvimento, conclusão, referências ABNT)
- [ ] 5. Anexo II — originalidade e autoria (assinado por todos)
- [ ] 6. Anexo III — uso de IA generativa (assinado por todos)
- [ ] 7. Anexo IV — ciência do edital (assinado)
- [ ] 8. Links públicos: repositório e vídeo
- [ ] Tudo em **um único PDF** ≤ 40 MB; formulário com responsável, categoria, eixo e área preenchidos
