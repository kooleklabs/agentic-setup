const { runGithubPush } = require('./github-push.js');

const HELP = `
Usage: agentic-app push-architecture [options]

Create GitHub Issues and a milestone from docs/architecture.md.
Re-runs are idempotent — features with an existing marker comment are skipped.

Options:
  --dry-run            Show the plan without creating anything
  --force              Ignore existing markers and create everything fresh
  --no-umbrella        Skip the top-level umbrella Issue
  --milestone <name>   Override milestone title (default: "<Project> v1.0")
  --help, -h           Show this help

Requires: gh CLI (https://cli.github.com) authenticated via \`gh auth login\`.
`;

function parseArgs(argv) {
  const opts = { dryRun: false, force: false, noUmbrella: false, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      opts.help = true;
    } else if (a === '--dry-run') {
      opts.dryRun = true;
    } else if (a === '--force') {
      opts.force = true;
    } else if (a === '--no-umbrella') {
      opts.noUmbrella = true;
    } else if (a === '--milestone') {
      i += 1;
      if (i >= argv.length) throw new Error('--milestone requires a value');
      opts.milestoneTitle = argv[i];
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  return opts;
}

async function main(argv) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    console.error(err.message);
    console.error(HELP.trim());
    return 1;
  }
  if (opts.help) {
    console.log(HELP.trim());
    return 0;
  }
  const result = await runGithubPush({
    cwd: process.cwd(),
    dryRun: opts.dryRun,
    force: opts.force,
    noUmbrella: opts.noUmbrella,
    milestoneTitle: opts.milestoneTitle,
  });
  if (!result.ok) {
    if (result.cancelled) return 1;
    if (result.error) console.error(`push-architecture failed: ${result.error}`);
    return 1;
  }
  return 0;
}

module.exports = { main, parseArgs, HELP };
