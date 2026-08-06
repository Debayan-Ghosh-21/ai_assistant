# Systems ML & LLM Infra: Re-Implementation Roadmap

This is a comprehensive, ~120-hour roadmap designed for an aspiring Systems ML Engineer. It breaks down the re-implementation of this exact architecture into actionable sub-goals, providing time estimates and the exact files in this codebase you should study as your "answer key."

---

## Phase 0: The Production Skeleton (15 Hours)
**Goal:** Establish the Dockerized infrastructure and API layer.

| Sub-Goal | Time | Focus Area | Source Files to Study in this Repo |
| :--- | :--- | :--- | :--- |
| **0.1 Setup Dependency Management** | 2 hrs | Learn modern Python packaging over `pip`. | `pyproject.toml` (Look at how `uv` is used instead of pip) |
| **0.2 Dockerize the Environment** | 5 hrs | Learn how to run multiple services in one container. | `Dockerfile.dev`, `docker-compose.yml`, `supervisord.dev.conf` |
| **0.3 Build the API Shell** | 4 hrs | Learn Clean Architecture and routing. | `api/main.py`, `api/routers/__init__.py` |
| **0.4 Data Sanitization (Pydantic)** | 4 hrs | Learn how to validate JSON payloads securely. | `api/models.py` (Study the strict Field constraints) |

---

## Phase 1: Ingestion & Vector Infrastructure (20 Hours)
**Goal:** Master how raw data is parsed, chunked, and stored mathematically.

| Sub-Goal | Time | Focus Area | Source Files to Study in this Repo |
| :--- | :--- | :--- | :--- |
| **1.1 Database Schema Design** | 5 hrs | Learn how to structure graph/document databases. | `dyslexxy/domain/notebook.py` (Study the Pydantic to DB mapping) |
| **1.2 Data Extraction** | 5 hrs | Scraping PDFs and YouTube transcripts safely. | `content-core` library usage in `dyslexxy/graphs/source.py` |
| **1.3 Chunking Algorithms** | 3 hrs | Splitting text without losing semantic meaning. | `dyslexxy/utils/text_utils.py` |
| **1.4 Vector Embeddings** | 7 hrs | Converting text to math and indexing it in DB. | `dyslexxy/utils/embedding.py`, `dyslexxy/database/migrations/9.surrealql` (Look at the Cosine Similarity index) |

---

## Phase 2: The Core RAG Engine (15 Hours)
**Goal:** Build the retrieval and chat injection systems.

| Sub-Goal | Time | Focus Area | Source Files to Study in this Repo |
| :--- | :--- | :--- | :--- |
| **2.1 Semantic Search** | 5 hrs | Querying the vector database for nearest neighbors. | `api/routers/search.py` |
| **2.2 Context Building** | 5 hrs | Assembling retrieved chunks into a safe LLM prompt. | `dyslexxy/utils/context_builder.py` (Study how it truncates tokens) |
| **2.3 Basic LLM Integration** | 5 hrs | Sending the context to an LLM via Langchain. | `dyslexxy/graphs/chat.py` (Study `call_model_with_messages`) |

---

## Phase 3: Systems ML & Async Queues (25 Hours) 🔥 *Crucial*
**Goal:** Decouple slow AI tasks from the web server to achieve horizontal scale.

| Sub-Goal | Time | Focus Area | Source Files to Study in this Repo |
| :--- | :--- | :--- | :--- |
| **3.1 Background Worker Setup** | 8 hrs | Polling mechanisms and database locks. | `commands/` folder, `Makefile` (Look at the `worker-start` command) |
| **3.2 Async Job Submission** | 7 hrs | Modifying the API to return 200 OK while processing. | `api/routers/sources.py` (Study the `async_processing=True` logic) |
| **3.3 Podcast Generation Pipeline** | 10 hrs | Chaining LLMs (Outline -> Script -> TTS API). | `commands/podcast_commands.py` (Study how it abstracts to `podcast-creator`) |

---

## Phase 4: Advanced LangGraph Orchestration (30 Hours)
**Goal:** Build resilient, state-driven, multi-agent workflows.

| Sub-Goal | Time | Focus Area | Source Files to Study in this Repo |
| :--- | :--- | :--- | :--- |
| **4.1 Stateful Chat Memory** | 8 hrs | Managing thread history with SQLite checkpointers. | `dyslexxy/graphs/chat.py` (Study `SqliteSaver`) |
| **4.2 Map-Reduce (Parallel AI)** | 10 hrs | Spawning multiple LLM agents simultaneously. | `dyslexxy/graphs/source.py` (Study the `trigger_transformations` conditional edge) |
| **4.3 Fault Tolerance & JSON Repair** | 12 hrs | Catching LLM hallucinations and forcing correct formats. | `dyslexxy/graphs/quiz.py` (Study the `repair_json` function) |

---

## Phase 5: Dynamic LLM Infrastructure (15 Hours)
**Goal:** Prove you can manage scalable, multi-provider model routing.

| Sub-Goal | Time | Focus Area | Source Files to Study in this Repo |
| :--- | :--- | :--- | :--- |
| **5.1 Provider Registry** | 5 hrs | Managing credentials dynamically without hardcoding. | `dyslexxy/domain/credential.py`, `dyslexxy/domain/provider_config.py` |
| **5.2 Dynamic Model Routing** | 5 hrs | Injecting the correct LLM based on user DB settings. | `dyslexxy/ai/provision.py` (Study the `provision_langchain_model` function) |
| **5.3 Token Tracking** | 5 hrs | Calculating costs and preventing context overflows. | `dyslexxy/utils/token_utils.py` |

---

## Recommended Tools for Bypass
* **Frontend:** Use [v0.dev](https://v0.dev/) or Lovable to generate the entire React/Next.js dashboard. Do not spend time centering divs.
* **Database:** Stick with SurrealDB or transition to Qdrant (very popular in pure Systems ML).
* **Models:** Download Ollama locally so you can test your pipelines with `Llama-3` without paying API fees.
