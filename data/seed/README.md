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

## Licença

O texto das ementas e bibliografias é reproduzido do PPC, documento institucional público da UFC. A estrutura, as correções e os demais dados derivados da equipe são CC BY 4.0.
