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
  // No systemPrompt preset, no tools preset, no permission bypass:
  // the planner runs with an empty tool surface so the model can only
  // produce text. Everything it needs is in the prompt already.
  return {
    cwd: cwd || process.cwd(),
    model,
    env: { ...process.env, ENABLE_SECURITY_REMINDER: '0' },
    plugins: [],
    abortController: abort,
    canUseTool: async () => ({ behavior: 'deny', message: 'planner runs in no-tool mode' }),
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
