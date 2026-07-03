import fs from 'fs';
import path from 'path';

function run() {
  console.log('Generating Guided Codebase Tour...');
  const graphPath = '/home/debayan_ghosh/ai_assistant/AiAssistant-/.understand-anything/intermediate/assembled-graph.json';
  const graphData = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const existingNodeIds = new Set(graphData.nodes.map(n => n.id));

  const tourSteps = [
    {
      order: 1,
      title: 'Project Overview',
      description: 'Start with the README to understand the core purpose of open-notebook: an AI-powered notebook interface that builds episodic memory, semantic index, and interactive features like quiz generation from your notes and uploads.',
      nodeIds: ['document:README.md']
    },
    {
      order: 2,
      title: 'Infrastructure Orchestration',
      description: 'Understand how the backend API, the SurrealDB database, and the frontend web app are containerized, configured, and run together locally in development and production environments.',
      nodeIds: ['service:Dockerfile', 'service:docker-compose.yml'],
      languageLesson: 'Multi-stage Docker builds separate build environments from slim runtime environments to decrease image size.'
    },
    {
      order: 3,
      title: 'API Entry & Authentication',
      description: 'Examine how the FastAPI backend bootstraps, initializes CORS/security middlewares, registers routers, and protects sensitive endpoints using API password validation.',
      nodeIds: ['file:api/main.py', 'file:api/auth.py'],
      languageLesson: 'FastAPI uses middleware class declarations to intercept requests globally and route handlers for specific path operations.'
    },
    {
      order: 4,
      title: 'Database Access & SurrealDB Integration',
      description: 'Examine the SurrealDB repository layer which connects the application to database records, handles raw SurrealQL query execution, and enforces relation-level schemas.',
      nodeIds: ['file:open_notebook/database/repository.py'],
      languageLesson: 'SurrealDB uses records IDs in table:id format. Repository methods wrap connection pools to abstract database queries.'
    },
    {
      order: 5,
      title: 'Domain Models',
      description: 'Learn about the core notebook structures—such as Notebook, Asset, Source, Note, and ChatSession—and how user credentials map to domain entities.',
      nodeIds: ['file:open_notebook/domain/notebook.py', 'file:open_notebook/domain/credential.py'],
      languageLesson: 'Pydantic models in Python enforce runtime type validation and serialize domain objects cleanly to and from JSON.'
    },
    {
      order: 6,
      title: 'AI Models & Key Provisioning',
      description: 'Trace how API keys are provisioned for various providers (OpenAI, Anthropic, Google, Ollama) and how models are discovered, registered, and managed.',
      nodeIds: ['file:open_notebook/ai/models.py', 'file:open_notebook/ai/key_provider.py'],
      languageLesson: 'Model managers cache API provider capabilities and dynamically test keys to prevent runtime LLM execution failures.'
    },
    {
      order: 7,
      title: 'Semantic Index & Chat Services',
      description: 'Explore how open-notebook constructs conversational agents, performs vector search, processes file embeddings, and generates notebook insights.',
      nodeIds: ['file:api/chat_service.py', 'file:api/embedding_service.py']
    },
    {
      order: 8,
      title: 'Interactive Quiz & LangGraph Flows',
      description: 'Dive into the LangGraph state machine that drives the interactive quiz generation flow, validating and repairing JSON schemas dynamically.',
      nodeIds: ['file:open_notebook/graphs/quiz.py', 'file:open_notebook/domain/quiz.py'],
      languageLesson: 'LangGraph uses a state graph where nodes represent computational steps and edges define conditional routing based on state updates.'
    },
    {
      order: 9,
      title: 'Next.js Web Frontend',
      description: 'Explore the Next.js page layout and root entry point which renders the premium user interface, managing active sessions and workspace views.',
      nodeIds: ['file:frontend/src/app/page.tsx', 'file:frontend/src/app/layout.tsx'],
      languageLesson: 'Next.js App Router uses file-system based routing where layout.tsx wraps page.tsx to share common layouts.'
    }
  ];

  // Validate Node IDs
  for (const step of tourSteps) {
    const invalidIds = step.nodeIds.filter(id => !existingNodeIds.has(id));
    if (invalidIds.length > 0) {
      console.warn(`Step "${step.title}" references non-existent node IDs in graph:`, invalidIds);
      // Let's fallback any missing node to file counterpart or similar if needed
      // Actually, let's verify if they exist.
    }
  }

  const outPath = '/home/debayan_ghosh/ai_assistant/AiAssistant-/.understand-anything/intermediate/tour.json';
  fs.writeFileSync(outPath, JSON.stringify(tourSteps, null, 2));
  console.log(`Tour steps successfully written to ${outPath}!`);
}

run();
