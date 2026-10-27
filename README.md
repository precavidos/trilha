# Trilha

**IA para alinhar currículos e trajetórias às profissões do futuro.**

O Trilha confronta o Projeto Pedagógico de Curso (PPC) com as competências exigidas pelas profissões contemporâneas:

- **Coordenação e NDE** veem as lacunas de competências do PPC por profissão-alvo (com uma lente transversal de IA) e a atualidade das bibliografias.
- **Discentes** *(em desenvolvimento)* enviarão o histórico do SIGAA e receberão uma recomendação de optativas e eletivas que respeita pré-requisitos, grupos de componentes e itinerários formativos.

Toda conclusão vem com as evidências que a sustentam. O LLM nunca escolhe componentes, apenas redige justificativas a partir dessas evidências, e nenhum dado pessoal é enviado a ele.

Recorte atual: Sistemas e Mídias Digitais (Diurno), UFC. Projeto submetido ao Prêmio Inteligência Artificial e Formação Universitária (Edital nº 1/2026, Cátedra Luíza de Teodoro, CEA/UFC), Categoria III, Eixo IV.

## Documentação

- [`CONTEXT.md`](CONTEXT.md): glossário do domínio
- [`docs/PLANO.md`](docs/PLANO.md): escopo, cronograma, validação e checklist de submissão
- [`docs/adr/`](docs/adr/): decisões de arquitetura

## Estrutura

```
backend/    Spring Boot 4 · Java 21 · LangChain4j · PDFBox
frontend/   Next.js 16 · TypeScript · Tailwind CSS
data/       seed do PPC, vocabulário de competências (ESCO + Extensão IA), análise pré-calculada
docs/       plano, ADRs, edital
```

## Como rodar

Pré-requisitos: Java 21, Node 22. Uma chave gratuita do Google AI Studio é opcional: sem ela tudo funciona, e só as justificativas em linguagem natural ficam reduzidas à lista de evidências.

```bash
cp .env.example .env                          # preencha GEMINI_API_KEY
cd backend && ./mvnw spring-boot:run          # API em http://localhost:8080
cd frontend && npm install && npm run dev     # interface em http://localhost:3000
```

### Regerar a análise

A análise fica pré-calculada em `data/analise/` (ADR 0010). Para regerá-la depois de mudar o PPC, a ESCO ou a Extensão IA:

```bash
mkdir -p models/multilingual-e5-small && cd models/multilingual-e5-small
curl -LO https://huggingface.co/Xenova/multilingual-e5-small/resolve/main/onnx/model_quantized.onnx
curl -LO https://huggingface.co/Xenova/multilingual-e5-small/resolve/main/tokenizer.json
cd ../../backend && ./mvnw -q compile exec:java -Dexec.mainClass=br.ufc.trilha.analise.GerarAnalise
```

## Uso de IA generativa no desenvolvimento

Este projeto foi desenvolvido com apoio de IA generativa (Claude Code) na geração de código, conforme declarado no memorial e no Anexo III do edital. As decisões de design, a curadoria de dados, a validação e o texto do memorial são da equipe.

## Licenças

Código: [MIT](LICENSE). Dados derivados em `data/`: CC BY 4.0. Taxonomia [ESCO](https://esco.ec.europa.eu/): © União Europeia, CC BY 4.0.
