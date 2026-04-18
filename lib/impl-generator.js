/**
 * SDK wrapper that runs an implementation pass against a merged plan.
 * Agent gets Write/Edit/Read/Bash tools via the claude_code preset.
 * Tracks files written, commands run, and accumulated cost; hard-aborts
 * the stream if cost exceeds maxCostUsd.
 */

const { ProgressRenderer } = require('./render.js');

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_MAX_COST_USD = 5.00;

// Sonnet 4.6 approximate rates per 1M tokens. Values cross-referenced
// against Anthropic's public pricing as of early 2026. Used only for
// cost-cap enforcement; a small drift is acceptable.
const SONNET_INPUT_USD_PER_MTOK = 3.00;
const SONNET_OUTPUT_USD_PER_MTOK = 15.00;

function loadSdk() {
  return require('@anthropic-ai/claude-agent-sdk');
}

function sdkOptions({ cwd, model, abort }) {
  return {
    cwd: cwd || process.cwd(),
    model,
    env: { ...process.env, ENABLE_SECURITY_REMINDER: '0' },
    plugins: [],
    abortController: abort,
    allowDangerouslySkipPermissions: true,
    permissionMode: 'bypassPermissions',
    canUseTool: async (_name, input) => ({ behavior: 'allow', updatedInput: input }),
    systemPrompt: { type: 'preset', preset: 'claude_code' },
    tools: { type: 'preset', preset: 'claude_code' },
  };
}

function buildPrompt({ planBody, issue, architectureSection, apiSpecYaml, repoName }) {
  const apiBlock = apiSpecYaml
    ? ['```yaml', apiSpecYaml.trim(), '```'].join('\n')
    : '_No OpenAPI spec in this project._';

  return `You are implementing a reviewed plan for feature Issue #${issue.number} ("${issue.title}") ${repoName ? `in ${repoName}` : ''}.

The plan below has already been reviewed and merged. Your job is to produce the implementation on the current branch. The harness will commit your work as a single WIP commit after you finish.

## Hard rules

- Write all new or modified files using the Write / Edit tools. Do not print code blocks in your response.
- If the plan's test plan references tooling (\`npm test\`, \`pytest\`, etc.), run it via Bash to confirm green. If the tooling is not installed, skip that step and note it in your final response.
- Do NOT create git commits — the harness does that after you return.
- Do NOT push or open PRs.
- Stay within the \`## Files to change\` scope in the plan unless a dependency in the plan requires editing something adjacent; in that case call it out in your final response.

## The plan

${planBody.trim()}

## Matching architecture section

${architectureSection.trim()}

## OpenAPI spec

${apiBlock}

---

Implement the plan now. When done, respond with a short summary: files written, commands run, anything skipped or uncertain.`;
}

function assistantUsage(message) {
  const u = message && message.message && message.message.usage;
  if (!u) return { input: 0, output: 0 };
  return {
    input: Number(u.input_tokens || 0),
    output: Number(u.output_tokens || 0),
  };
}

function deltaCostUsd({ input, output }) {
  return (input * SONNET_INPUT_USD_PER_MTOK + output * SONNET_OUTPUT_USD_PER_MTOK) / 1_000_000;
}

async function runImplementation({
  planBody,
  issue,
  architectureSection,
  apiSpecYaml,
  repoName,
  cwd,
  model = DEFAULT_MODEL,
  maxCostUsd = DEFAULT_MAX_COST_USD,
  abort,
} = {}) {
  const { query } = loadSdk();
  const renderer = new ProgressRenderer();
  const ownAbort = !abort;
  const controller = abort || new AbortController();
  const onSigint = () => controller.abort();
  if (ownAbort) process.on('SIGINT', onSigint);

  const prompt = buildPrompt({ planBody, issue, architectureSection, apiSpecYaml, repoName });

  let capturedText = '';
  const filesWritten = [];
  const commandsRun = [];
  let costUsd = 0;
  let costExceeded = false;

  try {
    for await (const message of query({ prompt, options: sdkOptions({ cwd, model, abort: controller }) })) {
      renderer.handleMessage(message);

      if (message && message.type === 'assistant') {
        const blocks = message.message && message.message.content;
        if (Array.isArray(blocks)) {
          for (const b of blocks) {
            if (b && b.type === 'text' && b.text) {
              capturedText += (capturedText ? '\n\n' : '') + b.text;
            } else if (b && b.type === 'tool_use') {
              if ((b.name === 'Write' || b.name === 'Edit') && b.input && b.input.file_path) {
                if (!filesWritten.includes(b.input.file_path)) filesWritten.push(b.input.file_path);
              } else if (b.name === 'Bash' && b.input && b.input.command) {
                commandsRun.push(b.input.command);
              }
            }
          }
        }

        costUsd += deltaCostUsd(assistantUsage(message));
        if (!costExceeded && costUsd > maxCostUsd) {
          costExceeded = true;
          controller.abort();
        }
      }
    }

    if (costExceeded) {
      return {
        ok: false,
        cancelled: true,
        error: `Cost cap exceeded ($${costUsd.toFixed(2)} > $${maxCostUsd.toFixed(2)}). Partial work remains in the working tree.`,
        filesWritten,
        commandsRun,
        costUsd,
      };
    }

    return {
      ok: true,
      body: capturedText,
      filesWritten,
      commandsRun,
      costUsd,
    };
  } catch (err) {
    if (err && (err.name === 'AbortError' || controller.signal.aborted)) {
      return {
        cancelled: true,
        filesWritten,
        commandsRun,
        costUsd,
      };
    }
    return {
      ok: false,
      error: err.message || String(err),
      filesWritten,
      commandsRun,
      costUsd,
    };
  } finally {
    if (ownAbort) process.off('SIGINT', onSigint);
  }
}

module.exports = { runImplementation, DEFAULT_MODEL, DEFAULT_MAX_COST_USD };
