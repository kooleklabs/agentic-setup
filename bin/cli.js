#!/usr/bin/env node
/**
 * @kooleklabs/agentic-app
 *
 * CLI router:
 *   init, setup, migrate  → bundled bash scripts (unchanged)
 *   generate              → Node implementation using Claude Agent SDK
 *                           (pass --legacy to use the old bash generate.sh)
 */

const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const PKG_ROOT = path.resolve(__dirname, '..');

const BASH_SCRIPTS = {
  init: 'setup.sh',
  setup: 'setup.sh',
  migrate: 'migrate.sh',
  // `generate` default = Node. bash generate.sh is only via --legacy.
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
    --interactive, -i         Pause for clarification when Claude asks a question
    --model <name>            Override model (default: claude-sonnet-4-6)
    --legacy                  Use the bash generate.sh path (no Agent SDK)

  migrate [options]           Install framework tuned to an existing codebase
    --dir <path>              Target directory (default: cwd)
    --quick                   Quick scan — manifests + README only
    --full                    Full audit — 20+ files, CI, infra

Examples:
  npx @kooleklabs/agentic-app init
  npx @kooleklabs/agentic-app generate --from proposal.docx
  npx @kooleklabs/agentic-app generate --idea "Next.js + Go Fiber + Postgres"
  npx @kooleklabs/agentic-app migrate --dir ./legacy-api

Docs: https://github.com/kooleklabs/agentic-setup
`;

function runBashScript(scriptName, args) {
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

async function runGenerate(args) {
  if (args.includes('--legacy')) {
    const filtered = args.filter((a) => a !== '--legacy');
    return runBashScript('generate.sh', filtered);
  }
  const { main } = require(path.join(PKG_ROOT, 'lib', 'generate.js'));
  const code = await main(args);
  process.exit(code ?? 0);
}

async function main() {
  const [, , rawCmd, ...args] = process.argv;

  if (!rawCmd || rawCmd === '--help' || rawCmd === '-h' || rawCmd === 'help') {
    console.log(HELP.trim());
    process.exit(0);
  }

  if (rawCmd === '--version' || rawCmd === '-v' || rawCmd === 'version') {
    const pkg = require(path.join(PKG_ROOT, 'package.json'));
    console.log(pkg.version);
    process.exit(0);
  }

  const cmd = ALIASES[rawCmd] || rawCmd;

  if (cmd === 'generate') {
    return runGenerate(args);
  }

  const scriptName = BASH_SCRIPTS[cmd];
  if (!scriptName) {
    console.error(`Unknown command: ${rawCmd}\n`);
    console.log(HELP.trim());
    process.exit(1);
  }

  return runBashScript(scriptName, args);
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
