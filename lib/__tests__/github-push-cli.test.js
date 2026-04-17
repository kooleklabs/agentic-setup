const { parseArgs } = require('../github-push-cli.js');

describe('parseArgs', () => {
  test('defaults when no args', () => {
    expect(parseArgs([])).toEqual({
      dryRun: false,
      force: false,
      noUmbrella: false,
      help: false,
    });
  });

  test('--dry-run sets dryRun true', () => {
    expect(parseArgs(['--dry-run']).dryRun).toBe(true);
  });

  test('--force sets force true', () => {
    expect(parseArgs(['--force']).force).toBe(true);
  });

  test('--no-umbrella sets noUmbrella true', () => {
    expect(parseArgs(['--no-umbrella']).noUmbrella).toBe(true);
  });

  test('--milestone "v0.1" captures the next argument', () => {
    expect(parseArgs(['--milestone', 'v0.1']).milestoneTitle).toBe('v0.1');
  });

  test('--help and -h both set help true', () => {
    expect(parseArgs(['--help']).help).toBe(true);
    expect(parseArgs(['-h']).help).toBe(true);
  });

  test('unknown argument throws', () => {
    expect(() => parseArgs(['--nope'])).toThrow(/Unknown argument/);
  });
});
