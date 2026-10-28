# Histórico parseado localmente; dados pessoais nunca saem do parser

O histórico do SIGAA é lido por um parser determinístico (PDFBox + regras sobre o layout padrão do SIGAA) que descarta nome, matrícula, CPF e demais identificadores no momento do parse. Só a **trajetória** segue adiante: estrutura curricular, e por componente o código, o período, a situação, a carga horária e o marcador de tipo, mais as cargas horárias pendentes. Notas, frequência, turma, IRA e nomes de docentes (dados pessoais de terceiros) também são descartados — não entram no ranking, então guardá-los seria só risco. O PDF não é persistido e nenhum dado pessoal é enviado a LLM algum.

Rejeitamos enviar o PDF ou seu texto ao LLM para extração: seria mais flexível, mas violaria a anonimização exigida e criaria risco de LGPD sem ganho real, já que o layout do SIGAA é estável.

Históricos reais (dos integrantes da equipe, com consentimento) são usados apenas localmente para testar o parser e nunca entram no repositório; o repositório contém apenas históricos sintéticos.

O histórico de exemplo servido pelo sistema (`data/seed/historico-exemplo.json`) é fictício, montado à mão, e serve para avaliar o sistema sem expor um histórico.
