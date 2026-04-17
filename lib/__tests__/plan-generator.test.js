jest.mock('@anthropic-ai/claude-agent-sdk', () => ({ query: jest.fn() }));

const sdk = require('@anthropic-ai/claude-agent-sdk');
const { generatePlan } = require('../plan-generator.js');

function fakeStream(messages) {
  return (async function * () {
    for (const m of messages) yield m;
  })();
}

function textMessage(text) {
  return { type: 'assistant', message: { content: [{ type: 'text', text }] } };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('generatePlan', () => {
  test('returns {ok: true, body} with captured assistant text', async () => {
    sdk.query.mockImplementationOnce(() => fakeStream([
      textMessage('## Problem statement\nfoo\n'),
      { type: 'result', subtype: 'success', duration_ms: 1 },
    ]));
    const r = await generatePlan({ systemPrompt: 'sys', userPrompt: 'user', cwd: '/tmp' });
    expect(r.ok).toBe(true);
    expect(r.body).toContain('## Problem statement');
  });

  test('concatenates multiple assistant text blocks', async () => {
    sdk.query.mockImplementationOnce(() => fakeStream([
      textMessage('part one'),
      textMessage('part two'),
      { type: 'result', subtype: 'success', duration_ms: 1 },
    ]));
    const r = await generatePlan({ systemPrompt: 'sys', userPrompt: 'user' });
    expect(r.body).toContain('part one');
    expect(r.body).toContain('part two');
  });

  test('surfaces SDK errors as {ok: false, error}', async () => {
    sdk.query.mockImplementationOnce(() => (async function * () {
      throw new Error('rate limited');
    })());
    const r = await generatePlan({ systemPrompt: 'sys', userPrompt: 'user' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/rate limited/);
  });

  test('passes the model option through to query()', async () => {
    sdk.query.mockImplementationOnce(() => fakeStream([
      textMessage('out'),
      { type: 'result', subtype: 'success', duration_ms: 1 },
    ]));
    await generatePlan({ systemPrompt: 'sys', userPrompt: 'user', model: 'claude-opus-4-7' });
    const [call] = sdk.query.mock.calls;
    expect(call[0].options.model).toBe('claude-opus-4-7');
  });

  test('combined prompt includes both system and user content', async () => {
    sdk.query.mockImplementationOnce(() => fakeStream([
      textMessage('out'),
      { type: 'result', subtype: 'success', duration_ms: 1 },
    ]));
    await generatePlan({ systemPrompt: 'SYS_TAG', userPrompt: 'USR_TAG' });
    const [{ prompt }] = sdk.query.mock.calls[0];
    expect(prompt).toContain('SYS_TAG');
    expect(prompt).toContain('USR_TAG');
  });

  test('no tool preset and no permission bypass — planner runs tool-free', async () => {
    sdk.query.mockImplementationOnce(() => fakeStream([
      textMessage('out'),
      { type: 'result', subtype: 'success', duration_ms: 1 },
    ]));
    await generatePlan({ systemPrompt: 'sys', userPrompt: 'user' });
    const [call] = sdk.query.mock.calls;
    expect(call[0].options.tools).toBeUndefined();
    expect(call[0].options.systemPrompt).toBeUndefined();
    expect(call[0].options.permissionMode).toBeUndefined();
  });

  test('canUseTool denies every request (backstop if a tool is ever exposed)', async () => {
    sdk.query.mockImplementationOnce(() => fakeStream([
      textMessage('out'),
      { type: 'result', subtype: 'success', duration_ms: 1 },
    ]));
    await generatePlan({ systemPrompt: 'sys', userPrompt: 'user' });
    const [call] = sdk.query.mock.calls;
    const decision = await call[0].options.canUseTool('Bash', { command: 'ls' });
    expect(decision.behavior).toBe('deny');
  });
});
