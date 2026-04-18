const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');

jest.mock('node:child_process');

const { runSelfReview } = require('../self-review.js');

function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'self-review-'));
}
function writePkg(tmp, scripts) {
  fs.writeFileSync(
    path.join(tmp, 'package.json'),
    JSON.stringify({ name: 'x', version: '0.0.0', scripts }, null, 2)
  );
}

let tmp;
beforeEach(() => {
  jest.clearAllMocks();
  tmp = mkTmp();
});
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('runSelfReview', () => {
  test('runs both test and lint when package.json defines them; all pass', () => {
    writePkg(tmp, { test: 'jest', lint: 'eslint .' });
    cp.spawnSync
      .mockReturnValueOnce({ status: 0, stdout: 'tests pass', stderr: '' })
      .mockReturnValueOnce({ status: 0, stdout: 'lint clean', stderr: '' });
    const r = runSelfReview({ cwd: tmp });
    expect(r.checks).toHaveLength(2);
    expect(r.checks.every((c) => c.status === 'pass')).toBe(true);
    expect(r.checks[0].name).toBe('test');
    expect(r.checks[1].name).toBe('lint');
  });

  test('records failure with exit code when a script fails', () => {
    writePkg(tmp, { test: 'jest' });
    cp.spawnSync.mockReturnValueOnce({ status: 1, stdout: '', stderr: 'FAIL' });
    const r = runSelfReview({ cwd: tmp });
    expect(r.checks).toHaveLength(1);
    expect(r.checks[0].status).toBe('fail');
    expect(r.checks[0].exitCode).toBe(1);
  });

  test('skips missing scripts without marking them failed', () => {
    writePkg(tmp, { test: 'jest' }); // no lint script
    cp.spawnSync.mockReturnValueOnce({ status: 0, stdout: '', stderr: '' });
    const r = runSelfReview({ cwd: tmp });
    expect(r.checks).toHaveLength(1);
    expect(r.checks.map((c) => c.name)).not.toContain('lint');
  });

  test('no package.json returns empty checks without throwing', () => {
    const r = runSelfReview({ cwd: tmp });
    expect(r.checks).toEqual([]);
  });

  test('hasFailures helper reflects at least one failing check', () => {
    writePkg(tmp, { test: 'jest', lint: 'eslint' });
    cp.spawnSync
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' })
      .mockReturnValueOnce({ status: 2, stdout: '', stderr: 'boom' });
    const r = runSelfReview({ cwd: tmp });
    expect(r.hasFailures).toBe(true);
  });

  test('uses npm as the runner for scripts (stable across systems)', () => {
    writePkg(tmp, { test: 'jest' });
    cp.spawnSync.mockReturnValueOnce({ status: 0, stdout: '', stderr: '' });
    runSelfReview({ cwd: tmp });
    const [cmd, args] = cp.spawnSync.mock.calls[0];
    expect(cmd).toBe('npm');
    expect(args).toContain('test');
  });
});
