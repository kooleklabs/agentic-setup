const { parseArgs } = require('../github-sync-cli.js');

describe('parseArgs', () => {
  test('defaults when only --issue provided (base is auto-detected downstream)', () => {
    expect(parseArgs(['--issue', '42'])).toEqual({
      issueNumber: 42,
      dryRun: false,
      force: false,
      noComment: false,
      draft: true,
      yes: false,
      execute: false,
      maxCostUsd: 5.00,
      openPr: false,
      help: false,
    });
  });

  test('--open-pr sets openPr true', () => {
    expect(parseArgs(['--issue', '1', '--open-pr']).openPr).toBe(true);
  });

  test('--execute sets execute true', () => {
    expect(parseArgs(['--issue', '1', '--execute']).execute).toBe(true);
  });

  test('--impl-branch captures the next argument', () => {
    expect(parseArgs(['--issue', '1', '--impl-branch', 'feat-foo']).implBranch).toBe('feat-foo');
  });

  test('--max-cost-usd parses number', () => {
    expect(parseArgs(['--issue', '1', '--max-cost-usd', '10']).maxCostUsd).toBe(10);
  });

  test('--max-cost-usd rejects zero or negative', () => {
    expect(() => parseArgs(['--issue', '1', '--max-cost-usd', '0'])).toThrow(/positive/);
    expect(() => parseArgs(['--issue', '1', '--max-cost-usd', '-5'])).toThrow(/positive/);
  });

  test('--dry-run sets dryRun true', () => {
    expect(parseArgs(['--issue', '1', '--dry-run']).dryRun).toBe(true);
  });

  test('--force sets force true', () => {
    expect(parseArgs(['--issue', '1', '--force']).force).toBe(true);
  });

  test('--no-comment sets noComment true', () => {
    expect(parseArgs(['--issue', '1', '--no-comment']).noComment).toBe(true);
  });

  test('--model captures the next argument', () => {
    expect(parseArgs(['--issue', '1', '--model', 'claude-opus-4-7']).model)
      .toBe('claude-opus-4-7');
  });

  test('--base captures the next argument', () => {
    expect(parseArgs(['--issue', '1', '--base', 'develop']).base).toBe('develop');
  });

  test('--ready flips draft to false', () => {
    expect(parseArgs(['--issue', '1', '--ready']).draft).toBe(false);
  });

  test('--yes sets yes true', () => {
    expect(parseArgs(['--issue', '1', '--yes']).yes).toBe(true);
  });

  test('-y is an alias for --yes', () => {
    expect(parseArgs(['--issue', '1', '-y']).yes).toBe(true);
  });

  test('--help short-circuits — returns help: true without requiring --issue', () => {
    expect(parseArgs(['--help']).help).toBe(true);
    expect(parseArgs(['-h']).help).toBe(true);
  });

  test('--issue missing throws a clear error', () => {
    expect(() => parseArgs([])).toThrow(/--issue.*required/i);
  });

  test('--issue with non-numeric value throws', () => {
    expect(() => parseArgs(['--issue', 'abc'])).toThrow(/--issue/);
  });

  test('unknown flag throws', () => {
    expect(() => parseArgs(['--issue', '1', '--nope'])).toThrow(/Unknown argument/);
  });
});
