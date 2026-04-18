/**
 * SDK wrapper that runs an implementation pass against a merged plan.
 * Agent gets Write/Edit/Read/Bash tools via the claude_code preset.
 * Tracks files written and commands run by parsing the stream; cost
 * enforcement is delegated to the SDK's built-in maxBudgetUsd option.
 */

const { ProgressRenderer } = require('./render.js');

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_MAX_COST_USD = 5.00;

function loadSdk() {
  return require('@anthropic-ai/claude-agent-sdk');
}

function sdkOptions({ cwd, model, abort, maxCostUsd }) {
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
    maxBudgetUsd: maxCostUsd,
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
- If the repo has no \`.gitignore\` that excludes \`node_modules/\`, \`dist/\`, \`build/\`, \`.next/\`, \`target/\`, \`coverage/\`, \`.env\`, and \`*.log\`, create or extend \`.gitignore\` to cover them BEFORE running any install / build command. These paths must never land in the WIP commit.
- Never create or stage \`.env\` files. Use \`.env.example\` for placeholder values.
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

function extractResultCostUsd(message) {
  if (!message || message.type !== 'result') return 0;
  // SDK reports the authoritative total on the terminal `result` message.
  const direct = Number(message.total_cost_usd || message.totalCostUsd || 0);
  if (Number.isFinite(direct) && direct > 0) return direct;
  return 0;
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

  try {
    for await (const message of query({
      prompt,
      options: sdkOptions({ cwd, model, abort: controller, maxCostUsd }),
    })) {
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
      } else if (message && message.type === 'result') {
        costUsd = extractResultCostUsd(message) || costUsd;
      }
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
