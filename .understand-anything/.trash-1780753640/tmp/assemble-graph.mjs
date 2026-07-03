import fs from 'fs';
import { execSync } from 'child_process';

function run() {
  console.log('Assembling final KnowledgeGraph...');
  
  const scanResultPath = '/home/debayan_ghosh/ai_assistant/AiAssistant-/.understand-anything/intermediate/scan-result.json';
  const assembledGraphPath = '/home/debayan_ghosh/ai_assistant/AiAssistant-/.understand-anything/intermediate/assembled-graph.json';
  const layersPath = '/home/debayan_ghosh/ai_assistant/AiAssistant-/.understand-anything/intermediate/layers.json';
  const tourPath = '/home/debayan_ghosh/ai_assistant/AiAssistant-/.understand-anything/intermediate/tour.json';

  const scanResult = JSON.parse(fs.readFileSync(scanResultPath, 'utf8'));
  const graphData = JSON.parse(fs.readFileSync(assembledGraphPath, 'utf8'));
  const layers = JSON.parse(fs.readFileSync(layersPath, 'utf8'));
  const tour = JSON.parse(fs.readFileSync(tourPath, 'utf8'));

  let gitCommitHash = '';
  try {
    gitCommitHash = execSync('git rev-parse HEAD').toString().trim();
  } catch (e) {
    gitCommitHash = 'unknown';
  }

  const finalGraph = {
    version: '1.0.0',
    project: {
      name: scanResult.name,
      languages: scanResult.languages,
      frameworks: scanResult.frameworks,
      description: scanResult.description,
      analyzedAt: new Date().toISOString(),
      gitCommitHash
    },
    nodes: graphData.nodes,
    edges: graphData.edges,
    layers,
    tour
  };

  fs.writeFileSync(assembledGraphPath, JSON.stringify(finalGraph, null, 2));
  console.log('KnowledgeGraph successfully assembled at:', assembledGraphPath);
}

run();
