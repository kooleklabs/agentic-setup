/**
 * Thin wrapper around the Claude Agent SDK for plan generation.
 * Single one-shot call — captures the assistant text and returns it.
 * Retry + validation are the orchestrator's responsibility.
 */

const { ProgressRenderer } = require('./render.js');

const DEFAULT_MODEL = 'claude-sonnet-4-6';

function loadSdk() {
  return require('@anthropic-ai/claude-agent-sdk');
}

function sdkOptions({ cwd, model, abort }) {
  return {
    cwd: cwd || process.cwd(),
    model,
    allowedTools: [],
    permissionMode: 'bypassPermissions',
    canUseTool: async (_name, input) => ({ behavior: 'allow', updatedInput: input }),
    env: { ...process.env, ENABLE_SECURITY_REMINDER: '0' },
    plugins: [],
    abortController: abort,
    systemPrompt: { type: 'preset', preset: 'claude_code' },
    tools: { type: 'preset', preset: 'claude_code' },
  };
}

async function generatePlan({ systemPrompt, userPrompt, model = DEFAULT_MODEL, cwd }) {
  const { query } = loadSdk();
  const renderer = new ProgressRenderer();
  const abort = new AbortController();
  const onSigint = () => abort.abort();
  process.on('SIGINT', onSigint);

  const prompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;
  let captured = '';

  try {
    for await (const message of query({ prompt, options: sdkOptions({ cwd, model, abort }) })) {
      renderer.handleMessage(message);
      if (message && message.type === 'assistant') {
        const blocks = message.message && message.message.content;
        if (Array.isArray(blocks)) {
          for (const b of blocks) {
            if (b && b.type === 'text' && b.text) {
              captured += (captured ? '\n\n' : '') + b.text;
            }
          }
        }
      }
    }
    return { ok: true, body: captured };
  } catch (err) {
    if (err && (err.name === 'AbortError' || abort.signal.aborted)) {
      return { cancelled: true };
    }
    return { ok: false, error: err.message || String(err) };
  } finally {
    process.off('SIGINT', onSigint);
  }
}

module.exports = { generatePlan, DEFAULT_MODEL };
