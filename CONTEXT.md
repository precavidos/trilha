# Trilha

Trilha confronta o Projeto Pedagógico de um curso com as exigências das profissões contemporâneas: mostra à coordenação onde o currículo tem lacunas e ao discente quais componentes optativos o aproximam da profissão que deseja. Recorte atual: Sistemas e Mídias Digitais (SMD) Diurno, UFC.

## Language

### Currículo

**PPC**:
O Projeto Pedagógico de Curso: o documento oficial que define estrutura curricular, ementas, bibliografias e itinerários de um curso.
_Avoid_: grade, currículo (quando se referir ao documento)

**Estrutura curricular**:
Uma versão do currículo registrada no SIGAA (ex.: 2013.2, 2025.1), com seus obrigatórios, grupos de componentes, pré-requisitos e cargas horárias exigidas. Várias estruturas coexistem: cada discente está vinculado a uma.
_Avoid_: matriz, grade, currículo (sem versão)

**Equivalência**:
Relação que faz um componente de uma estrutura curricular valer por outro (ex.: SMD0093 da 2013.2 por SMD0138 da 2025.1).

**Componente curricular**:
Unidade da estrutura curricular com código próprio (ex.: SMD0023), carga horária e pré-requisitos.
_Avoid_: matéria, cadeira, disciplina (aceitável só em texto corrido)

**Ementa**:
O resumo oficial do conteúdo de um componente curricular, tal como consta no PPC.
_Avoid_: programa, descrição

**Bibliografia**:
As referências básicas e complementares associadas a um componente curricular no PPC.

**Obrigatório**:
Componente curricular que todo discente deve cursar.

**Eletivo**:
Componente curricular escolhido dentro de um grupo de componentes com regra de quantidade (ex.: 4 de 6 no 4º semestre).
_Avoid_: optativo (são conceitos distintos no SMD)

**Optativo**:
Componente curricular de livre escolha dentre a lista de optativos do curso, contabilizado na carga horária optativa.
_Avoid_: eletivo

**Optativo livre**:
Componente de qualquer outro curso da UFC, aproveitado como optativo até o limite de carga horária definido no PPC.

**Grupo de componentes**:
Conjunto de componentes com uma regra de escolha (quantidade mínima/máxima), como as eletivas do 4º semestre ou o grupo especial de extensão.

**Área de concentração**:
Uma das duas grandes áreas do SMD — Sistemas Multimídia ou Mídias Digitais — que organizam os eletivos.

**Itinerário formativo**:
Conjunto não vinculante de componentes optativos que compõe uma formação especializada (Sistemas Multimídia, Jogos Digitais, Design Digital Interativo, Animação e Audiovisual), com componentes de núcleo e complementares.
_Avoid_: trilha (reservado ao nome do produto), ênfase

**GPT**:
Grupo de Professores Tutores: docentes que orientam os discentes na escolha de itinerários formativos.

**NDE**:
Núcleo Docente Estruturante: colegiado responsável pelo acompanhamento e atualização do PPC.

### Competências e mercado

**Competência**:
Um conhecimento ou habilidade identificado por um item do vocabulário de competências; é a unidade comum na qual PPC e mercado são comparados.
_Avoid_: skill, habilidade, conteúdo

**Vocabulário de competências**:
O conjunto fechado de competências reconhecidas pelo sistema: a taxonomia ESCO mais a Extensão IA.
_Avoid_: taxonomia (quando se referir ao conjunto completo)

**Extensão IA**:
Competências relacionadas à Inteligência Artificial curadas pela equipe por não estarem cobertas pela ESCO; sempre identificadas como de autoria própria.

**Profissão-alvo**:
Uma ocupação ESCO selecionada como destino profissional plausível para egressos do curso (seis no recorte SMD).
_Avoid_: carreira, cargo, perfil profissional

**Corpus de mercado**:
O conjunto congelado e datado de fontes que expressam demanda profissional: vagas coletadas, documentos da FIEC e relatórios citados.
_Avoid_: tendências, dados de mercado (sem referência a fonte)

**Vaga**:
Um anúncio de emprego público coletado manualmente, registrado com URL, data, profissão-alvo e competências extraídas.

### Análise

**Mapeamento**:
A associação entre um componente curricular e uma competência, sustentada por uma evidência.

**Evidência**:
O trecho literal de uma fonte (ementa, bibliografia, vaga, documento) que sustenta um mapeamento, uma lacuna ou uma justificativa.
_Avoid_: fonte (quando se referir ao trecho), citação

**Cobertura**:
O grau em que o PPC contempla uma competência, segundo seus mapeamentos.

**Demanda**:
O grau em que o corpus de mercado exige uma competência para uma profissão-alvo.

**Lacuna**:
Uma competência com demanda alta e cobertura baixa no PPC.
_Avoid_: gap, deficiência, falha

**Idade da bibliografia**:
Indicador de atualidade da bibliografia de um componente, derivado dos anos de publicação de suas referências.

**Rótulo de validação**:
O julgamento de um docente revisor sobre se um mapeamento está correto; base para calibrar e medir a análise.

### Discente

**Histórico**:
O documento do SIGAA com os componentes cursados por um discente e suas situações.

**Trajetória**:
O registro anonimizado extraído de um histórico: a estrutura curricular do discente, os componentes cursados (código, período, situação, carga horária) e as cargas horárias pendentes — sem nenhum dado pessoal, nota ou nome de docente.
_Avoid_: perfil do aluno, histórico (quando já anonimizado)

**Carga horária pendente**:
O que falta ao discente integralizar por tipo (optativa, extensão, total etc.), segundo o histórico; dimensiona o tamanho da recomendação.

**Recomendação**:
Uma lista ordenada de componentes eletivos e optativos elegíveis para uma trajetória, rumo a uma ou duas profissões-alvo.

**Justificativa**:
O texto que explica um item da recomendação ou uma lacuna, composto exclusivamente a partir de evidências.
_Avoid_: explicação, resposta da IA

## Relationships

- Um **PPC** contém muitos **componentes curriculares**; cada um tem uma **ementa** e uma **bibliografia**.
- Um **itinerário formativo** agrupa componentes optativos; um componente pode pertencer a vários itinerários.
- Um **mapeamento** liga um **componente curricular** a uma **competência** por meio de uma **evidência**.
- Uma **profissão-alvo** exige competências; a **demanda** vem do **corpus de mercado**.
- Uma **lacuna** existe por **profissão-alvo** (ou pela lente transversal da **Extensão IA**), nunca por componente.
- Uma **recomendação** parte de uma **trajetória**, respeita pré-requisitos e regras dos **grupos de componentes** da **estrutura curricular** do discente, cabe na **carga horária pendente**, e cada item tem uma **justificativa**.
- O **PPC** vigente fornece ementas e competências; componentes de estruturas antigas sem ementa no PPC são ligados a ele por **equivalência**.

## Example dialogue

_(Ilustrativo — números fictícios.)_

> **Coordenação:** "O PPC tem lacuna em prototipação com IA generativa?"
> **Trilha:** "Sim, para a profissão-alvo *designer de interfaces*: demanda presente em 31 das 40 vagas da profissão; nenhum mapeamento no PPC acima do limiar. Evidências: [vagas], [ementa de SMD0119 — cobertura parcial]."

## Flagged ambiguities

- "Trilha" é usado no PPC como sinônimo informal de itinerário formativo. Resolvido: no domínio usa-se **itinerário formativo**; **Trilha** é só o nome do produto.
- "Eletiva" e "optativa" são usados como sinônimos em conversa, mas o PPC do SMD os distingue (carga horária e regras diferentes). Resolvido: termos distintos.
