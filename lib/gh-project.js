/**
 * GitHub Projects (v2) automation helpers. Adds Issues/PRs to a project
 * board and sets their Status column. Status-field and option lookups
 * are best-effort — a board without a "Status" field simply returns
 * {ok: false} from setItemStatus so the orchestrator can skip gracefully.
 */

const { spawnSync } = require('node:child_process');

function runGh(args) {
  const r = spawnSync('gh', args, { encoding: 'utf8' });
  if (r.error && r.error.code === 'ENOENT') {
    throw new Error('gh CLI not found. Install from https://cli.github.com.');
  }
  if (r.status !== 0) {
    const stderr = (r.stderr || '').trim();
    throw new Error(`gh ${args[0]} ${args[1]} failed (exit ${r.status}): ${stderr || '(no stderr)'}`);
  }
  return r.stdout || '';
}

function addItemToProject({ owner, projectNumber, contentUrl }) {
  const out = runGh([
    'project', 'item-add',
    String(projectNumber),
    '--owner', owner,
    '--url', contentUrl,
    '--format', 'json',
  ]);
  const parsed = JSON.parse(out);
  return { itemId: parsed.id };
}

function fetchProjectId({ owner, projectNumber }) {
  const out = runGh([
    'project', 'view',
    String(projectNumber),
    '--owner', owner,
    '--format', 'json',
  ]);
  const parsed = JSON.parse(out);
  return parsed.id;
}

function fetchStatusField({ owner, projectNumber }) {
  const out = runGh([
    'project', 'field-list',
    String(projectNumber),
    '--owner', owner,
    '--format', 'json',
  ]);
  const parsed = JSON.parse(out);
  const fields = parsed.fields || [];
  return fields.find((f) => f.name === 'Status');
}

function setItemStatus({ owner, projectNumber, itemId, optionName }) {
  let projectId;
  let statusField;
  try {
    projectId = fetchProjectId({ owner, projectNumber });
    statusField = fetchStatusField({ owner, projectNumber });
  } catch (err) {
    return { ok: false, reason: err.message };
  }

  if (!statusField) {
    return { ok: false, reason: 'Project has no Status field; skipping status update.' };
  }

  const option = (statusField.options || []).find((o) => o.name === optionName);
  if (!option) {
    return {
      ok: false,
      reason: `Status option "${optionName}" is not defined on project — available: ${(statusField.options || []).map((o) => o.name).join(', ') || 'none'}.`,
    };
  }

  try {
    runGh([
      'project', 'item-edit',
      '--id', itemId,
      '--project-id', projectId,
      '--field-id', statusField.id,
      '--single-select-option-id', option.id,
    ]);
  } catch (err) {
    return { ok: false, reason: err.message };
  }

  return { ok: true };
}

/**
 * Add an Issue/PR to a project and set its Status column, all best-effort.
 * Failures are captured in the return value so the orchestrator can log
 * them without aborting the primary operation.
 */
function attachToProject({ owner, projectNumber, contentUrl, statusOptionName }) {
  let itemId;
  try {
    ({ itemId } = addItemToProject({ owner, projectNumber, contentUrl }));
  } catch (err) {
    return { ok: false, stage: 'add', error: err.message };
  }

  if (!statusOptionName) {
    return { ok: true, itemId, statusSet: false };
  }

  const s = setItemStatus({ owner, projectNumber, itemId, optionName: statusOptionName });
  return {
    ok: true,
    itemId,
    statusSet: s.ok,
    statusReason: s.reason,
  };
}

module.exports = { addItemToProject, setItemStatus, attachToProject };
