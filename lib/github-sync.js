const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const { checkGhAvailable, commentOnIssue } = require('./github-issues.js');
const { detectGithubRepo } = require('./github-repo.js');
const { fetchFeatureIssue } = require('./github-issue-reader.js');
const { parseArchitecture } = require('./architecture-parser.js');
const { buildPlanPrompt } = require('./plan-prompt.js');
const { generatePlan } = require('./plan-generator.js');
const { renderPlanFile, validatePlanBody } = require('./plan-template.js');
const { openPlanPR } = require('./gh-plan-pr.js');

const DEFAULT_MODEL = 'claude-sonnet-4-6';

async function runGithubSync(opts = {}) {
  const {
    cwd = process.cwd(),
    issueNumber,
    dryRun = false,
    force = false,
    noComment = false,
    base = 'main',
    model = DEFAULT_MODEL,
    draft = true,
    autoApprove,
  } = opts;

  try {
    if (issueNumber === undefined || issueNumber === null) {
      return { ok: false, error: '--issue <N> is required.' };
    }

    checkGhAvailable();
    const { owner, repo } = detectGithubRepo();
    const repoName = `${owner}/${repo}`;

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

    const pr = openPlanPR({
      cwd,
      slug: issue.markerSlug,
      planFilePath: planRelPath,
      planTitle: issue.title,
      issueNumber,
      base,
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

function printBanner({ planRelPath, pr, retried }) {
  console.log('');
  console.log(`✓ plan written: ${planRelPath}${retried ? ' (after 1 retry)' : ''}`);
  console.log(`✓ draft PR #${pr.prNumber}: ${pr.url}`);
  console.log('');
}

module.exports = { runGithubSync };
