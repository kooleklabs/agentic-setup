jest.mock('@anthropic-ai/claude-agent-sdk', () => ({ query: jest.fn() }));

const { parseArgs, detectQuestion } = require('../generate.js');

describe('generate.parseArgs', () => {
  test('defaults to interactive mode and both target', () => {
    expect(parseArgs([])).toMatchObject({
      mode: 'interactive',
      interactive: false,
      model: 'claude-sonnet-4-6',
      target: 'both',
    });
  });
  test('--from switches to file mode', () => {
    expect(parseArgs(['--from', 'spec.md'])).toMatchObject({
      mode: 'file', file: 'spec.md',
    });
  });
  test('--idea switches to idea mode', () => {
    expect(parseArgs(['--idea', 'todo app'])).toMatchObject({
      mode: 'idea', idea: 'todo app',
    });
  });
  test('-i enables interactive', () => {
    expect(parseArgs(['-i']).interactive).toBe(true);
  });
  test('--interactive enables interactive', () => {
    expect(parseArgs(['--interactive']).interactive).toBe(true);
  });
  test('--model overrides default', () => {
    expect(parseArgs(['--model', 'claude-opus-4-6']).model).toBe('claude-opus-4-6');
  });
  test.each(['claude', 'copilot', 'both'])('accepts --target %s', (t) => {
    expect(parseArgs(['--target', t]).target).toBe(t);
  });
  test('--target normalises case', () => {
    expect(parseArgs(['--target', 'CLAUDE']).target).toBe('claude');
  });
  test('invalid --target exits with error', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => { throw new Error(`exit ${code}`); });
    const errSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    expect(() => parseArgs(['--target', 'bogus'])).toThrow('exit 1');
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid --target'));
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });
  test('--skip-architecture sets skipArchitecture=true', () => {
    expect(parseArgs(['--skip-architecture']).skipArchitecture).toBe(true);
  });
  test('skipArchitecture defaults to false', () => {
    expect(parseArgs([]).skipArchitecture).toBe(false);
  });
  test('--from-analysis sets fromAnalysis=true (migration path)', () => {
    expect(parseArgs(['--from-analysis']).fromAnalysis).toBe(true);
  });
});

describe('generate.detectQuestion', () => {
  test('returns null for empty input', () => {
    expect(detectQuestion('')).toBeNull();
    expect(detectQuestion(null)).toBeNull();
    expect(detectQuestion('   ')).toBeNull();
  });
  test('returns trimmed text when ending with ?', () => {
    expect(detectQuestion('Should I use Postgres?')).toBe('Should I use Postgres?');
    expect(detectQuestion('Which stack?\n\n')).toBe('Which stack?');
  });
  test('returns text when matching clarification phrases', () => {
    expect(detectQuestion('Please confirm the region.')).toMatch(/Please confirm/);
    expect(detectQuestion('Which option do you prefer')).toMatch(/Which option/);
    expect(detectQuestion('Let me know when ready')).toMatch(/Let me know/);
  });
  test('returns null for plain statements', () => {
    expect(detectQuestion('Here is the design.')).toBeNull();
    expect(detectQuestion('Done.')).toBeNull();
  });
});

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('generate.ensureHooksExecutable', () => {
  const { ensureHooksExecutable } = require('../generate.js');

  test('sets +x on all .sh files in .claude/hooks', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hooks-'));
    const hooksDir = path.join(tmp, '.claude', 'hooks');
    fs.mkdirSync(hooksDir, { recursive: true });
    const a = path.join(hooksDir, 'pre-commit.sh');
    const b = path.join(hooksDir, 'post-edit.sh');
    fs.writeFileSync(a, '#!/bin/bash\n');
    fs.writeFileSync(b, '#!/bin/bash\n');
    fs.chmodSync(a, 0o644);
    fs.chmodSync(b, 0o644);

    ensureHooksExecutable(tmp);

    expect(fs.statSync(a).mode & 0o111).not.toBe(0);
    expect(fs.statSync(b).mode & 0o111).not.toBe(0);

    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('no-op when hooks dir missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hooks-'));
    expect(() => ensureHooksExecutable(tmp)).not.toThrow();
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('skips non-.sh files', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hooks-'));
    const hooksDir = path.join(tmp, '.claude', 'hooks');
    fs.mkdirSync(hooksDir, { recursive: true });
    const txt = path.join(hooksDir, 'notes.txt');
    fs.writeFileSync(txt, 'x');
    fs.chmodSync(txt, 0o644);

    ensureHooksExecutable(tmp);

    expect(fs.statSync(txt).mode & 0o111).toBe(0);
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
