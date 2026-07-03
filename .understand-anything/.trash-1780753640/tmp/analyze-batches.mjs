import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectRoot = '/home/debayan_ghosh/ai_assistant/AiAssistant-';
const skillDir = '/home/debayan_ghosh/.gemini/antigravity/skills/understand-anything/understand';

function getFileSummary(filePath, fileCategory, resultsEntry) {
  try {
    const fullPath = path.join(projectRoot, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (filePath.endsWith('.py')) {
        const docstringMatch = content.match(/^\s*"""([\s\S]*?)"""/m) || content.match(/^\s*'''([\s\S]*?)'''/m);
        if (docstringMatch) {
          const doc = docstringMatch[1].trim().replace(/\s+/g, ' ').substring(0, 150);
          if (doc.length > 10) return doc;
        }
      } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
        const commentMatch = content.match(/^\s*\/\*\*([\s\S]*?)\*\//m);
        if (commentMatch) {
          const doc = commentMatch[1].replace(/\*/g, '').trim().replace(/\s+/g, ' ').substring(0, 150);
          if (doc.length > 10) return doc;
        }
      }
    }
  } catch (e) {
    // ignore
  }

  if (fileCategory === 'config') return `Configuration rules and parameters for ${path.basename(filePath)}.`;
  if (fileCategory === 'docs') return `Documentation content for ${path.basename(filePath)}.`;
  if (fileCategory === 'infra') return `Infrastructure orchestration rules for ${path.basename(filePath)}.`;
  if (filePath.includes('test') || filePath.includes('spec')) return `Verification test suite for code correctness in ${path.basename(filePath)}.`;

  const parts = [];
  if (resultsEntry.classes && resultsEntry.classes.length > 0) {
    const names = resultsEntry.classes.map(c => c.name).slice(0, 2).join(', ');
    parts.push(`defines classes like ${names}`);
  }
  if (resultsEntry.functions && resultsEntry.functions.length > 0) {
    const names = resultsEntry.functions.map(f => f.name).slice(0, 2).join(', ');
    parts.push(`implements functions like ${names}`);
  }
  if (parts.length > 0) {
    return `Source module that ${parts.join(' and ')}.`;
  }
  return `Source implementation module for ${path.basename(filePath)}.`;
}

function getFileTags(filePath, fileCategory, resultsEntry, language) {
  const tags = new Set();
  if (fileCategory === 'config') {
    tags.add('configuration');
    tags.add('settings');
  } else if (fileCategory === 'docs') {
    tags.add('documentation');
    tags.add('guides');
  } else if (fileCategory === 'infra') {
    tags.add('infrastructure');
    if (filePath.includes('Docker')) tags.add('containerization');
    if (filePath.includes('workflow') || filePath.includes('ci')) tags.add('ci-cd');
  } else if (fileCategory === 'data') {
    tags.add('data-model');
    tags.add('database');
  }

  if (filePath.includes('test') || filePath.includes('spec')) {
    tags.add('test');
    tags.add('testing');
  }
  if (filePath.includes('router') || filePath.includes('api/')) {
    tags.add('api-handler');
    tags.add('endpoint');
  }
  if (filePath.includes('util') || filePath.includes('helper')) {
    tags.add('utility');
    tags.add('helper');
  }

  if (resultsEntry.classes && resultsEntry.classes.length > 0) {
    tags.add('class');
  }
  if (resultsEntry.functions && resultsEntry.functions.length > 0) {
    tags.add('function');
  }

  if (language) tags.add(language.toLowerCase());

  const arr = Array.from(tags).map(t => t.replace(/\s+/g, '-').toLowerCase());
  while (arr.length < 3) arr.push('development');
  return arr.slice(0, 5);
}

function mapNodeType(fileCategory, filePath) {
  if (fileCategory === 'code') return 'file';
  if (fileCategory === 'config') return 'config';
  if (fileCategory === 'docs') return 'document';
  if (fileCategory === 'infra') {
    if (filePath.includes('Docker') || filePath.includes('compose') || filePath.includes('k8s')) return 'service';
    if (filePath.includes('workflow') || filePath.includes('gitlab-ci') || filePath.includes('Jenkins')) return 'pipeline';
    return 'resource';
  }
  if (fileCategory === 'data') {
    if (filePath.endsWith('.sql')) return 'table';
    if (filePath.endsWith('.graphql') || filePath.endsWith('.proto') || filePath.endsWith('.prisma')) return 'schema';
    return 'endpoint';
  }
  return 'file';
}

function run() {
  console.log('Starting Batch Analysis...');
  const batchesPath = path.join(projectRoot, '.understand-anything/intermediate/batches.json');
  const batchesData = JSON.parse(fs.readFileSync(batchesPath, 'utf8'));
  const totalBatches = batchesData.totalBatches;
  const batches = batchesData.batches;

  console.log(`Analyzing files: ${batchesData.totalFiles} files in ${totalBatches} batches.`);

  for (const batch of batches) {
    const idx = batch.batchIndex;
    console.log(`Processing Batch ${idx}/${totalBatches} (${batch.files.length} files)...`);

    const inputPath = path.join(projectRoot, `.understand-anything/tmp/ua-file-analyzer-input-${idx}.json`);
    const outputPath = path.join(projectRoot, `.understand-anything/tmp/ua-file-extract-results-${idx}.json`);

    const inputJson = {
      projectRoot,
      batchFiles: batch.files,
      batchImportData: batch.batchImportData
    };
    fs.writeFileSync(inputPath, JSON.stringify(inputJson, null, 2));

    // Run structural extraction script
    const cmd = `node ${skillDir}/extract-structure.mjs ${inputPath} ${outputPath}`;
    execSync(cmd, { stdio: 'inherit' });

    // Read results
    const extractResults = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

    const nodes = [];
    const edges = [];

    for (const fileResult of extractResults.results) {
      const filePath = fileResult.path;
      const fileCategory = fileResult.fileCategory;
      const language = fileResult.language;
      const nodeType = mapNodeType(fileCategory, filePath);

      const fileNodeId = `${nodeType}:${filePath}`;
      const fileSummary = getFileSummary(filePath, fileCategory, fileResult);
      const fileTags = getFileTags(filePath, fileCategory, fileResult, language);

      const complexity = fileResult.totalLines < 50 ? 'simple' : (fileResult.totalLines < 200 ? 'moderate' : 'complex');

      // 1. Create File Node
      nodes.push({
        id: fileNodeId,
        type: nodeType,
        name: path.basename(filePath),
        filePath,
        summary: fileSummary,
        tags: fileTags,
        complexity
      });

      // 2. Significant Functions and Classes
      if (fileResult.functions) {
        for (const fn of fileResult.functions) {
          const size = fn.endLine - fn.startLine;
          // Significance filter: exported or 10+ lines
          const isExported = fileResult.exports && fileResult.exports.some(e => e.name === fn.name);
          if (size >= 10 || isExported) {
            const fnId = `function:${filePath}:${fn.name}`;
            nodes.push({
              id: fnId,
              type: 'function',
              name: fn.name,
              filePath,
              lineRange: [fn.startLine, fn.endLine],
              summary: `Function implements logic for ${fn.name}.`,
              tags: ['function', 'logic', language.toLowerCase()],
              complexity: size < 20 ? 'simple' : (size < 50 ? 'moderate' : 'complex')
            });

            edges.push({
              source: fileNodeId,
              target: fnId,
              type: 'contains',
              direction: 'forward',
              weight: 1.0
            });

            if (isExported) {
              edges.push({
                source: fileNodeId,
                target: fnId,
                type: 'exports',
                direction: 'forward',
                weight: 0.8
              });
            }
          }
        }
      }

      if (fileResult.classes) {
        for (const cls of fileResult.classes) {
          const size = cls.endLine - cls.startLine;
          const isExported = fileResult.exports && fileResult.exports.some(e => e.name === cls.name);
          // Significance filter: class with 2+ methods or 20+ lines, or exported
          if (cls.methods.length >= 2 || size >= 20 || isExported) {
            const clsId = `class:${filePath}:${cls.name}`;
            nodes.push({
              id: clsId,
              type: 'class',
              name: cls.name,
              filePath,
              lineRange: [cls.startLine, cls.endLine],
              summary: `Class implements ${cls.name} structure and behaviors.`,
              tags: ['class', 'oop', language.toLowerCase()],
              complexity: size < 50 ? 'simple' : (size < 150 ? 'moderate' : 'complex')
            });

            edges.push({
              source: fileNodeId,
              target: clsId,
              type: 'contains',
              direction: 'forward',
              weight: 1.0
            });

            if (isExported) {
              edges.push({
                source: fileNodeId,
                target: clsId,
                type: 'exports',
                direction: 'forward',
                weight: 0.8
              });
            }
          }
        }
      }

      // 3. Edges (Imports, Call Graph etc.)
      const importPaths = batch.batchImportData[filePath] || [];
      for (const impPath of importPaths) {
        // Find if target node type is config, service, etc. (default to file)
        const targetCategory = batchesData.batches.find(b => b.files.some(f => f.path === impPath))?.files.find(f => f.path === impPath)?.fileCategory || 'code';
        const targetType = mapNodeType(targetCategory, impPath);
        
        edges.push({
          source: fileNodeId,
          target: `${targetType}:${impPath}`,
          type: 'imports',
          direction: 'forward',
          weight: 0.7
        });
      }

      // 4. Non-code subnodes (definitions, services, endpoints, steps, resources)
      if (fileResult.definitions) {
        for (const def of fileResult.definitions) {
          const defId = `schema:${filePath}:${def.name}`;
          nodes.push({
            id: defId,
            type: 'schema',
            name: def.name,
            filePath,
            summary: `Schema definition for kind ${def.kind}.`,
            tags: ['schema', 'definition'],
            complexity: 'simple'
          });
          edges.push({
            source: fileNodeId,
            target: defId,
            type: 'defines_schema',
            direction: 'forward',
            weight: 0.8
          });
        }
      }

      if (fileResult.services) {
        for (const s of fileResult.services) {
          const sId = `service:${filePath}:${s.name}`;
          nodes.push({
            id: sId,
            type: 'service',
            name: s.name,
            filePath,
            summary: `Service container ${s.name} building image ${s.image}.`,
            tags: ['service', 'docker', 'infrastructure'],
            complexity: 'simple'
          });
          edges.push({
            source: fileNodeId,
            target: sId,
            type: 'deploys',
            direction: 'forward',
            weight: 0.7
          });
        }
      }

      if (fileResult.endpoints) {
        for (const e of fileResult.endpoints) {
          const eId = `endpoint:${filePath}:${e.method}-${e.path}`;
          nodes.push({
            id: eId,
            type: 'endpoint',
            name: `${e.method} ${e.path}`,
            filePath,
            summary: `HTTP Endpoint serving ${e.method} ${e.path}.`,
            tags: ['endpoint', 'routing', 'api'],
            complexity: 'simple'
          });
          edges.push({
            source: fileNodeId,
            target: eId,
            type: 'serves',
            direction: 'forward',
            weight: 0.7
          });
        }
      }

      if (fileResult.steps) {
        for (const s of fileResult.steps) {
          const sId = `pipeline:${filePath}:${s.name}`;
          nodes.push({
            id: sId,
            type: 'pipeline',
            name: s.name,
            filePath,
            summary: `Workflow pipeline step ${s.name}.`,
            tags: ['pipeline', 'ci-cd'],
            complexity: 'simple'
          });
          edges.push({
            source: fileNodeId,
            target: sId,
            type: 'triggers',
            direction: 'forward',
            weight: 0.6
          });
        }
      }

      if (fileResult.resources) {
        for (const r of fileResult.resources) {
          const rId = `resource:${filePath}:${r.name}`;
          nodes.push({
            id: rId,
            type: 'resource',
            name: r.name,
            filePath,
            summary: `Terraform/Infrastructure resource ${r.name} of kind ${r.kind}.`,
            tags: ['resource', 'infrastructure'],
            complexity: 'simple'
          });
          edges.push({
            source: fileNodeId,
            target: rId,
            type: 'provisions',
            direction: 'forward',
            weight: 0.7
          });
        }
      }
    }

    // Output naming and partitioning protocol
    const nodeCount = nodes.length;
    const edgeCount = edges.length;

    if (nodeCount <= 60 && edgeCount <= 120) {
      const outPath = path.join(projectRoot, `.understand-anything/intermediate/batch-${idx}.json`);
      fs.writeFileSync(outPath, JSON.stringify({ nodes, edges }, null, 2));
      console.log(`Wrote single file for Batch ${idx}: ${nodeCount} nodes, ${edgeCount} edges`);
    } else {
      const parts = Math.ceil(Math.max(nodeCount / 60, edgeCount / 120));
      // Partition files alphabetically
      const sortedFiles = batch.files.map(f => f.path).sort();
      const filesPerPart = Math.ceil(sortedFiles.length / parts);

      for (let k = 1; k <= parts; k++) {
        const fileSubset = new Set(sortedFiles.slice((k - 1) * filesPerPart, k * filesPerPart));
        
        const partNodes = nodes.filter(n => fileSubset.has(n.filePath));
        const partNodeIds = new Set(partNodes.map(n => n.id));
        const partEdges = edges.filter(e => partNodeIds.has(e.source));

        const partPath = path.join(projectRoot, `.understand-anything/intermediate/batch-${idx}-part-${k}.json`);
        fs.writeFileSync(partPath, JSON.stringify({ nodes: partNodes, edges: partEdges }, null, 2));
        console.log(`Wrote part ${k}/${parts} for Batch ${idx}: ${partNodes.length} nodes, ${partEdges.length} edges`);
      }
    }
  }

  console.log('Batch Analysis completed successfully!');
}

run();
