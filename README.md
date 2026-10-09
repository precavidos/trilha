# Trilha

**IA para alinhar currículos e trajetórias às profissões do futuro.**

O Trilha confronta o Projeto Pedagógico de Curso (PPC) com as competências exigidas pelas profissões contemporâneas:

- **Coordenação e NDE** veem as lacunas de competências do PPC por profissão-alvo (com uma lente transversal de IA) e a atualidade das bibliografias.
- **Discentes** enviam o histórico do SIGAA e recebem uma recomendação de optativas e eletivas que respeita pré-requisitos, grupos de componentes e itinerários formativos.

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
data/       seed do PPC, vocabulário de competências, corpus de mercado (dados públicos)
docs/       plano, ADRs, edital
```

## Como rodar

Pré-requisitos: Docker, Java 21, Node 22.

```bash
cp .env.example .env          # preencha GEMINI_API_KEY
docker compose up -d db       # PostgreSQL + pgvector
cd backend && ./mvnw spring-boot:run
cd frontend && npm install && npm run dev   # http://localhost:3000
```

## Uso de IA generativa no desenvolvimento

Este projeto foi desenvolvido com apoio de IA generativa (Claude Code) na geração de código, conforme declarado no memorial e no Anexo III do edital. As decisões de design, a curadoria de dados, a validação e o texto do memorial são da equipe.

## Licenças

Código: [MIT](LICENSE). Dados derivados em `data/`: CC BY 4.0. Taxonomia [ESCO](https://esco.ec.europa.eu/): © União Europeia, CC BY 4.0.
