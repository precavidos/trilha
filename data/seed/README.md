# Seeds

Dados de entrada revisados por humanos (ADR 0007). Cada arquivo é gerado por um extrator e **corrigido à mão** pela equipe: as correções ficam no histórico do git como contribuição humana.

## `ppc-smd-diurno-2024-2.json`

Gerado a partir do PPC (PDF em `data/private/fontes/`, fora do git):

```bash
cd backend
./mvnw -q compile exec:java -Dexec.args="../data/private/fontes/ppc-smd-diurno-2024-2.pdf ../data/seed/ppc-smd-diurno-2024-2.json 'PPC Sistemas e Mídias Digitais Diurno 2024.2 (mod. PROGRAD)'"
```

> Regerar **sobrescreve** as correções manuais. Depois da primeira revisão, edite o JSON diretamente.

### Como revisar

O campo `pendencias` lista tudo o que o extrator não resolveu com certeza. Para cada uma:

| Tipo | O que fazer |
|---|---|
| `CODIGO_DUPLICADO` | O PPC imprimiu o código errado. Confira no SIGAA e crie o componente com o código certo (ex.: Semiótica Aplicada é SMD0090, não SMD0144). |
| `SEM_CASAMENTO` | Ementa ou bibliografia cujo nome não está no catálogo. Se for de um componente existente, copie para ele; se for de um componente do currículo antigo (ex.: Prototipação de Jogos Tridimensionais), anote para a tabela de equivalências. |
| `CASAMENTO_APROXIMADO` | Confirme que o código está certo. |
| `SEM_EMENTA` / `SEM_BIBLIOGRAFIA` | O PPC não traz o texto. Complete a partir do "Programa de disciplinas" do site do curso, se disponível; senão, deixe vazio. |
| `REFERENCIA_SEM_ANO` | Preencha `ano` se for possível descobrir; senão, deixe `null`. |

Ao terminar, apague a pendência resolvida da lista. A lista vazia significa seed revisado.

### Achados do PPC (para o memorial)

- 23 componentes do catálogo não têm ementa no PPC.
- O PPC atribui o código SMD0144 a dois componentes (Fotografia Digital e Semiótica Aplicada).
- Bibliografias datadas: por exemplo, Autoração Multimídia I traz apenas livros de Photoshop CS4 e Flash CS4 (2006–2009); o Flash foi descontinuado em 2020.

## `programas-smd.json`

Campos de conteúdo dos formulários de criação/regulamentação de disciplina da PROGRAD (ementa, objetivos, competências, conteúdo detalhado e bibliografias), um por disciplina. Os PDFs ficam em `data/private/fontes/programas/`, fora do git. Nomes de quem assinou, carimbos e atas não são extraídos; da assinatura, só a data. Gerado por:

```bash
cd backend
./mvnw -q compile exec:java -Dexec.mainClass=br.ufc.trilha.ppc.ExportarProgramas -Dexec.args="../data/private/fontes/programas ../data/seed/programas-smd.json"
```

Quando há versões por turno, vale a do Diurno (o PPC analisado é o do Diurno). `pendencias` registra as outras versões e os rascunhos ignorados. A análise usa o programa de um componente do PPC quando o código é o mesmo ou quando é de um componente equivalente da matriz 2025.1 com praticamente a mesma ementa (ADR 0011).

**Revisão de 28/10/2026.** A equipe conferiu as 12 ementas usadas para completar o PPC (SMD0027, 0035, 0050, 0057, 0070, 0071, 0080, 0084, 0091, 0120, 0126, 0128): correspondem às disciplinas como são dadas hoje, embora vários formulários sejam antigos (2018) ou sem data. Algumas são curtas e sem objetivos (SMD0057, SMD0091); são o único registro disponível, o que é em si um achado: a documentação das disciplinas pelos docentes é incompleta. A divergência entre a SMD0144 do PPC e o programa da antiga SMD0086 (Fotografia Digital) é reformulação da disciplina, não erro: a análise usa só a ementa do PPC.

## `tecnologias-nomeadas.json`

Competências que nomeiam uma linguagem, framework ou programa, com os termos que contam como citação (ADR 0011). `termos` casam sem distinção de maiúsculas; `termosExatos` exigem a grafia exata. Ao revisar, prefira deixar de fora um termo ambíguo a aceitar falsos positivos.

## Licença

O texto das ementas e bibliografias é reproduzido do PPC, documento institucional público da UFC; o de `programas-smd.json`, dos formulários de disciplina da PROGRAD/UFC. A estrutura, as correções e os demais dados derivados da equipe são CC BY 4.0.
