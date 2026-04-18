const cp = require('node:child_process');

jest.mock('node:child_process');

const {
  addItemToProject,
  setItemStatus,
} = require('../gh-project.js');

beforeEach(() => jest.clearAllMocks());

describe('addItemToProject', () => {
  test('returns {itemId} from gh project item-add JSON output', () => {
    cp.spawnSync.mockReturnValueOnce({
      status: 0,
      stdout: JSON.stringify({ id: 'PVTI_abc123', content: { number: 42 } }),
      stderr: '',
    });
    const r = addItemToProject({
      owner: 'kool',
      projectNumber: 1,
      contentUrl: 'https://github.com/kool/r/issues/42',
    });
    expect(r).toEqual({ itemId: 'PVTI_abc123' });
  });

  test('calls gh project item-add with --owner, --url, and --format json', () => {
    cp.spawnSync.mockReturnValueOnce({
      status: 0,
      stdout: JSON.stringify({ id: 'PVTI_x' }),
      stderr: '',
    });
    addItemToProject({ owner: 'kool', projectNumber: 1, contentUrl: 'https://x/y/issues/1' });
    const [cmd, args] = cp.spawnSync.mock.calls[0];
    expect(cmd).toBe('gh');
    expect(args).toContain('project');
    expect(args).toContain('item-add');
    expect(args).toContain('--owner');
    expect(args[args.indexOf('--owner') + 1]).toBe('kool');
    expect(args).toContain('--url');
    expect(args).toContain('--format');
    expect(args[args.indexOf('--format') + 1]).toBe('json');
  });

  test('throws with guidance when gh project call fails', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 1, stdout: '', stderr: 'project not found' });
    expect(() => addItemToProject({
      owner: 'o', projectNumber: 99, contentUrl: 'https://x',
    })).toThrow(/project not found/);
  });
});

describe('setItemStatus', () => {
  function stubFieldLookup(statusOptions = [{ id: 'OPT_todo', name: 'Todo' }]) {
    // 1. gh project view → project id
    cp.spawnSync.mockReturnValueOnce({
      status: 0,
      stdout: JSON.stringify({ id: 'PVT_xyz', title: 'Roadmap' }),
      stderr: '',
    });
    // 2. gh project field-list → fields with Status
    cp.spawnSync.mockReturnValueOnce({
      status: 0,
      stdout: JSON.stringify({
        fields: [
          { id: 'PVTF_title', name: 'Title' },
          { id: 'PVTF_status', name: 'Status', options: statusOptions },
        ],
      }),
      stderr: '',
    });
  }

  test('finds Status field + option, then calls item-edit with resolved IDs', () => {
    stubFieldLookup([{ id: 'OPT_todo', name: 'Todo' }, { id: 'OPT_prog', name: 'In Progress' }]);
    cp.spawnSync.mockReturnValueOnce({ status: 0, stdout: '{}', stderr: '' }); // item-edit

    const r = setItemStatus({
      owner: 'kool',
      projectNumber: 1,
      itemId: 'PVTI_abc',
      optionName: 'In Progress',
    });
    expect(r.ok).toBe(true);
    expect(cp.spawnSync).toHaveBeenCalledTimes(3);
    const editArgs = cp.spawnSync.mock.calls[2][1];
    expect(editArgs).toContain('item-edit');
    expect(editArgs).toContain('--project-id');
    expect(editArgs[editArgs.indexOf('--project-id') + 1]).toBe('PVT_xyz');
    expect(editArgs).toContain('--field-id');
    expect(editArgs[editArgs.indexOf('--field-id') + 1]).toBe('PVTF_status');
    expect(editArgs).toContain('--single-select-option-id');
    expect(editArgs[editArgs.indexOf('--single-select-option-id') + 1]).toBe('OPT_prog');
  });

  test('returns {ok: false, reason} when Status field is not present on the project (best-effort)', () => {
    cp.spawnSync.mockReturnValueOnce({
      status: 0,
      stdout: JSON.stringify({ id: 'PVT_xyz', title: 'Roadmap' }),
      stderr: '',
    });
    cp.spawnSync.mockReturnValueOnce({
      status: 0,
      stdout: JSON.stringify({
        fields: [{ id: 'PVTF_title', name: 'Title' }],
      }),
      stderr: '',
    });
    const r = setItemStatus({
      owner: 'o', projectNumber: 1, itemId: 'PVTI_x', optionName: 'Todo',
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/status field/i);
  });

  test('returns {ok: false, reason} when the option name is not a Status value on the project', () => {
    stubFieldLookup([{ id: 'OPT_todo', name: 'Todo' }]); // no "In Review"
    const r = setItemStatus({
      owner: 'o', projectNumber: 1, itemId: 'PVTI_x', optionName: 'In Review',
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/In Review/);
  });

  test('does not throw when gh command fails — returns {ok: false} with error in reason', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 1, stdout: '', stderr: 'forbidden' });
    const r = setItemStatus({ owner: 'o', projectNumber: 1, itemId: 'x', optionName: 'Todo' });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/forbidden/);
  });
});

describe('attachToProject (composite best-effort)', () => {
  const { attachToProject } = require('../gh-project.js');

  test('add succeeds + status succeeds → {ok: true, statusSet: true}', () => {
    cp.spawnSync
      .mockReturnValueOnce({ status: 0, stdout: JSON.stringify({ id: 'PVTI_x' }), stderr: '' })
      .mockReturnValueOnce({ status: 0, stdout: JSON.stringify({ id: 'PVT_y' }), stderr: '' })
      .mockReturnValueOnce({
        status: 0,
        stdout: JSON.stringify({
          fields: [{ id: 'PVTF_s', name: 'Status', options: [{ id: 'OPT_t', name: 'Todo' }] }],
        }),
        stderr: '',
      })
      .mockReturnValueOnce({ status: 0, stdout: '{}', stderr: '' });

    const r = attachToProject({
      owner: 'o', projectNumber: 1, contentUrl: 'https://x/y/issues/1', statusOptionName: 'Todo',
    });
    expect(r).toEqual({ ok: true, itemId: 'PVTI_x', statusSet: true, statusReason: undefined });
  });

  test('add fails → {ok: false, stage: "add", error}', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 1, stdout: '', stderr: 'no access' });
    const r = attachToProject({
      owner: 'o', projectNumber: 1, contentUrl: 'https://x', statusOptionName: 'Todo',
    });
    expect(r.ok).toBe(false);
    expect(r.stage).toBe('add');
    expect(r.error).toMatch(/no access/);
  });

  test('statusOptionName omitted → adds but does not attempt status update', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 0, stdout: JSON.stringify({ id: 'PVTI_x' }), stderr: '' });
    const r = attachToProject({
      owner: 'o', projectNumber: 1, contentUrl: 'https://x',
    });
    expect(r).toEqual({ ok: true, itemId: 'PVTI_x', statusSet: false });
    expect(cp.spawnSync).toHaveBeenCalledTimes(1);
  });
});
