# Releasing

How a new version reaches npm.

## One-time setup

### 1. Create an npm automation token
- Visit https://www.npmjs.com/settings/~/tokens
- **Generate New Token → Classic → Automation**
  (Automation tokens bypass 2FA — required for CI)
- Copy the token (shown only once)

### 2. Add it to GitHub Actions secrets

```bash
# Via gh CLI (recommended — stays out of chat/shell history)
gh secret set NPM_TOKEN --repo KoolekLabs/agentic-setup
# Paste the token at the prompt, then press Enter + Ctrl-D
```

Or via the GitHub UI: **Settings → Secrets and variables → Actions → New repository secret**, name `NPM_TOKEN`.

### 3. (Optional) Protect the `npm-publish` environment

**Settings → Environments → New environment → `npm-publish`** → add required reviewers. Every release will then require a manual approval click before publishing.

## Release flow

```bash
# Bump version (creates a commit + git tag like v1.1.1)
npm run release:patch     # 1.1.0 → 1.1.1  (bug fixes)
npm run release:minor     # 1.1.0 → 1.2.0  (new features)
npm run release:major     # 1.1.0 → 2.0.0  (breaking changes)

# The script above already ran: git push --follow-tags
```

Then on GitHub:

1. **Releases → Draft a new release**
2. **Choose a tag** → pick the `v1.x.y` tag you just pushed
3. Title: `v1.x.y`. Write release notes (use "Generate release notes" for auto-summary from commits).
4. **Publish release** → the `Release` workflow fires → package lands on npm within ~1 minute.

## What happens under the hood

- **`release.yml`** is triggered by `release: [published]`
- Verifies `tag_name` matches `package.json` `version` (hard failure if mismatched)
- Runs `npm publish --access public --provenance`
- Provenance attaches a signed statement linking the npm tarball to the exact GitHub commit + workflow run — users can verify authenticity on npm and via `npm audit signatures`.

## Rolling back a bad release

npm forbids re-publishing the same version. If `v1.2.3` shipped broken:

```bash
# Option A — deprecate and release a fix
npm deprecate @kooleklabs/agentic-app@1.2.3 "Broken; use 1.2.4"
npm run release:patch   # publishes 1.2.4

# Option B — unpublish (only within 72 hours, and breaks anyone already depending on it)
npm unpublish @kooleklabs/agentic-app@1.2.3
```

Prefer Option A.

## Future upgrade: OIDC trusted publishing

npm now supports publishing from GitHub Actions without a long-lived token, via OIDC. Steps:

1. On npm, open the package → **Settings → Publishing access → Trusted Publisher**
2. Add: repo `KoolekLabs/agentic-setup`, workflow `release.yml`, environment `npm-publish`
3. In `release.yml`, delete the `NODE_AUTH_TOKEN` env on the publish step
4. Delete the `NPM_TOKEN` secret

No more rotating tokens. Recommended once the repo is stable.
