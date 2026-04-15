# Contributing

Thanks for wanting to make this framework better. It's deliberately small — keep changes focused and opinionated.

## Ground rules

1. **Universal stays universal.** The base agents (`architect`, `test-engineer`, `security-reviewer`), the 4 base skills, and the hooks must work on any stack. If a change requires a specific stack, it belongs in a domain skill or a customizable agent, not the base.
2. **Every file earns its place.** Agent files ≤ 50 lines. Skill files ≤ 100 lines. If it needs to be longer, it probably needs to be split.
3. **Actionable over abstract.** Skills should contain rules Claude can follow, not general philosophy.
4. **Boring beats clever.** Prefer proven patterns.

## Repo layout

```
.
├── .claude/              # The framework itself (this IS the template)
│   ├── agents/           # Subagent definitions
│   ├── skills/           # Auto-activating knowledge
│   ├── commands/         # Slash-command workflows
│   └── hooks/            # Pre-commit + post-edit automation
├── contracts/            # API / event schema placeholder
├── CLAUDE.md             # Project constitution template
├── .mcp.json             # MCP server template
├── .claudeignore         # Default context exclusions
├── setup.sh              # Base framework installer
├── generate.sh           # Prompt-driven customizer (reads PRD → generates)
├── PROMPT_TEMPLATE.md    # Manual prompt for Claude Code / claude.ai
└── README.md
```

## How to propose a change

### Adding a universal skill
1. Open an issue describing the gap — why isn't this already covered?
2. Draft the SKILL.md under `.claude/skills/<name>/`
3. Keep it stack-agnostic — if you need to write "if you're using React…", it's not universal
4. Include a short YAML frontmatter with `name` and `description`

### Adding a customizable agent
1. Put it under `.claude/agents/`
2. Mark stack-specific lines with `# CUSTOMIZE:` comments
3. Default to a reasonable stack (the generator rewrites this anyway)

### Improving `setup.sh` or `generate.sh`
- Keep POSIX-compatible where possible
- Prefer heredocs over external template files (single-file install matters)
- Test on both macOS and Linux before opening a PR

### Adding examples
Drop a sample requirement under `examples/<name>.md` and a one-line entry in the README examples section.

## Commit style

Conventional commits:
```
feat: add kubernetes-deploy skill
fix: generate.sh handles pdfs with spaces in filename
docs: clarify L3 multi-team scaling
refactor: split architect.md decision framework
```

## Testing your change

```bash
# In a scratch directory
bash /path/to/agentic-setup/setup.sh --interactive

# Or test generate.sh end-to-end
echo "Build a todo app with Next.js and Postgres" | bash /path/to/agentic-setup/generate.sh --idea -
```

Open the scratch directory in Claude Code and confirm:
- [ ] All agents load without errors
- [ ] `/plan-feature` runs
- [ ] `/review-pr` runs
- [ ] `pre-commit.sh` and `post-edit.sh` execute
- [ ] Domain skill auto-activates on a relevant prompt

## Releasing

Bump version in `setup.sh` and `generate.sh` headers, update `CHANGELOG.md`, tag, push.
