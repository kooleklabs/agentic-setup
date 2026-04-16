jest.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: jest.fn(),
}));

const { parseArgs } = require('../claude-runner.js');

describe('claude-runner.parseArgs', () => {
  test('returns defaults when no args', () => {
    const out = parseArgs([]);
    expect(out).toEqual({ model: 'claude-sonnet-4-6' });
  });
  test('parses --prompt-file', () => {
    expect(parseArgs(['--prompt-file', 'p.md']).promptFile).toBe('p.md');
  });
  test('parses --capture-to', () => {
    expect(parseArgs(['--capture-to', 'out.md']).captureTo).toBe('out.md');
  });
  test('parses --title', () => {
    expect(parseArgs(['--title', 'Phase 1']).title).toBe('Phase 1');
  });
  test('parses --model override', () => {
    expect(parseArgs(['--model', 'claude-opus-4-6']).model).toBe('claude-opus-4-6');
  });
  test('parses --help and -h', () => {
    expect(parseArgs(['--help']).help).toBe(true);
    expect(parseArgs(['-h']).help).toBe(true);
  });
  test('ignores unknown flags gracefully', () => {
    const out = parseArgs(['--bogus', 'x']);
    expect(out.model).toBe('claude-sonnet-4-6');
  });
});

const sdk = require('@anthropic-ai/claude-agent-sdk');
const fs = require('node:fs');
const { run } = require('../claude-runner.js');

function fakeStream(messages) {
  return (async function* () {
    for (const m of messages) yield m;
  })();
}

describe('claude-runner.run', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  test('captures assistant text and writes to captureTo file', async () => {
    const messages = [
      {
        type: 'assistant',
        message: { content: [{ type: 'text', text: 'hello world' }] },
      },
      { type: 'result', subtype: 'success', duration_ms: 1000 },
    ];
    sdk.query.mockReturnValueOnce(fakeStream(messages));
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    const code = await run({ prompt: 'hi', captureTo: '/tmp/out.md' });

    expect(code).toBe(0);
    expect(writeSpy).toHaveBeenCalledWith('/tmp/out.md', 'hello world');
  });

  test('returns 130 when aborted', async () => {
    sdk.query.mockImplementationOnce(() => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      throw err;
    });
    const code = await run({ prompt: 'hi' });
    expect(code).toBe(130);
  });

  test('returns 1 on unexpected SDK error', async () => {
    sdk.query.mockImplementationOnce(() => {
      throw new Error('network down');
    });
    const code = await run({ prompt: 'hi' });
    expect(code).toBe(1);
  });
});
