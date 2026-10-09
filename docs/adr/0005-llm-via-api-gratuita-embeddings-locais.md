# Geração via API gratuita; embeddings locais; Ollama opcional

As máquinas da equipe (ex.: GPU de 4 GB) não rodam bem modelos locais de 7–8B, e modelos de ~3B têm português fraco. Decidimos: geração de texto via tier gratuito de API (Google Gemini por padrão, por qualidade em português e suporte nativo no LangChain4j); embeddings calculados em processo, localmente (modelo multilíngue em ONNX); Ollama configurável como modo totalmente offline.

Isto é aceitável eticamente porque o que chega ao LLM é apenas conteúdo institucional público (ementas, bibliografias) e evidências de mercado — nunca dados pessoais (ver ADR 0003). O provedor é trocado por configuração, sem mudança de código.

Os componentes do LangChain4j são instanciados manualmente em configuração Spring, sem os starters de Spring Boot, para não acoplar a versão do LangChain4j à do Spring Boot.
