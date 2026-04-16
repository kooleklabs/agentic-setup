const { buildGeneratePrompt } = require('../prompt.js');

describe('buildGeneratePrompt', () => {
  test('includes requirement text verbatim', () => {
    const prompt = buildGeneratePrompt('Build a todo app', 'both');
    expect(prompt).toContain('Build a todo app');
  });

  test('defaults target to "both" when undefined', () => {
    const prompt = buildGeneratePrompt('x');
    expect(prompt).toContain('**Target: both**');
  });

  test('claude target omits copilot section', () => {
    const prompt = buildGeneratePrompt('x', 'claude');
    expect(prompt).toContain('**Target: claude**');
    expect(prompt).not.toContain('.github/copilot-instructions.md');
    expect(prompt).not.toContain('AGENTS.md');
  });

  test('copilot target includes copilot artifacts section', () => {
    const prompt = buildGeneratePrompt('x', 'copilot');
    expect(prompt).toContain('**Target: copilot**');
    expect(prompt).toContain('.github/copilot-instructions.md');
    expect(prompt).toContain('AGENTS.md');
    expect(prompt).toContain('.github/instructions/');
  });

  test('both target includes copilot artifacts section', () => {
    const prompt = buildGeneratePrompt('x', 'both');
    expect(prompt).toContain('.github/copilot-instructions.md');
    expect(prompt).toContain('AGENTS.md');
  });

  test('always references the framework files to customize', () => {
    const prompt = buildGeneratePrompt('x', 'claude');
    expect(prompt).toContain('CLAUDE.md');
    expect(prompt).toContain('.claude/agents/');
    expect(prompt).toContain('.claude/skills/');
    expect(prompt).toContain('.mcp.json');
  });
});
