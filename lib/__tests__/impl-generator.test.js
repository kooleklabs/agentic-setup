jest.mock('@anthropic-ai/claude-agent-sdk', () => ({ query: jest.fn() }));

const sdk = require('@anthropic-ai/claude-agent-sdk');
const { runImplementation } = require('../impl-generator.js');

function fakeStream(messages) {
  return (async function * () {
    for (const m of messages) yield m;
  })();
}

function textMsg(text, usage) {
  return {
    type: 'assistant',
    message: {
      content: [{ type: 'text', text }],
      usage: usage || { input_tokens: 100, output_tokens: 50 },
    },
  };
}

function toolUseMsg(name, input, usage) {
  return {
    type: 'assistant',
    message: {
      content: [{ type: 'tool_use', name, input }],
      usage: usage || { input_tokens: 100, output_tokens: 50 },
    },
  };
}

const baseInput = {
  planBody: '## Files to change\n- `foo.js`\n\n## Implementation steps\n1. Write foo.js',
  issue: { number: 42, title: 'Browse books', markerSlug: 'browse-books' },
  architectureSection: '### Feature: Browse books\n- Given ...',
  apiSpecYaml: 'openapi: 3.0.0\npaths: {}',
  cwd: '/tmp/repo',
  maxCostUsd: 5.00,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('runImplementation', () => {
  test('happy path: captures text, files written via Write, bash commands', async () => {
    sdk.query.mockImplementationOnce(() => fakeStream([
      toolUseMsg('Write', { file_path: 'src/foo.js', content: 'x' }),
      toolUseMsg('Edit', { file_path: 'src/bar.js' }),
      toolUseMsg('Bash', { command: 'npm test' }),
      textMsg('Done — wrote 2 files.'),
      { type: 'result', subtype: 'success', duration_ms: 1, total_cost_usd: 0.42 },
    ]));
    const r = await runImplementation(baseInput);
    expect(r.ok).toBe(true);
    expect(r.body).toContain('Done');
    expect(r.filesWritten).toEqual(expect.arrayContaining(['src/foo.js', 'src/bar.js']));
    expect(r.commandsRun).toEqual(expect.arrayContaining(['npm test']));
    expect(r.costUsd).toBeCloseTo(0.42, 2);
  });

  test('SDK error returns {ok: false, error}', async () => {
    sdk.query.mockImplementationOnce(() => (async function * () {
      throw new Error('sdk boom');
    })());
    const r = await runImplementation(baseInput);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/sdk boom/);
  });

  test('maxCostUsd is passed to SDK options as maxBudgetUsd for built-in enforcement', async () => {
    sdk.query.mockImplementationOnce(() => fakeStream([
      textMsg('ok'),
      { type: 'result', subtype: 'success', duration_ms: 1, total_cost_usd: 0.01 },
    ]));
    await runImplementation({ ...baseInput, maxCostUsd: 2.50 });
    const [call] = sdk.query.mock.calls;
    expect(call[0].options.maxBudgetUsd).toBe(2.50);
  });

  test('costUsd comes from the SDK result message, not local estimation', async () => {
    sdk.query.mockImplementationOnce(() => fakeStream([
      textMsg('ok', { input_tokens: 99999, output_tokens: 99999 }), // should NOT inflate costUsd
      { type: 'result', subtype: 'success', duration_ms: 1, total_cost_usd: 0.07 },
    ]));
    const r = await runImplementation(baseInput);
    expect(r.costUsd).toBeCloseTo(0.07, 2);
  });

  test('prompt embeds plan body and issue context', async () => {
    sdk.query.mockImplementationOnce(() => fakeStream([
      textMsg('ok'),
      { type: 'result', subtype: 'success', duration_ms: 1 },
    ]));
    await runImplementation(baseInput);
    const [{ prompt }] = sdk.query.mock.calls[0];
    expect(prompt).toContain('Browse books');
    expect(prompt).toContain('## Files to change');
    expect(prompt).toContain('foo.js');
    expect(prompt).toContain('#42');
  });

  test('model option passed through to query()', async () => {
    sdk.query.mockImplementationOnce(() => fakeStream([
      textMsg('ok'),
      { type: 'result', subtype: 'success', duration_ms: 1 },
    ]));
    await runImplementation({ ...baseInput, model: 'claude-opus-4-7' });
    const [call] = sdk.query.mock.calls;
    expect(call[0].options.model).toBe('claude-opus-4-7');
  });

  test('uses Claude Code tools preset (agent NEEDS tools, unlike the planner)', async () => {
    sdk.query.mockImplementationOnce(() => fakeStream([
      textMsg('ok'),
      { type: 'result', subtype: 'success', duration_ms: 1 },
    ]));
    await runImplementation(baseInput);
    const [call] = sdk.query.mock.calls;
    expect(call[0].options.tools).toEqual({ type: 'preset', preset: 'claude_code' });
  });
});
