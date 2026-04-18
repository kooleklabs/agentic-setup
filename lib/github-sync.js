const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const { checkGhAvailable, commentOnIssue } = require('./github-issues.js');
const { detectGithubRepo } = require('./github-repo.js');
const { detectDefaultBranch } = require('./default-branch.js');
const { fetchFeatureIssue } = require('./github-issue-reader.js');
const { parseArchitecture } = require('./architecture-parser.js');
const { buildPlanPrompt } = require('./plan-prompt.js');
const { generatePlan } = require('./plan-generator.js');
const { renderPlanFile, validatePlanBody } = require('./plan-template.js');
const { openPlanPR, cleanupPlanBranch } = require('./gh-plan-pr.js');
const { readMergedPlan } = require('./plan-reader.js');
const { runImplementation } = require('./impl-generator.js');
const {
  createImplBranch,
  commitImplChanges,
  remoteBranchExists,
  checkImplBranchPreflight,
} = require('./gh-impl-branch.js');
const { openImplPR } = require('./gh-impl-pr.js');
const { runSelfReview } = require('./self-review.js');

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_MAX_COST_USD = 5.00;

async function runGithubSync(opts = {}) {
  const {
    cwd = process.cwd(),
    issueNumber,
    dryRun = false,
    force = false,
    noComment = false,
    base,
    model = DEFAULT_MODEL,
    draft = true,
    execute = false,
    implBranch,
    maxCostUsd = DEFAULT_MAX_COST_USD,
    openPr = false,
    autoApprove,
  } = opts;

  try {
    if (issueNumber === undefined || issueNumber === null) {
      return { ok: false, error: '--issue <N> is required.' };
    }

    checkGhAvailable();
    const { owner, repo } = detectGithubRepo();
    const repoName = `${owner}/${repo}`;
    const baseBranch = base || detectDefaultBranch({ owner, repo });

    const issue = fetchFeatureIssue({ owner, repo, number: issueNumber });

    const parsed = parseArchitecture(cwd);
    const feature = parsed.features.find((f) => f.slug === issue.markerSlug);
    if (!feature) {
      return {
        ok: false,
        error:
          `Issue #${issueNumber} has marker slug "${issue.markerSlug}" but no matching ` +
          '### Feature: entry exists in docs/architecture.md. ' +
          'Did you edit architecture.md without re-running push-architecture?',
      };
    }

    const planRelPath = `docs/plans/${issue.markerSlug}.md`;
    const planAbsPath = path.join(cwd, planRelPath);

    if (execute) {
      return await runExecute({
        cwd,
        owner,
        repo,
        repoName,
        issue,
        feature,
        planRelPath,
        baseBranch,
        implBranchName: implBranch || issue.markerSlug,
        dryRun,
        model,
        maxCostUsd,
        openPr,
        draft,
        noComment,
        autoApprove,
      });
    }

    if (!force && fs.existsSync(planAbsPath)) {
      return {
        ok: false,
        error: `Plan already exists: ${planRelPath}. Pass --force to regenerate, or delete the file first.`,
      };
    }

    const architectureSection = buildFeatureSectionString(feature);
    const apiSpecYaml = loadApiSpec(cwd);
    const adrs = loadAdrBodies(cwd, issue.adrRefs);

    printPlan({ repoName, issueNumber, feature, planRelPath, dryRun });

    const { systemPrompt, userPrompt } = buildPlanPrompt({
      issue,
      architectureSection,
      apiSpecYaml,
      adrs,
      repoName,
    });

    if (dryRun) {
      printDryRun({ systemPrompt, userPrompt });
      return {
        ok: true,
        dryRun: true,
        plan: { path: planRelPath, issueNumber, slug: issue.markerSlug },
      };
    }

    const approved = autoApprove !== undefined
      ? Boolean(autoApprove)
      : await confirmProceed();
    if (!approved) {
      return { ok: false, cancelled: true };
    }

    let gen = await generatePlan({ systemPrompt, userPrompt, model, cwd });
    if (gen.cancelled) return { ok: false, cancelled: true };
    if (!gen.ok) return { ok: false, error: gen.error };

    let valid = validatePlanBody(gen.body);
    let retried = false;
    if (!valid.ok) {
      retried = true;
      const retryUserPrompt = buildRetryPrompt(userPrompt, valid.missing, gen.body);
      gen = await generatePlan({ systemPrompt, userPrompt: retryUserPrompt, model, cwd });
      if (gen.cancelled) return { ok: false, cancelled: true };
      if (!gen.ok) return { ok: false, error: gen.error };
      valid = validatePlanBody(gen.body);
      if (!valid.ok) {
        return {
          ok: false,
          error: `Plan truncated after retry — missing sections: ${valid.missing.join(', ')}`,
        };
      }
    }

    fs.mkdirSync(path.dirname(planAbsPath), { recursive: true });
    const planContent = renderPlanFile({
      issueTitle: issue.title,
      issueNumber,
      repoName,
      model,
      generatedAt: new Date().toISOString().slice(0, 10),
      planBody: gen.body,
    });
    fs.writeFileSync(planAbsPath, planContent);

    if (force) {
      cleanupPlanBranch({ cwd, slug: issue.markerSlug });
    }

    const pr = openPlanPR({
      cwd,
      slug: issue.markerSlug,
      planFilePath: planRelPath,
      planTitle: issue.title,
      issueNumber,
      base: baseBranch,
      draft,
    });

    if (!noComment) {
      commentOnIssue({
        owner,
        repo,
        number: issueNumber,
        body: `Plan PR: #${pr.prNumber}`,
      });
    }

    printBanner({ planRelPath, pr, retried });

    return {
      ok: true,
      plan: {
        path: planRelPath,
        prNumber: pr.prNumber,
        url: pr.url,
        branch: pr.branch,
        retried,
      },
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function runExecute(ctx) {
  // 1. Read the merged plan from disk
  let merged;
  try {
    merged = readMergedPlan({ cwd: ctx.cwd, slug: ctx.issue.markerSlug });
  } catch (err) {
    return { ok: false, error: err.message };
  }
  if (!merged.hasRequiredSections) {
    return {
      ok: false,
      error: `Plan at ${ctx.planRelPath} is missing sections: ${merged.missing.join(', ')}. Edit the file and retry.`,
    };
  }

  // 2. Verify plan PR has been merged — origin should no longer have the plan branch
  const planBranch = `plan/${ctx.issue.markerSlug}`;
  try {
    if (remoteBranchExists({ cwd: ctx.cwd, branch: planBranch })) {
      return {
        ok: false,
        error:
          `Plan PR on branch \`${planBranch}\` still exists on origin. ` +
          'Merge or close it before running `--execute`.',
      };
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }

  // 3. Pre-flight checks (no side effects — actual branch creation deferred
  // until after approval so dry-run and declined prompts don't leave stranded branches)
  let plannedBranch;
  try {
    ({ branch: plannedBranch } = checkImplBranchPreflight({
      cwd: ctx.cwd,
      slug: ctx.implBranchName,
    }));
  } catch (err) {
    return { ok: false, error: err.message };
  }

  const architectureSection = buildFeatureSectionString(ctx.feature);
  const apiSpecYaml = loadApiSpec(ctx.cwd);

  printExecutePlan({ ...ctx, branch: plannedBranch });

  if (ctx.dryRun) {
    console.log('(dry-run — no branch created, no SDK call, no commit. Cost cap would be $' +
      ctx.maxCostUsd.toFixed(2) + ')');
    return {
      ok: true,
      dryRun: true,
      impl: { branch: plannedBranch, slug: ctx.implBranchName },
    };
  }

  // 3. Approval gate
  const approved = ctx.autoApprove !== undefined
    ? Boolean(ctx.autoApprove)
    : await confirmProceed();
  if (!approved) {
    return { ok: false, cancelled: true };
  }

  // 4. Pre-flight + create impl branch (AFTER approval, so dry-run and
  // user cancellation don't leave a stranded branch behind)
  let branchInfo;
  try {
    branchInfo = createImplBranch({
      cwd: ctx.cwd,
      slug: ctx.implBranchName,
      base: ctx.baseBranch,
    });
  } catch (err) {
    return { ok: false, error: err.message };
  }

  // 5. Run implementation
  const impl = await runImplementation({
    planBody: merged.body,
    issue: ctx.issue,
    architectureSection,
    apiSpecYaml,
    repoName: ctx.repoName,
    cwd: ctx.cwd,
    model: ctx.model,
    maxCostUsd: ctx.maxCostUsd,
  });
  if (impl.cancelled) return { ok: false, cancelled: true, impl };
  if (impl.ok === false) return { ok: false, error: impl.error || 'implementation failed', impl };

  // 6. Commit WIP
  const { sha } = commitImplChanges({
    cwd: ctx.cwd,
    slug: ctx.implBranchName,
    issueNumber: ctx.issue.number,
    featureName: ctx.feature.name,
  });

  // 7. Optionally run self-review (tests + lint) + push branch + open a draft PR
  let pr = null;
  let selfReview = null;
  if (ctx.openPr && sha) {
    console.log('Running self-review (tests + lint)...');
    selfReview = runSelfReview({ cwd: ctx.cwd });
    if (selfReview.checks.length > 0) {
      for (const c of selfReview.checks) {
        const icon = c.status === 'pass' ? '✓' : '✗';
        console.log(`  ${icon} ${c.name}: ${c.status} (${c.duration}ms) — \`${c.command}\``);
      }
    } else {
      console.log('  (no package.json scripts detected — skipping self-review)');
    }

    try {
      pr = openImplPR({
        cwd: ctx.cwd,
        branch: branchInfo.branch,
        issueNumber: ctx.issue.number,
        featureName: ctx.feature.name,
        base: ctx.baseBranch,
        draft: ctx.draft,
        impl,
        commitSha: sha,
        selfReview,
      });
    } catch (err) {
      // Push or PR creation failed. The commit is still on the local branch;
      // user can retry manually or re-run with --force.
      return {
        ok: false,
        error: `WIP commit made on ${branchInfo.branch}, but auto-PR failed: ${err.message}`,
        impl: {
          branch: branchInfo.branch,
          sha,
          filesWritten: impl.filesWritten,
          commandsRun: impl.commandsRun,
          costUsd: impl.costUsd,
        },
      };
    }
  }

  // 8. Comment on Issue (unless opted out)
  if (!ctx.noComment) {
    let commentBody;
    if (!sha) {
      commentBody = `Implementation pass against \`${branchInfo.branch}\` produced no file changes — nothing to commit. Inspect the prompt / model output before re-running.`;
    } else if (pr) {
      commentBody = `Implementation pass complete — draft PR opened at #${pr.prNumber}. Review the diff at ${pr.url}.`;
    } else {
      commentBody = `Implementation pass complete on local branch \`${branchInfo.branch}\` (commit \`${sha.slice(0, 7)}\`). Review the diff, then open a draft PR when ready.`;
    }
    commentOnIssue({
      owner: ctx.owner,
      repo: ctx.repo,
      number: ctx.issue.number,
      body: commentBody,
    });
  }

  printExecuteBanner({ branch: branchInfo.branch, sha, impl, pr });

  return {
    ok: true,
    impl: {
      branch: branchInfo.branch,
      sha,
      filesWritten: impl.filesWritten,
      commandsRun: impl.commandsRun,
      costUsd: impl.costUsd,
      pr,
      selfReview,
    },
  };
}

function buildFeatureSectionString(feature) {
  const lines = [`### Feature: ${feature.name}`, ''];
  for (const c of feature.criteria) lines.push(`- ${c}`);
  if (feature.relatedPaths.length) {
    lines.push('');
    lines.push('**Related API paths:**');
    for (const p of feature.relatedPaths) lines.push(`- \`${p}\``);
  }
  if (feature.relatedAdrs.length) {
    lines.push('');
    lines.push('**Related ADRs:**');
    for (const a of feature.relatedAdrs) lines.push(`- [${a.number}-${a.slug}](${a.path})`);
  }
  return lines.join('\n');
}

function loadApiSpec(cwd) {
  const p = path.join(cwd, 'contracts', 'api-spec.yaml');
  if (!fs.existsSync(p)) return null;
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (_) {
    return null;
  }
}

function loadAdrBodies(cwd, adrRefs) {
  const out = [];
  for (const adr of adrRefs || []) {
    const p = path.join(cwd, adr.path);
    if (!fs.existsSync(p)) continue;
    try {
      const body = fs.readFileSync(p, 'utf8');
      out.push({ number: adr.number, slug: adr.slug, body });
    } catch (_) { /* skip unreadable ADR */ }
  }
  return out;
}

function buildRetryPrompt(originalUserPrompt, missing, previousBody) {
  return `${originalUserPrompt}\n\n---\n\nYour previous response was missing the following required sections: ${missing.join(', ')}.\n\nProduce the FULL plan again, including every required section. Do not omit anything.\n\nThe previous (incomplete) response was:\n\n${previousBody}`;
}

async function confirmProceed() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const ans = await new Promise((resolve) => rl.question('Proceed? [y/N] ', resolve));
    return /^y(es)?$/i.test(ans.trim());
  } finally {
    rl.close();
  }
}

function printPlan({ repoName, issueNumber, feature, planRelPath, dryRun }) {
  console.log('');
  console.log(`github-sync${dryRun ? ' (dry-run)' : ''}`);
  console.log(`  repo:    ${repoName}`);
  console.log(`  issue:   #${issueNumber} — ${feature.name}`);
  console.log(`  plan:    ${planRelPath}`);
  console.log('');
}

function printDryRun({ systemPrompt, userPrompt }) {
  console.log('--- system prompt ---');
  console.log(systemPrompt);
  console.log('');
  console.log('--- user prompt ---');
  console.log(userPrompt);
  console.log('');
  console.log('(dry-run — no SDK call, no writes)');
}

function printExecutePlan({ repoName, issue, feature, planRelPath, branch, dryRun, baseBranch, maxCostUsd }) {
  console.log('');
  console.log(`github-sync --execute${dryRun ? ' (dry-run)' : ''}`);
  console.log(`  repo:       ${repoName}`);
  console.log(`  issue:      #${issue.number} — ${feature.name}`);
  console.log(`  plan:       ${planRelPath}`);
  console.log(`  base:       ${baseBranch}`);
  console.log(`  new branch: ${branch}`);
  console.log(`  cost cap:   $${maxCostUsd.toFixed(2)}`);
  console.log('');
}

function printExecuteBanner({ branch, sha, impl, pr }) {
  console.log('');
  if (sha) {
    console.log(`✓ WIP commit ${sha.slice(0, 7)} on ${branch}`);
  } else {
    console.log(`! No file changes on ${branch} — nothing committed`);
  }
  console.log(`  files written: ${impl.filesWritten.length}`);
  console.log(`  bash commands: ${impl.commandsRun.length}`);
  console.log(`  cost:          $${impl.costUsd.toFixed(2)}`);
  console.log('');
  if (pr) {
    console.log(`✓ Draft PR #${pr.prNumber}: ${pr.url}`);
    console.log('');
    console.log('Next:');
    console.log('  # Review the PR; mark ready when satisfied, or amend with:');
    console.log(`  git diff main..${branch}`);
    console.log('  git commit --amend');
    console.log(`  git push --force-with-lease origin ${branch}`);
  } else {
    console.log('Next:');
    console.log(`  git diff ${branch}`);
    console.log(`  git log ${branch}`);
    console.log('  # When ready to open the PR:');
    console.log(`  git push -u origin ${branch}`);
    console.log('  gh pr create --draft --title "implement: <feature>" --body "Closes #<N>"');
    console.log('  # (or re-run with --open-pr to do both automatically)');
  }
  console.log('');
}

function printBanner({ planRelPath, pr, retried }) {
  console.log('');
  console.log(`✓ plan written: ${planRelPath}${retried ? ' (after 1 retry)' : ''}`);
  console.log(`✓ draft PR #${pr.prNumber}: ${pr.url}`);
  console.log('');
}

module.exports = { runGithubSync };
