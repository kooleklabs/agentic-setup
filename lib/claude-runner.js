#!/usr/bin/env node
/**
 * Generic Claude Agent SDK runner.
 *
 * Reads a prompt from a file (or stdin), runs it through the Agent SDK
 * with our standard hardened options, streams live progress to STDERR,
 * and optionally captures the final assistant text to an output file
 * (or STDOUT if no --capture-to is given).
 *
 * Usage:
 *   node lib/claude-runner.js --prompt-file PROMPT.md [--capture-to OUT.md] [--title "Phase name"]
 *   cat prompt.md | node lib/claude-runner.js --capture-to OUT.md
 *
 * Exit codes:
 *   0  success
 *   1  SDK error / prompt missing / etc.
 *   130 cancelled by user (SIGINT)
 */

const fs = require('node:fs');
const path = require('node:path');
const { ProgressRenderer } = require('./render.js');

const YELLOW = '\x1b[1;33m';
const GREEN = '\x1b[0;32m';
const BOLD = '\x1b[1m';
const NC = '\x1b[0m';

const DEFAULT_MODEL = 'claude-sonnet-4-6';

function parseArgs(argv) {
  const out = { model: DEFAULT_MODEL };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--prompt-file' && argv[i + 1]) out.promptFile = argv[++i];
    else if (a === '--capture-to' && argv[i + 1]) out.captureTo = argv[++i];
    else if (a === '--title' && argv[i + 1]) out.title = argv[++i];
    else if (a === '--model' && argv[i + 1]) out.model = argv[++i];
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function printHelp() {
  process.stderr.write(`
claude-runner — Generic Claude Agent SDK runner

Usage:
  node lib/claude-runner.js --prompt-file PROMPT.md [--capture-to OUT.md] [--title "Phase"]
  cat prompt.md | node lib/claude-runner.js --capture-to OUT.md

Options:
  --prompt-file <path>   Read the prompt from this file (else read stdin)
  --capture-to <path>    Capture the final assistant text to this file
  --title <text>         Show this title above the live progress output
`.trim() + '\n');
}

async function readStdin() {
  return new Promise((resolve) => {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (buf += c));
    process.stdin.on('end', () => resolve(buf));
  });
}

function loadSdk() {
  try {
    return require('@anthropic-ai/claude-agent-sdk');
  } catch (err) {
    throw new Error(
      'Failed to load @anthropic-ai/claude-agent-sdk. ' +
        'If you ran via npx the dependency should have installed automatically. ' +
        `Underlying error: ${err.message}`
    );
  }
}

async function run(opts) {
  const { prompt, captureTo, title, model = DEFAULT_MODEL } = opts;
  const { query } = loadSdk();

  const renderer = new ProgressRenderer();
  const abort = new AbortController();

  const onSigint = () => {
    process.stderr.write(`\n${YELLOW}Cancelling…${NC}\n`);
    abort.abort();
  };
  process.on('SIGINT', onSigint);

  if (title) {
    process.stderr.write(`\n${BOLD}${title}${NC}\n\n`);
  }

  // We're collecting the final assistant text for --capture-to.
  let capturedText = '';

  try {
    for await (const message of query({
      prompt,
      options: {
        cwd: process.cwd(),
        model,
        allowedTools: ['Write', 'Edit', 'MultiEdit', 'Read', 'Bash', 'Glob', 'Grep', 'TodoWrite'],
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        // See lib/generate.js sdkOptions() for the full story: canUseTool
        // overrides Claude Code's hardcoded protection on .claude/** and
        // .mcp.json; env + plugins cover plugin-hook vetoes.
        canUseTool: async (_toolName, input) => ({
          behavior: 'allow',
          updatedInput: input,
        }),
        env: { ...process.env, ENABLE_SECURITY_REMINDER: '0' },
        plugins: [],
        abortController: abort,
        systemPrompt: { type: 'preset', preset: 'claude_code' },
        tools: { type: 'preset', preset: 'claude_code' },
      },
    })) {
      renderer.handleMessage(message);

      // Collect text blocks from assistant messages.
      if (message?.type === 'assistant') {
        const blocks = message.message?.content;
        if (Array.isArray(blocks)) {
          for (const b of blocks) {
            if (b && b.type === 'text' && b.text) {
              capturedText += (capturedText ? '\n\n' : '') + b.text;
            }
          }
        }
      }
    }
  } catch (err) {
    if (err && (err.name === 'AbortError' || abort.signal.aborted)) {
      return 130;
    }
    process.stderr.write(`\n${YELLOW}[!]${NC} Agent SDK error: ${err.message || err}\n`);
    return 1;
  } finally {
    process.off('SIGINT', onSigint);
  }

  if (captureTo) {
    fs.writeFileSync(captureTo, capturedText);
    process.stderr.write(`\n${GREEN}[✓]${NC} Wrote ${path.resolve(captureTo)}\n`);
  } else if (capturedText) {
    // Caller piping our stdout into a file expects the assistant text here.
    process.stdout.write(capturedText + '\n');
  }

  return 0;
}

async function main() {
  // Redirect renderer output to stderr so stdout stays clean for --capture-to
  // piped usage. ProgressRenderer uses console.log → stdout; we re-point it.
  const origLog = console.log;
  console.log = (...args) => process.stderr.write(args.join(' ') + '\n');

  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      printHelp();
      return 0;
    }

    let prompt = '';
    if (args.promptFile) {
      if (!fs.existsSync(args.promptFile)) {
        process.stderr.write(`Prompt file not found: ${args.promptFile}\n`);
        return 1;
      }
      prompt = fs.readFileSync(args.promptFile, 'utf8');
    } else {
      prompt = await readStdin();
    }

    if (!prompt.trim()) {
      process.stderr.write('Empty prompt.\n');
      return 1;
    }

    return await run({
      prompt,
      captureTo: args.captureTo,
      title: args.title,
      model: args.model,
    });
  } finally {
    console.log = origLog;
  }
}

if (require.main === module) {
  main().then((code) => process.exit(code ?? 0));
}

module.exports = { run, parseArgs };
