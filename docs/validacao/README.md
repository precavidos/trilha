# Validação com rótulos humanos

São 42 julgamentos, sorteados de forma estratificada: 14 que o sistema classificou como **coberta**, 14 como **parcial** e 14 como **lacuna**, incluindo itens da lente de IA. Cada linha traz uma competência e a ementa que o sistema achou mais próxima.

## Como rotular (~20 min por pessoa)

1. Abra [`rotulos.csv`](rotulos.csv) no Excel ou no Google Planilhas.
2. Cada integrante preenche **só a sua coluna** (`avaliador_1`, `avaliador_2` ou `avaliador_3`), **sem conversar com os outros e sem olhar o `gabarito-sistema.csv`**.
3. Para cada linha, responda: *esta ementa contempla esta competência?*
   - `sim`: a ementa trata do conteúdo da competência de forma clara
   - `parcial`: toca no assunto, mas de forma incompleta ou indireta
   - `nao`: não trata do assunto (escreva `nao`, sem til)
4. Salve como CSV (UTF-8) no mesmo lugar.

## Calcular o resultado

```bash
python -I data/scripts/validacao.py avaliar
```

Gera [`resultado.md`](resultado.md), com a concordância entre avaliadores, o acerto do sistema e a precisão de "coberta" e de "lacuna". Funciona com **2 ou 3 avaliadores** (kappa de Cohen ou de Fleiss); conta só quem preencheu todas as linhas. A linha 10 (ia-15, removida na curadoria da Extensão IA) é excluída automaticamente. Esses números vão para a seção de validação do memorial.

> A amostra é reprodutível (semente fixa no script). Não regere a amostra depois que alguém começar a rotular.

## Revalidação (programas de disciplina e tecnologias nomeadas, ADR 0011)

A análise mudou em dois pontos: tecnologias com nome passaram a ser julgadas pela citação, e 12 ementas vieram dos programas de disciplina. Os rótulos acima continuam valendo para os pares (competência, componente) que não mudaram. Só os **22 pares novos** vão aos avaliadores, em [`revalidacao/rotulos.csv`](revalidacao/rotulos.csv) (~10 min por pessoa):

1. Mesmas regras de antes: cada um preenche só a sua coluna (`avaliador_1` ou `avaliador_2`), sem conversar e sem abrir `revalidacao/gabarito-sistema.csv`.
2. A pergunta é a mesma: *este componente contempla esta competência?* (`sim`, `parcial` ou `nao`).
3. Para tecnologias, a coluna `onde_o_nome_aparece` diz onde o termo foi achado (por exemplo, só na bibliografia básica). Julgue se isso significa que a disciplina trata da tecnologia.

```bash
python -I data/scripts/validacao.py avaliar-revalidacao
```

Gera [`revalidacao/resultado.md`](revalidacao/resultado.md), juntando as duas rodadas. "Não documentada" não afirma cobertura nem ausência e fica fora das precisões; o resultado mostra à parte o que os avaliadores disseram sobre elas. O `resultado.md` da primeira rodada não muda: é o que o memorial cita.
