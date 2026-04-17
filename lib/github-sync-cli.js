const HELP = `
Usage: agentic-app github-sync --issue <N> [options]

Read a feature Issue created by \`push-architecture\`, generate an implementation
plan via Claude, and open a draft PR with \`docs/plans/<slug>.md\` for review.

Required:
  --issue <N>          Issue number to sync

Options:
  --dry-run            Print extracted context + prompt, skip the SDK call
  --force              Re-generate even if docs/plans/<slug>.md already exists
  --no-comment         Skip the "Plan PR: #<M>" comment on the Issue
  --model <name>       Override model (default: claude-sonnet-4-6)
  --base <branch>      Base branch for the PR (default: auto-detect repo default)
  --ready              Open as ready-for-review (default: draft)
  --yes, -y            Skip the interactive approval prompt (for CI / scripts)
  --help, -h           Show this help

Requires: gh CLI (https://cli.github.com) authenticated and Claude credentials.
`;

function parseArgs(argv) {
  const opts = {
    dryRun: false,
    force: false,
    noComment: false,
    draft: true,
    yes: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      opts.help = true;
    } else if (a === '--issue') {
      i += 1;
      if (i >= argv.length) throw new Error('--issue requires a numeric value');
      const n = Number(argv[i]);
      if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
        throw new Error(`--issue must be a positive integer; got: ${argv[i]}`);
      }
      opts.issueNumber = n;
    } else if (a === '--dry-run') {
      opts.dryRun = true;
    } else if (a === '--force') {
      opts.force = true;
    } else if (a === '--no-comment') {
      opts.noComment = true;
    } else if (a === '--ready') {
      opts.draft = false;
    } else if (a === '--yes' || a === '-y') {
      opts.yes = true;
    } else if (a === '--model') {
      i += 1;
      if (i >= argv.length) throw new Error('--model requires a value');
      opts.model = argv[i];
    } else if (a === '--base') {
      i += 1;
      if (i >= argv.length) throw new Error('--base requires a value');
      opts.base = argv[i];
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  if (!opts.help && opts.issueNumber === undefined) {
    throw new Error('--issue <N> is required');
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
  const { runGithubSync } = require('./github-sync.js');
  const result = await runGithubSync({
    cwd: process.cwd(),
    issueNumber: opts.issueNumber,
    dryRun: opts.dryRun,
    force: opts.force,
    noComment: opts.noComment,
    base: opts.base,
    model: opts.model,
    draft: opts.draft,
    autoApprove: opts.yes ? true : undefined,
  });
  if (!result.ok) {
    if (result.cancelled) return 1;
    if (result.error) console.error(`github-sync failed: ${result.error}`);
    return 1;
  }
  return 0;
}

module.exports = { main, parseArgs, HELP };
