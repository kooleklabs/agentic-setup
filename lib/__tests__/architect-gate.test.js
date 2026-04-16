jest.mock('@anthropic-ai/claude-agent-sdk', () => ({ query: jest.fn() }));

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const sdk = require('@anthropic-ai/claude-agent-sdk');
const { runArchitectureGate } = require('../architect-gate.js');

function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gate-'));
}
function fakeStream(messages) {
  return (async function * () {
    for (const m of messages) yield m;
  })();
}
const VALID_ARCH_MD = '## Backend\n\n## Frontend\n\n## Integration\n\n## Acceptance Criteria\n';
const VALID_API = 'openapi: 3.0.3\ninfo: {title: x, version: 1}\npaths:\n  /x:\n    get: {responses: {"200": {description: ok}}}\n';

describe('runArchitectureGate — skip conditions', () => {
  let tmp;
  beforeEach(() => { tmp = mkTmp(); jest.clearAllMocks(); jest.spyOn(console, 'log').mockImplementation(() => {}); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); jest.restoreAllMocks(); });

  test('skip=true returns {skipped: true} without calling SDK', async () => {
    const r = await runArchitectureGate({ requirement: 'x', cwd: tmp, skip: true });
    expect(r).toEqual({ skipped: true, reason: 'flag' });
    expect(sdk.query).not.toHaveBeenCalled();
  });

  test('existing docs/architecture.md triggers skip', async () => {
    fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'docs/architecture.md'), 'existing');
    const r = await runArchitectureGate({ requirement: 'x', cwd: tmp });
    expect(r.skipped).toBe(true);
    expect(r.reason).toMatch(/exists/);
    expect(sdk.query).not.toHaveBeenCalled();
  });

  test('fromAnalysis=true triggers skip', async () => {
    const r = await runArchitectureGate({ requirement: 'x', cwd: tmp, fromAnalysis: true });
    expect(r.skipped).toBe(true);
    expect(sdk.query).not.toHaveBeenCalled();
  });
});

describe('runArchitectureGate — success path', () => {
  let tmp;
  beforeEach(() => { tmp = mkTmp(); jest.clearAllMocks(); jest.spyOn(console, 'log').mockImplementation(() => {}); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); jest.restoreAllMocks(); });

  test('calls SDK once, validates, returns ok', async () => {
    sdk.query.mockImplementationOnce(() => {
      fs.mkdirSync(path.join(tmp, 'docs/decisions'), { recursive: true });
      fs.mkdirSync(path.join(tmp, 'contracts'), { recursive: true });
      fs.writeFileSync(path.join(tmp, 'docs/architecture.md'), VALID_ARCH_MD);
      fs.writeFileSync(path.join(tmp, 'contracts/api-spec.yaml'), VALID_API);
      fs.writeFileSync(path.join(tmp, 'docs/decisions/001-x.md'), '# x');
      return fakeStream([{ type: 'result', subtype: 'success', duration_ms: 1 }]);
    });

    const r = await runArchitectureGate({ requirement: 'inventory app', cwd: tmp });
    expect(r.ok).toBe(true);
    expect(sdk.query).toHaveBeenCalledTimes(1);
  });
});

describe('runArchitectureGate — retry and failure', () => {
  let tmp;
  beforeEach(() => { tmp = mkTmp(); jest.clearAllMocks(); jest.spyOn(console, 'log').mockImplementation(() => {}); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); jest.restoreAllMocks(); });

  test('first attempt incomplete → retry → success', async () => {
    sdk.query
      .mockImplementationOnce(() => {
        fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
        fs.writeFileSync(path.join(tmp, 'docs/architecture.md'), VALID_ARCH_MD);
        return fakeStream([{ type: 'result', subtype: 'success', duration_ms: 1 }]);
      })
      .mockImplementationOnce(() => {
        fs.mkdirSync(path.join(tmp, 'docs/decisions'), { recursive: true });
        fs.mkdirSync(path.join(tmp, 'contracts'), { recursive: true });
        fs.writeFileSync(path.join(tmp, 'contracts/api-spec.yaml'), VALID_API);
        fs.writeFileSync(path.join(tmp, 'docs/decisions/001-x.md'), '#');
        return fakeStream([{ type: 'result', subtype: 'success', duration_ms: 1 }]);
      });

    const r = await runArchitectureGate({ requirement: 'x', cwd: tmp });
    expect(r.ok).toBe(true);
    expect(r.retried).toBe(true);
    expect(sdk.query).toHaveBeenCalledTimes(2);
  });

  test('both attempts incomplete → returns {ok: false, missing}', async () => {
    sdk.query.mockImplementation(() => fakeStream([{ type: 'result', subtype: 'success', duration_ms: 1 }]));
    const r = await runArchitectureGate({ requirement: 'x', cwd: tmp });
    expect(r.ok).toBe(false);
    expect(r.missing.length).toBeGreaterThan(0);
    expect(sdk.query).toHaveBeenCalledTimes(2);
  });

  test('SDK error returns {ok: false, error}', async () => {
    sdk.query.mockImplementationOnce(() => { throw new Error('network'); });
    const r = await runArchitectureGate({ requirement: 'x', cwd: tmp });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/network/);
  });

  test('SIGINT abort returns {cancelled: true}', async () => {
    sdk.query.mockImplementationOnce(() => {
      const e = new Error('aborted'); e.name = 'AbortError';
      throw e;
    });
    const r = await runArchitectureGate({ requirement: 'x', cwd: tmp });
    expect(r.cancelled).toBe(true);
  });
});
