# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), following [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-04-15

### Added
- Initial public release of the Universal Agentic Development Framework
- `setup.sh` — base framework installer (universal + interactive modes)
- `generate.sh` — prompt-driven customizer that reads a PRD/idea and generates a tailored `.claude/` layout
- `PROMPT_TEMPLATE.md` — copy-paste prompt for use inside Claude Code or claude.ai
- 6 subagent templates: `architect`, `api-engineer`, `frontend-engineer`, `test-engineer`, `security-reviewer`, `devops-engineer`
- 5 universal skills: `coding-standards`, `api-design`, `testing`, `security-review`, `design-system`
- 3 slash commands: `/plan-feature`, `/review-pr`, `/design-review`
- 2 hooks: `pre-commit.sh`, `post-edit.sh` (auto-detect stack)
- `CLAUDE.md` constitution template
- `.mcp.json` with sensible defaults (GitHub, context7)
- Example requirement: `examples/ecommerce-sme.md`
