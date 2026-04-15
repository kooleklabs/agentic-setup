#!/usr/bin/env node
/**
 * @kooleklabs/agentic-app
 * Thin Node CLI that dispatches to the bundled bash scripts.
 * Scripts run in the user's current working directory.
 */

const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const PKG_ROOT = path.resolve(__dirname, '..');

const SCRIPTS = {
  init: 'setup.sh',
  setup: 'setup.sh',
  generate: 'generate.sh',
  migrate: 'migrate.sh',
};

const ALIASES = {
  gen: 'generate',
  mig: 'migrate',
  install: 'setup',
};

const HELP = `
Universal Agentic Development Framework

Usage:
  npx @kooleklabs/agentic-app <command> [options]

Commands:
  init, setup                 Install base framework in the current directory
    --interactive             Prompt for project name, stack, and conventions

  generate [options]          Generate a customized framework from a requirement
    --from <file>             Document (.md, .txt, .docx, .pdf) — pandoc/pdftotext may be required
    --idea "<text>"           Describe the project inline

  migrate [options]           Install framework tuned to an existing codebase
    --dir <path>              Target directory (default: cwd)
    --quick                   Quick scan — manifests + README only
    --full                    Full audit — 20+ files, CI, infra

Examples:
  npx @kooleklabs/agentic-app init
  npx @kooleklabs/agentic-app generate --from proposal.docx
  npx @kooleklabs/agentic-app generate --idea "Next.js + Go Fiber + Postgres"
  npx @kooleklabs/agentic-app migrate --dir ./legacy-api

Docs: https://github.com/KoolekLabs/agentic-setup
`;

function main() {
  const [, , rawCmd, ...args] = process.argv;

  if (!rawCmd || rawCmd === '--help' || rawCmd === '-h' || rawCmd === 'help') {
    console.log(HELP.trim());
    process.exit(rawCmd ? 0 : 0);
  }

  if (rawCmd === '--version' || rawCmd === '-v' || rawCmd === 'version') {
    const pkg = require(path.join(PKG_ROOT, 'package.json'));
    console.log(pkg.version);
    process.exit(0);
  }

  const cmd = ALIASES[rawCmd] || rawCmd;
  const scriptName = SCRIPTS[cmd];

  if (!scriptName) {
    console.error(`Unknown command: ${rawCmd}\n`);
    console.log(HELP.trim());
    process.exit(1);
  }

  const scriptPath = path.join(PKG_ROOT, scriptName);
  if (!fs.existsSync(scriptPath)) {
    console.error(`Missing bundled script: ${scriptPath}`);
    console.error('Try reinstalling: npm install -g @kooleklabs/agentic-app');
    process.exit(1);
  }

  const result = spawnSync('bash', [scriptPath, ...args], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
  });

  if (result.error) {
    if (result.error.code === 'ENOENT') {
      console.error('bash is required but not found on PATH.');
    } else {
      console.error(result.error.message);
    }
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

main();
