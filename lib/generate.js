/**
 * Node implementation of `generate` using @anthropic-ai/claude-agent-sdk.
 *
 * Replaces the old bash `generate.sh` path: no claude -p subprocess,
 * no stream-json parsing, no permission/hook workarounds.
 */

const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const readline = require('node:readline');

const { extractFromFile, wordCount } = require('./extract.js');
const { buildGeneratePrompt } = require('./prompt.js');
const { ProgressRenderer } = require('./render.js');

const CYAN = '\x1b[0;36m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[1;33m';
const BOLD = '\x1b[1m';
const NC = '\x1b[0m';

const PKG_ROOT = path.resolve(__dirname, '..');
const SETUP_SH = path.join(PKG_ROOT, 'setup.sh');

function printBanner() {
  console.log('');
  console.log(`${CYAN}╔══════════════════════════════════════════════════╗${NC}`);
  console.log(`${CYAN}║  ${BOLD}Agentic Framework Generator${NC}${CYAN}                     ║${NC}`);
  console.log(`${CYAN}║  Paste a requirement → get a customized framework${NC}${CYAN}║${NC}`);
  console.log(`${CYAN}╚══════════════════════════════════════════════════╝${NC}`);
  console.log('');
}

function parseArgs(argv) {
  const out = { mode: 'interactive' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--from' && argv[i + 1]) {
      out.mode = 'file';
      out.file = argv[++i];
    } else if (a === '--idea' && argv[i + 1]) {
      out.mode = 'idea';
      out.idea = argv[++i];
    } else if (a === '--help' || a === '-h') {
      out.help = true;
    }
  }
  return out;
}

function printHelp() {
  console.log(`
Usage:
  npx @kooleklabs/agentic-app generate [options]

Options:
  --from <file>    Requirement document (.md, .txt, .docx, .pdf)
  --idea "<text>"  Describe the project inline
  --help           Show this help

Examples:
  npx @kooleklabs/agentic-app generate --from proposal.docx
  npx @kooleklabs/agentic-app generate --idea "Next.js + Go + Postgres"
  npx @kooleklabs/agentic-app generate
`.trim());
}

async function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
  });
}

async function promptInteractive() {
  console.log(`${BOLD}Paste your requirement below.${NC}`);
  console.log('This can be a PRD, proposal, feature spec, or just an idea.');
  console.log(`Press ${YELLOW}Ctrl+D${NC} when done.`);
  console.log('');
  return readStdin();
}

function runSetup() {
  if (!fs.existsSync(SETUP_SH)) {
    throw new Error(`Bundled setup.sh not found at ${SETUP_SH}`);
  }
  const r = spawnSync('bash', [SETUP_SH], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
  });
  if (r.status !== 0) throw new Error(`setup.sh exited with code ${r.status}`);
}

async function callAgentSdk(prompt) {
  let query;
  try {
    ({ query } = require('@anthropic-ai/claude-agent-sdk'));
  } catch (err) {
    throw new Error(
      'Failed to load @anthropic-ai/claude-agent-sdk. ' +
        'If you ran via npx, the dependency should have installed automatically. ' +
        `Underlying error: ${err.message}`
    );
  }

  const renderer = new ProgressRenderer();
  const abort = new AbortController();

  // Cancel the SDK session cleanly on Ctrl-C.
  const onSigint = () => {
    console.log(`\n${YELLOW}Cancelling…${NC}`);
    abort.abort();
  };
  process.on('SIGINT', onSigint);

  try {
    const iterator = query({
      prompt,
      options: {
        cwd: process.cwd(),
        allowedTools: [
          'Write',
          'Edit',
          'MultiEdit',
          'Read',
          'Bash',
          'Glob',
          'Grep',
          'TodoWrite',
        ],
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        // settingSources defaults to [] → user's ~/.claude/settings.json,
        // hooks, and plugins are intentionally NOT loaded. This is what
        // prevents the security-guidance plugin hook from vetoing writes.
        abortController: abort,
        systemPrompt: { type: 'preset', preset: 'claude_code' },
        tools: { type: 'preset', preset: 'claude_code' },
      },
    });

    for await (const message of iterator) {
      renderer.handleMessage(message);
    }
  } finally {
    process.off('SIGINT', onSigint);
  }
}

async function main(argv = process.argv.slice(3)) {
  const args = parseArgs(argv);

  if (args.help) {
    printHelp();
    return 0;
  }

  printBanner();

  let requirement = '';
  if (args.mode === 'file') {
    const abs = path.resolve(args.file);
    console.log(`${GREEN}[✓]${NC} Reading requirement from: ${abs}`);
    requirement = extractFromFile(abs);
  } else if (args.mode === 'idea') {
    console.log(`${GREEN}[✓]${NC} Using inline idea`);
    requirement = args.idea;
  } else {
    requirement = await promptInteractive();
  }

  requirement = (requirement || '').trim();
  if (!requirement) {
    console.error('No requirement provided.');
    return 1;
  }

  console.log('');
  console.log(`${GREEN}[✓]${NC} Running base framework setup…`);
  runSetup();

  console.log('');
  console.log(`${GREEN}[✓]${NC} Requirement captured (${wordCount(requirement)} words)`);
  console.log('');
  console.log(`${GREEN}[✓]${NC} Starting Claude Agent SDK session…`);
  console.log('');
  console.log(`  ${BOLD}Expected duration:${NC} 3–8 minutes for a typical requirement.`);
  console.log("  You'll see each file Claude writes appear below in real time.");
  console.log('');

  const prompt = buildGeneratePrompt(requirement);

  try {
    await callAgentSdk(prompt);
  } catch (err) {
    if (err && err.name === 'AbortError') {
      console.log(`\n${YELLOW}Generation cancelled by user.${NC}`);
      return 130;
    }
    console.error(`\n${YELLOW}[!]${NC} Agent SDK error: ${err.message || err}`);
    return 1;
  }

  console.log('');
  console.log(`${GREEN}╔══════════════════════════════════════════════════╗${NC}`);
  console.log(`${GREEN}║  ${BOLD}Done!${NC}${GREEN} Your framework is customized.               ║${NC}`);
  console.log(`${GREEN}╚══════════════════════════════════════════════════╝${NC}`);
  console.log('');
  console.log(`  ${BOLD}Next:${NC} Open Claude Code and type ${CYAN}/plan-feature${NC}`);
  console.log('');
  return 0;
}

if (require.main === module) {
  main().then((code) => process.exit(code ?? 0));
}

module.exports = { main };
