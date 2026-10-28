# O recomendador suporta várias estruturas curriculares

No SMD coexistem a estrutura curricular 2013.2 (discentes veteranos — incluindo a equipe e os participantes da validação) e a 2025.1 (ingressantes a partir de 2025), com códigos de componentes diferentes para vários conteúdos (ex.: SMD0093 → SMD0138) e componentes que só existem na antiga. O recomendador lê a estrutura curricular declarada no histórico e aplica os obrigatórios, grupos, pré-requisitos e cargas horárias *daquela* estrutura. Ementas e competências vêm sempre do PPC vigente (2024.2); componentes antigos sem ementa no PPC são ligados a ele por uma tabela de equivalências curada pela equipe.

Rejeitamos suportar só a 2025.1 convertendo códigos: as regras de grupo ficariam aproximadas e o sistema falharia justamente com o público da validação.

## Consequences

- Cada estrutura curricular é um dado de entrada (exportado do SIGAA e revisado), não código.
- A análise de lacunas do PPC continua usando apenas o PPC vigente; múltiplas estruturas afetam só o recomendador.
- O turno também identifica a estrutura. No SIGAA, o Noturno é uma matriz à parte (sufixo "N"; o Diurno é "MT") com o mesmo código de versão e pré-requisitos e equivalências próprios: a 2013.2 Noturno difere da 2013.2 Diurno em 24 deles. O recomendador escolhe a estrutura por versão e turno, lido do campo "Turno" do histórico. O Noturno tem as matrizes 2013.2 (cadastrada no SIGAA sob o nome do curso Diurno, com turno "N"), 2016.1, 2016.1A (em vigor desde 2018.2, com letra no código) e 2025.1; a 2025.1 Noturno tem os mesmos componentes e grupos da Diurno, distribuídos em 9 semestres. O PPC Noturno (versão de 27/02/2025) tem as mesmas ementas, obrigatórios e itinerários do PPC Diurno 2024.2, distribuídos em 9 semestres, por isso a análise e os itinerários servem aos dois turnos.
