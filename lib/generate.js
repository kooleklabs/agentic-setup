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
const { runArchitectureGate } = require('./architect-gate.js');
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

const DEFAULT_MODEL = 'claude-sonnet-4-6';

function parseArgs(argv) {
  const out = {
    mode: 'interactive',
    interactive: false,
    model: DEFAULT_MODEL,
    target: 'both',
    skipArchitecture: false,
    fromAnalysis: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--from' && argv[i + 1]) {
      out.mode = 'file';
      out.file = argv[++i];
    } else if (a === '--idea' && argv[i + 1]) {
      out.mode = 'idea';
      out.idea = argv[++i];
    } else if (a === '--interactive' || a === '-i') {
      out.interactive = true;
    } else if (a === '--model' && argv[i + 1]) {
      out.model = argv[++i];
    } else if (a === '--target' && argv[i + 1]) {
      const val = argv[++i].toLowerCase();
      if (!['claude', 'copilot', 'both'].includes(val)) {
        process.stderr.write(`Invalid --target value: "${val}". Must be: claude, copilot, or both\n`);
        process.exit(1);
      }
      out.target = val;
    } else if (a === '--skip-architecture') out.skipArchitecture = true;
    else if (a === '--from-analysis') out.fromAnalysis = true;
    else if (a === '--help' || a === '-h') {
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
  --from <file>      Requirement document (.md, .txt, .docx, .pdf)
  --idea "<text>"    Describe the project inline
  --interactive, -i  Pause for clarification when Claude asks a question
  --model <name>     Override the model (default: claude-sonnet-4-6)
  --target <target>  Output target: claude, copilot, or both (default: both)
  --skip-architecture   Skip the architecture design gate (for re-runs)
  --from-analysis       Migration path — skip architecture, analysis already done
  --help             Show this help

Examples:
  npx @kooleklabs/agentic-app generate --from proposal.docx
  npx @kooleklabs/agentic-app generate --idea "Next.js + Go + Postgres"
  npx @kooleklabs/agentic-app generate --from spec.md --interactive
  npx @kooleklabs/agentic-app generate --target copilot --from spec.md
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

function runSetup(target) {
  if (!fs.existsSync(SETUP_SH)) {
    throw new Error(`Bundled setup.sh not found at ${SETUP_SH}`);
  }
  const args = ['--target', target || 'both'];
  const r = spawnSync('bash', [SETUP_SH, ...args], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
  });
  if (r.status !== 0) throw new Error(`setup.sh exited with code ${r.status}`);
}

/**
 * Defensively mark all .sh files under .claude/hooks/ as executable.
 * Runs after setup.sh so npm-pack/permission-loss edge cases don't leave
 * users with non-executable hooks. No-ops if the hooks directory is absent.
 */
function ensureHooksExecutable(cwd) {
  const hooksDir = path.join(cwd, '.claude', 'hooks');
  if (!fs.existsSync(hooksDir)) return;
  for (const entry of fs.readdirSync(hooksDir)) {
    if (!entry.endsWith('.sh')) continue;
    const file = path.join(hooksDir, entry);
    const current = fs.statSync(file).mode;
    fs.chmodSync(file, current | 0o111); // +x for user, group, other
  }
}

function loadSdk() {
  try {
    return require('@anthropic-ai/claude-agent-sdk');
  } catch (err) {
    throw new Error(
      'Failed to load @anthropic-ai/claude-agent-sdk. ' +
        'If you ran via npx, the dependency should have installed automatically. ' +
        `Underlying error: ${err.message}`
    );
  }
}

function sdkOptions(abort, isContinuation, model) {
  return {
    cwd: process.cwd(),
    model: model || DEFAULT_MODEL,
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
    // Lowest-level override: canUseTool is consulted before every tool
    // call and its return value wins over Claude Code's hardcoded
    // protection on .claude/** and .mcp.json. Without this, Write to
    // .claude/agents/*.md silently fails and Claude falls back to
    // staging files in _setup/ which the user then has to copy in.
    canUseTool: async (_toolName, input) => ({
      behavior: 'allow',
      updatedInput: input,
    }),
    // See commit history — these cover hook-level and plugin-level
    // rejections. canUseTool above handles the hardcoded layer.
    env: { ...process.env, ENABLE_SECURITY_REMINDER: '0' },
    plugins: [],
    abortController: abort,
    systemPrompt: { type: 'preset', preset: 'claude_code' },
    tools: { type: 'preset', preset: 'claude_code' },
    continue: isContinuation,
  };
}

/**
 * Heuristic: did Claude's final turn end with a clarifying question?
 * Returns the question text if yes, otherwise null.
 */
function detectQuestion(lastAssistantText) {
  if (!lastAssistantText) return null;
  const trimmed = lastAssistantText.trim();
  if (!trimmed) return null;
  // Ends with a question mark OR contains common clarification phrases.
  const endsWithQ = /\?\s*$/.test(trimmed);
  const phraseRe = /\b(please confirm|which (option|approach)|would you prefer|should i|do you want|let me know|clarif)/i;
  if (endsWithQ || phraseRe.test(trimmed)) return trimmed;
  return null;
}

async function askUser(rl, question) {
  return new Promise((resolve) => rl.question(question, (ans) => resolve(ans)));
}

/**
 * Runs a single query() iteration. Returns { lastText, successful, aborted }.
 */
async function runOneTurn({ query, prompt, abort, renderer, isContinuation, model }) {
  let lastAssistantText = '';
  let successful = false;
  let aborted = false;

  try {
    for await (const message of query({
      prompt,
      options: sdkOptions(abort, isContinuation, model),
    })) {
      renderer.handleMessage(message);
      if (message?.type === 'assistant') {
        const blocks = message.message?.content;
        if (Array.isArray(blocks)) {
          for (const b of blocks) {
            if (b && b.type === 'text' && b.text) lastAssistantText = b.text;
          }
        }
      }
      if (message?.type === 'result') {
        successful = message.subtype === 'success';
      }
    }
  } catch (err) {
    if (err && (err.name === 'AbortError' || abort.signal.aborted)) {
      aborted = true;
    } else {
      throw err;
    }
  }

  return { lastAssistantText, successful, aborted };
}

async function callAgentSdk(initialPrompt, opts = {}) {
  const { interactive = false, maxTurns = 5, model } = opts;
  const { query } = loadSdk();

  const renderer = new ProgressRenderer();
  const abort = new AbortController();

  const onSigint = () => {
    console.log(`\n${YELLOW}Cancelling…${NC}`);
    abort.abort();
  };
  process.on('SIGINT', onSigint);

  const rl = interactive
    ? readline.createInterface({ input: process.stdin, output: process.stdout })
    : null;

  try {
    let currentPrompt = initialPrompt;
    let isContinuation = false;

    for (let turn = 0; turn < maxTurns; turn++) {
      const { lastAssistantText, aborted } = await runOneTurn({
        query,
        prompt: currentPrompt,
        abort,
        renderer,
        isContinuation,
        model,
      });

      if (aborted) return { cancelled: true };

      if (!interactive) return {}; // classic autonomous mode — one turn, we're done

      const question = detectQuestion(lastAssistantText);
      if (!question) return {}; // Claude finished without asking

      console.log('');
      console.log(`${YELLOW}${BOLD}Claude is asking for clarification:${NC}`);
      console.log('');
      console.log(`  ${CYAN}${question.slice(0, 400)}${CYAN}`);
      console.log(`${NC}`);
      const answer = (await askUser(rl, 'Your answer (or "quit" to exit) > ')).trim();

      if (!answer || /^(quit|exit|q)$/i.test(answer)) {
        console.log(`${YELLOW}Aborted by user.${NC}`);
        return { cancelled: true };
      }

      currentPrompt = answer;
      isContinuation = true;
    }

    console.log('');
    console.log(`${YELLOW}[!]${NC} Reached max clarification turns (${maxTurns}). Stopping.`);
    return {};
  } finally {
    process.off('SIGINT', onSigint);
    if (rl) rl.close();
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
  runSetup(args.target);
  ensureHooksExecutable(process.cwd());

  console.log('');
  console.log(`${GREEN}[✓]${NC} Requirement captured (${wordCount(requirement)} words)`);
  console.log('');
  console.log(`${GREEN}[✓]${NC} Starting Claude Agent SDK session…`);
  console.log('');
  console.log(`  ${BOLD}Expected duration:${NC} 3–8 minutes for a typical requirement.`);
  console.log(`  ${BOLD}Model:${NC} ${args.model}`);
  console.log(`  ${BOLD}Target:${NC} ${args.target}`);
  console.log("  You'll see each file Claude writes appear below in real time.");
  if (args.interactive) {
    console.log(`  ${BOLD}Interactive mode:${NC} pauses when Claude asks for clarification.`);
  }
  console.log('');

  const prompt = buildGeneratePrompt(requirement, args.target);

  try {
    const result = await callAgentSdk(prompt, {
      interactive: args.interactive,
      model: args.model,
    });
    if (result && result.cancelled) return 130;
  } catch (err) {
    if (err && err.name === 'AbortError') {
      console.log(`\n${YELLOW}Generation cancelled by user.${NC}`);
      return 130;
    }
    console.error(`\n${YELLOW}[!]${NC} Agent SDK error: ${err.message || err}`);
    return 1;
  }

  // Architecture Design Gate — auto-runs unless skipped
  const gate = await runArchitectureGate({
    requirement,
    cwd: process.cwd(),
    skip: args.skipArchitecture,
    fromAnalysis: args.fromAnalysis,
  });
  if (gate.cancelled) return 130;
  if (gate.ok === false && gate.error) {
    console.error(`\n${YELLOW}[!]${NC} Architecture gate error: ${gate.error}`);
    return 1;
  }
  // If gate produced partial results (ok:false, missing:[...]), do NOT
  // exit 1 — the user has partial files to finish manually. Exit 0 with
  // the warning banner already printed by the gate.

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

module.exports = { main, parseArgs, detectQuestion, ensureHooksExecutable };
