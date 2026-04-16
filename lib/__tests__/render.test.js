const { ProgressRenderer } = require('../render.js');

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('ProgressRenderer.handleMessage', () => {
  test('increments write count on Write tool use', () => {
    const r = new ProgressRenderer();
    r.handleMessage({
      type: 'assistant',
      message: {
        content: [{ type: 'tool_use', name: 'Write', input: { file_path: '/x/a.md' } }],
      },
    });
    expect(r.counts.write).toBe(1);
  });

  test('increments edit count on Edit and MultiEdit', () => {
    const r = new ProgressRenderer();
    r.handleMessage({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Edit', input: { file_path: '/x/a.md' } }] },
    });
    r.handleMessage({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'MultiEdit', input: { file_path: '/x/b.md' } }] },
    });
    expect(r.counts.edit).toBe(2);
  });

  test('increments bash count on Bash tool use', () => {
    const r = new ProgressRenderer();
    r.handleMessage({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'ls' } }] },
    });
    expect(r.counts.bash).toBe(1);
  });

  test('increments other for unknown tool', () => {
    const r = new ProgressRenderer();
    r.handleMessage({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Magic', input: {} }] },
    });
    expect(r.counts.other).toBe(1);
  });

  test('TodoWrite is suppressed (no counter)', () => {
    const r = new ProgressRenderer();
    r.handleMessage({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'TodoWrite', input: {} }] },
    });
    expect(r.counts.other).toBe(0);
  });

  test('tracks token usage across assistant messages', () => {
    const r = new ProgressRenderer();
    r.handleMessage({
      type: 'assistant',
      message: {
        model: 'claude-sonnet-4-6',
        content: [],
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          cache_creation_input_tokens: 10,
          cache_read_input_tokens: 20,
        },
      },
    });
    expect(r.usage.input).toBe(100);
    expect(r.usage.output).toBe(50);
    expect(r.usage.cache_write).toBe(10);
    expect(r.usage.cache_read).toBe(20);
    expect(r.usage.model).toBe('claude-sonnet-4-6');
  });

  test('ignores malformed messages silently', () => {
    const r = new ProgressRenderer();
    expect(() => r.handleMessage(null)).not.toThrow();
    expect(() => r.handleMessage({})).not.toThrow();
    expect(() => r.handleMessage({ type: 'user' })).not.toThrow();
  });
});

describe('ProgressRenderer.computeCost', () => {
  test('uses sonnet pricing by default', () => {
    const r = new ProgressRenderer();
    r.usage = { input: 1_000_000, output: 0, cache_write: 0, cache_read: 0, model: null };
    const { cost, prices } = r.computeCost();
    expect(prices.input).toBe(3);
    expect(cost).toBeCloseTo(3);
  });

  test('uses opus pricing when model matches', () => {
    const r = new ProgressRenderer();
    r.usage = { input: 1_000_000, output: 0, cache_write: 0, cache_read: 0, model: 'claude-opus-4-6' };
    const { cost } = r.computeCost();
    expect(cost).toBeCloseTo(15);
  });

  test('uses haiku pricing when model matches', () => {
    const r = new ProgressRenderer();
    r.usage = { input: 1_000_000, output: 0, cache_write: 0, cache_read: 0, model: 'claude-haiku-4-5' };
    const { cost } = r.computeCost();
    expect(cost).toBeCloseTo(0.8);
  });

  test('env overrides win over model lookup', () => {
    process.env.CLAUDE_PRICE_INPUT = '10';
    process.env.CLAUDE_PRICE_OUTPUT = '50';
    const r = new ProgressRenderer();
    r.usage = { input: 1_000_000, output: 0, cache_write: 0, cache_read: 0, model: 'claude-opus-4-6' };
    const { cost } = r.computeCost();
    expect(cost).toBeCloseTo(10);
    delete process.env.CLAUDE_PRICE_INPUT;
    delete process.env.CLAUDE_PRICE_OUTPUT;
  });
});

describe('ProgressRenderer formatters', () => {
  test('formatTokens: K for thousands, M for millions', () => {
    const r = new ProgressRenderer();
    expect(r.formatTokens(500)).toBe('500');
    expect(r.formatTokens(1500)).toBe('1.5K');
    expect(r.formatTokens(2_500_000)).toBe('2.50M');
  });

  test('formatUsd: <$0.01 for tiny amounts, 3dp under $1, 2dp above', () => {
    const r = new ProgressRenderer();
    expect(r.formatUsd(0.005)).toBe('<$0.01');
    expect(r.formatUsd(0.123)).toBe('$0.123');
    expect(r.formatUsd(1.5)).toBe('$1.50');
  });

  test('rel: strips cwd prefix', () => {
    const r = new ProgressRenderer();
    r.cwd = '/tmp/project';
    expect(r.rel('/tmp/project/src/index.js')).toBe('src/index.js');
    expect(r.rel('/tmp/project')).toBe('.');
    expect(r.rel('/other/path')).toBe('/other/path');
  });
});
