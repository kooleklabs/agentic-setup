/**
 * Architecture Design Gate — runs the architect agent after scaffolding
 * to produce a full system design. Validates outputs; retries once if
 * incomplete; surfaces a review banner on success.
 *
 * Public API:
 *   runArchitectureGate({ requirement, cwd, skip, fromAnalysis, model })
 *     → { skipped } | { ok, retried } | { ok: false, missing }
 *        | { cancelled } | { ok: false, error }
 */

const fs = require('node:fs');
const path = require('node:path');
const { ProgressRenderer } = require('./render.js');
const { buildArchitectPrompt } = require('./architect-prompt.js');
const { validateArchitectOutputs } = require('./validate-outputs.js');

const CYAN = '\x1b[0;36m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[1;33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const NC = '\x1b[0m';

function loadSdk() {
  return require('@anthropic-ai/claude-agent-sdk');
}

function shouldSkip({ skip, fromAnalysis, cwd }) {
  if (skip) return 'flag';
  if (fromAnalysis) return 'from-analysis';
  const existing = path.join(cwd, 'docs', 'architecture.md');
  if (fs.existsSync(existing)) return 'exists';
  return null;
}

function sdkOptions(abort, cwd, model) {
  return {
    cwd,
    model: model || 'claude-opus-4-6',
    allowedTools: ['Write', 'Edit', 'MultiEdit', 'Read', 'Bash', 'Glob', 'Grep', 'TodoWrite'],
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    canUseTool: async (_name, input) => ({ behavior: 'allow', updatedInput: input }),
    env: { ...process.env, ENABLE_SECURITY_REMINDER: '0' },
    plugins: [],
    abortController: abort,
    systemPrompt: { type: 'preset', preset: 'claude_code' },
    tools: { type: 'preset', preset: 'claude_code' },
  };
}

async function runOnce({ query, prompt, abort, renderer, cwd, model }) {
  try {
    for await (const message of query({ prompt, options: sdkOptions(abort, cwd, model) })) {
      renderer.handleMessage(message);
    }
    return { ok: true };
  } catch (err) {
    if (err && (err.name === 'AbortError' || abort.signal.aborted)) {
      return { cancelled: true };
    }
    return { error: err.message || String(err) };
  }
}

function printReviewBanner() {
  console.log('');
  console.log(`${GREEN}${BOLD}✓ Architecture design complete.${NC} Review these files:`);
  console.log(`  ${CYAN}docs/architecture.md${NC}`);
  console.log(`  ${CYAN}docs/decisions/${NC}`);
  console.log(`  ${CYAN}contracts/api-spec.yaml${NC}`);
  console.log('');
  console.log(`${DIM}When you're happy with the design, commit it:${NC}`);
  console.log(`  ${DIM}git add docs/ contracts/ && git commit -m "design: initial architecture"${NC}`);
  console.log('');
  console.log(`${DIM}Then begin implementation via TDD.${NC}`);
  console.log('');
}

function printSkipBanner(reason) {
  const reasons = {
    flag: 'skipped via --skip-architecture',
    exists: 'docs/architecture.md already exists',
    'from-analysis': 'skipped (migration path with existing analysis)',
  };
  console.log('');
  console.log(`${YELLOW}↷ Architecture gate ${reasons[reason] || 'skipped'}${NC}`);
  console.log('');
}

function printFailureBanner(missing) {
  console.log('');
  console.log(`${YELLOW}⚠ Architecture gate did not complete all outputs.${NC}`);
  console.log(`${YELLOW}  Partial files remain for you to finish manually:${NC}`);
  for (const m of missing) console.log(`    - ${m}`);
  console.log('');
}

async function runArchitectureGate({ requirement, cwd = process.cwd(), skip, fromAnalysis, model }) {
  const skipReason = shouldSkip({ skip, fromAnalysis, cwd });
  if (skipReason) {
    printSkipBanner(skipReason);
    return { skipped: true, reason: skipReason };
  }

  console.log('');
  console.log(`${CYAN}${BOLD}▶ Architecture Design Gate${NC}`);
  console.log(`${DIM}  Producing system design before any feature code is written…${NC}`);
  console.log('');

  const { query } = loadSdk();
  const renderer = new ProgressRenderer();
  const abort = new AbortController();
  const onSigint = () => abort.abort();
  process.on('SIGINT', onSigint);

  try {
    const prompt1 = buildArchitectPrompt({ requirement });
    const first = await runOnce({ query, prompt: prompt1, abort, renderer, cwd, model });
    if (first.cancelled) return { cancelled: true };
    if (first.error) return { ok: false, error: first.error };

    let result = validateArchitectOutputs(cwd);
    if (result.ok) {
      printReviewBanner();
      return { ok: true, retried: false };
    }

    console.log('');
    console.log(`${YELLOW}Initial design incomplete — requesting completion of missing outputs…${NC}`);
    const prompt2 = buildArchitectPrompt({ requirement, retry: true, missing: result.missing });
    const second = await runOnce({ query, prompt: prompt2, abort, renderer, cwd, model });
    if (second.cancelled) return { cancelled: true };
    if (second.error) return { ok: false, error: second.error };

    result = validateArchitectOutputs(cwd);
    if (result.ok) {
      printReviewBanner();
      return { ok: true, retried: true };
    }

    printFailureBanner(result.missing);
    return { ok: false, missing: result.missing, retried: true };
  } finally {
    process.off('SIGINT', onSigint);
  }
}

module.exports = { runArchitectureGate, shouldSkip };
