import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

function run() {
  console.log('Preparing fingerprint-input.json...');
  const projectRoot = '/home/debayan_ghosh/ai_assistant/AiAssistant-';
  const scanResultPath = path.join(projectRoot, '.understand-anything/intermediate/scan-result.json');
  const scanResult = JSON.parse(fs.readFileSync(scanResultPath, 'utf8'));
  const sourceFilePaths = scanResult.files.map(f => f.path);

  let gitCommitHash = '';
  try {
    gitCommitHash = execSync('git rev-parse HEAD').toString().trim();
  } catch (e) {
    gitCommitHash = 'unknown';
  }

  const inputJson = {
    projectRoot,
    sourceFilePaths,
    gitCommitHash
  };

  const inputPath = path.join(projectRoot, '.understand-anything/intermediate/fingerprint-input.json');
  fs.writeFileSync(inputPath, JSON.stringify(inputJson, null, 2));
  console.log('Wrote fingerprint-input.json.');

  // Run the fingerprints builder
  const skillDir = '/home/debayan_ghosh/.gemini/antigravity/skills/understand-anything/understand';
  console.log('Running build-fingerprints.mjs...');
  const cmd = `node ${skillDir}/build-fingerprints.mjs ${inputPath}`;
  execSync(cmd, { stdio: 'inherit' });
}

run();
