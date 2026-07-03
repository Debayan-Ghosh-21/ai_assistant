import fs from 'fs';
import path from 'path';

const projectRoot = '/home/debayan_ghosh/ai_assistant/AiAssistant-';

function run() {
  console.log('Starting Architecture Layering Analysis...');
  const graphPath = '/home/debayan_ghosh/ai_assistant/AiAssistant-/.understand-anything/intermediate/assembled-graph.json';
  const graphData = JSON.parse(fs.readFileSync(graphPath, 'utf8'));

  const fileTypes = new Set(['file', 'config', 'document', 'service', 'pipeline', 'table', 'schema', 'resource', 'endpoint']);
  const fileNodes = graphData.nodes.filter(n => fileTypes.has(n.type));

  console.log(`Found ${fileNodes.length} file-level nodes in assembled-graph.json.`);

  const layerFrontendUi = {
    id: 'layer:frontend-ui',
    name: 'Frontend User Interface',
    description: 'React components, UI styling, templates, and frontend visual layouts.',
    nodeIds: []
  };

  const layerFrontendLogic = {
    id: 'layer:frontend-logic',
    name: 'Frontend Logic and Client Services',
    description: 'Next.js app router pages, client state management (Zustand), API hooks, and client-side schemas.',
    nodeIds: []
  };

  const layerBackendApi = {
    id: 'layer:backend-api',
    name: 'Backend API Routing',
    description: 'FastAPI route definitions, request/response models, endpoint validation, and auth middleware.',
    nodeIds: []
  };

  const layerBackendService = {
    id: 'layer:backend-service',
    name: 'Backend Services and Business Logic',
    description: 'Core application workflows, LangGraph LLM chains, embedding processors, and podcast helpers.',
    nodeIds: []
  };

  const layerBackendData = {
    id: 'layer:backend-data',
    name: 'Data Access and Storage Layer',
    description: 'SurrealDB repository abstractions, SurrealQL migrations, and database connection pools.',
    nodeIds: []
  };

  const layerInfrastructure = {
    id: 'layer:infrastructure',
    name: 'Infrastructure and Orchestration',
    description: 'Multi-stage Dockerfiles, Docker Compose service configurations, and supervisord orchestrators.',
    nodeIds: []
  };

  const layerConfig = {
    id: 'layer:config',
    name: 'Project Configuration',
    description: 'Language, build, compiler configs, package dependency definitions, and tooling settings.',
    nodeIds: []
  };

  const layerDocumentation = {
    id: 'layer:documentation',
    name: 'Project Documentation',
    description: 'Markdown user manuals, setup guides, and developer workflows.',
    nodeIds: []
  };

  for (const node of fileNodes) {
    const fp = node.filePath;
    if (!fp) {
      console.warn(`Node ${node.id} has no filePath, skipping!`);
      continue;
    }

    // Heuristics
    if (node.type === 'document' || fp.endsWith('.md')) {
      layerDocumentation.nodeIds.push(node.id);
    } else if (fp.includes('Dockerfile') || fp.includes('docker-compose') || fp.includes('.github/') || fp.includes('supervisord') || fp.includes('nginx') || fp.includes('Caddyfile') || fp.endsWith('Makefile')) {
      layerInfrastructure.nodeIds.push(node.id);
    } else if (node.type === 'config' || fp.endsWith('.json') || fp.endsWith('.toml') || fp.endsWith('.lock') || fp.endsWith('.yaml') || fp.endsWith('.yml')) {
      layerConfig.nodeIds.push(node.id);
    } else if (fp.startsWith('frontend/src/components') || fp.startsWith('frontend/src/styles') || fp.endsWith('.css')) {
      layerFrontendUi.nodeIds.push(node.id);
    } else if (fp.startsWith('frontend/')) {
      layerFrontendLogic.nodeIds.push(node.id);
    } else if (fp.startsWith('api/routers/') || fp === 'api/main.py' || fp === 'api/auth.py') {
      layerBackendApi.nodeIds.push(node.id);
    } else if (fp.startsWith('open_notebook/database/') || fp.endsWith('.sql') || fp.endsWith('.surrealql')) {
      layerBackendData.nodeIds.push(node.id);
    } else if (fp.startsWith('open_notebook/') || fp.startsWith('api/') || fp.endsWith('.py')) {
      layerBackendService.nodeIds.push(node.id);
    } else {
      // Fallback
      layerConfig.nodeIds.push(node.id);
    }
  }

  const layers = [
    layerFrontendUi,
    layerFrontendLogic,
    layerBackendApi,
    layerBackendService,
    layerBackendData,
    layerInfrastructure,
    layerConfig,
    layerDocumentation
  ].filter(l => l.nodeIds.length > 0);

  const totalAssigned = layers.reduce((acc, l) => acc + l.nodeIds.length, 0);
  console.log(`Assigned ${totalAssigned}/${fileNodes.length} file nodes to ${layers.length} layers.`);

  if (totalAssigned !== fileNodes.length) {
    throw new Error(`Layer assignment mismatch! Assigned: ${totalAssigned}, expected: ${fileNodes.length}`);
  }

  const outPath = '/home/debayan_ghosh/ai_assistant/AiAssistant-/.understand-anything/intermediate/layers.json';
  fs.writeFileSync(outPath, JSON.stringify(layers, null, 2));
  console.log(`Layers successfully written to ${outPath}!`);
}

try {
  run();
} catch (e) {
  console.error('Failed to run architecture layering:', e);
  process.exit(1);
}
