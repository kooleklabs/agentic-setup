const readline = require('node:readline');
const { detectGithubRepo } = require('./github-repo.js');
const { parseArchitecture } = require('./architecture-parser.js');
const {
  checkGhAvailable,
  listOpenIssuesWithMarkers,
  listMilestones,
  createMilestone,
  createIssue,
  updateIssue,
} = require('./github-issues.js');
const { buildFeatureBody, buildUmbrellaBody } = require('./issue-body.js');
const { attachToProject } = require('./gh-project.js');

async function runGithubPush(opts = {}) {
  const {
    cwd = process.cwd(),
    dryRun = false,
    force = false,
    noUmbrella = false,
    milestoneTitle,
    projectNumber,
    autoApprove,
  } = opts;

  try {
    checkGhAvailable();
    const { owner, repo } = detectGithubRepo();
    const parsed = parseArchitecture(cwd);

    // Always scan for existing markers. --force only loosens the FEATURE
    // duplicate-skip rule; milestone and umbrella are singletons that
    // should never be duplicated just because the user passed --force.
    const existing = listOpenIssuesWithMarkers({ owner, repo });
    const existingFeatureNumbers = new Map();
    let existingUmbrella = null;
    for (const issue of existing) {
      for (const m of issue.markers) {
        if (m.type === 'feature') existingFeatureNumbers.set(m.slug, issue.number);
        if (m.type === 'umbrella') existingUmbrella = { number: issue.number };
      }
    }

    const shouldSkipFeature = (slug) => !force && existingFeatureNumbers.has(slug);
    const toCreate = parsed.features.filter((f) => !shouldSkipFeature(f.slug));
    const skipped = parsed.features
      .filter((f) => shouldSkipFeature(f.slug))
      .map((f) => f.slug);
    const willCreateUmbrella = !noUmbrella && !existingUmbrella;

    const msTitle = milestoneTitle || `${parsed.projectName} v1.0`;

    printPlan({
      owner,
      repo,
      msTitle,
      toCreate,
      skipped,
      willCreateUmbrella,
      umbrellaExists: Boolean(existingUmbrella),
      noUmbrella,
      dryRun,
    });

    if (dryRun) {
      return {
        ok: true,
        dryRun: true,
        plan: {
          owner,
          repo,
          msTitle,
          toCreate: toCreate.map((f) => f.slug),
          skipped,
          willCreateUmbrella,
        },
      };
    }

    const approved = autoApprove !== undefined
      ? Boolean(autoApprove)
      : await confirmProceed();
    if (!approved) {
      console.log('Aborted.');
      return { ok: false, cancelled: true };
    }

    const milestones = listMilestones({ owner, repo });
    const milestone = milestones.find((m) => m.title === msTitle) ||
      createMilestone({
        owner,
        repo,
        title: msTitle,
        description: 'Auto-created by @kooleklabs/agentic-app push-architecture',
      });

    let umbrella = null;
    if (willCreateUmbrella) {
      umbrella = createIssue({
        owner,
        repo,
        title: `🏗 Architecture — ${parsed.projectName}`,
        body: buildUmbrellaBody(parsed, new Map()),
        milestone: milestone.title,
      });
      if (projectNumber) {
        logProjectAttach('umbrella', attachToProject({
          owner, projectNumber, contentUrl: umbrella.url, statusOptionName: 'Todo',
        }));
      }
    }

    const createdFeatures = [];
    const featureNumbers = new Map(existingFeatureNumbers);
    for (const f of toCreate) {
      const res = createIssue({
        owner,
        repo,
        title: f.name,
        body: buildFeatureBody(f, parsed.openapiPaths),
        milestone: milestone.title,
      });
      createdFeatures.push({ slug: f.slug, number: res.number, url: res.url });
      featureNumbers.set(f.slug, res.number);
      if (projectNumber) {
        logProjectAttach(`feature ${f.slug}`, attachToProject({
          owner, projectNumber, contentUrl: res.url, statusOptionName: 'Todo',
        }));
      }
    }

    const umbrellaNumberForRefresh = umbrella?.number ?? existingUmbrella?.number;
    if (umbrellaNumberForRefresh !== undefined && !noUmbrella) {
      updateIssue({
        owner,
        repo,
        number: umbrellaNumberForRefresh,
        body: buildUmbrellaBody(parsed, featureNumbers),
      });
    }

    printBanner({ milestone, umbrella, createdFeatures, skipped });

    return {
      ok: true,
      milestone,
      umbrella,
      created: createdFeatures,
      skipped,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function logProjectAttach(label, r) {
  if (r.ok && r.statusSet) {
    console.log(`  ↳ project: ${label} → Todo`);
  } else if (r.ok) {
    console.log(`  ↳ project: ${label} added (${r.statusReason || 'no status set'})`);
  } else {
    console.log(`  ↳ project: ${label} skipped — ${r.error || r.stage || 'unknown'}`);
  }
}

function printPlan({ owner, repo, msTitle, toCreate, skipped, willCreateUmbrella, umbrellaExists, noUmbrella, dryRun }) {
  console.log('');
  console.log(`push-architecture${dryRun ? ' (dry-run)' : ''}`);
  console.log(`  repo:      ${owner}/${repo}`);
  console.log(`  milestone: ${msTitle}`);
  if (willCreateUmbrella) {
    console.log('  + create umbrella Issue');
  } else if (noUmbrella) {
    console.log('  · umbrella Issue disabled (--no-umbrella)');
  } else if (umbrellaExists) {
    console.log('  · skip umbrella (already exists)');
  }
  for (const f of toCreate) console.log(`  + create feature: ${f.name}`);
  for (const slug of skipped) console.log(`  · skip feature: ${slug} (already exists)`);
  console.log('');
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

function printBanner({ milestone, umbrella, createdFeatures, skipped }) {
  console.log('');
  console.log(`✓ milestone #${milestone.number}: ${milestone.title}`);
  if (umbrella) console.log(`✓ umbrella  #${umbrella.number}: ${umbrella.url}`);
  for (const f of createdFeatures) console.log(`✓ feature   #${f.number}: ${f.url}`);
  if (skipped.length) console.log(`  skipped: ${skipped.join(', ')}`);
  console.log('');
}

module.exports = { runGithubPush };
