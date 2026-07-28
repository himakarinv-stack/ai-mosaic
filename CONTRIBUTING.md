# Contributing to ai-mosaic

All branch names and commit messages must follow the structure below.

## Branches

```
<type>/<short-kebab-description>
```

| Type | Use for |
|------|---------|
| `feat` | New capability or MCP tool |
| `fix` | Bug fix |
| `chore` | Tooling, deps, housekeeping |
| `docs` | Documentation only |
| `refactor` | Internal restructure, no behavior change |
| `test` | Tests only |
| `ci` | CI / GitHub Actions |
| `release` | Version bumps and publish prep |

**Examples**

- `feat/v22-angular-profile`
- `fix/scanner-missing-track`
- `chore/bump-mcp-sdk`
- `docs/publish-guide`
- `refactor/setup-modes`
- `ci/publish-workflow`
- `release/0.2.0`

**Rules**

- One concern per branch
- Use lowercase kebab-case after the `/`
- Do not commit directly to `main`

## Commits

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(optional-scope): <imperative summary>
```

| Type | Same meaning as branch types above |
|------|-------------------------------------|
| Scope (optional) | Area touched: `profiles`, `scanner`, `setup`, `codegen`, `audit`, `standards`, `ci`, `deps` |

**Examples**

- `feat(profiles): add Angular 22 capability profile`
- `fix(scanner): treat missing track as blocker in v21`
- `chore(deps): bump MCP SDK to 1.x`
- `docs: document branch and commit conventions`
- `refactor(setup): clarify local vs npx modes`
- `ci: publish package on GitHub Release`
- `release: 0.2.0`

**Rules**

- Lowercase `type`
- Imperative mood (“add”, not “added” / “adds”)
- No trailing period on the subject line
- Keep the subject ≤ ~72 characters
- Use the body for *why* when needed; leave a blank line after the subject

## Release tags

```
v<major>.<minor>.<patch>
```

Examples: `v0.1.1`, `v0.2.0`

Push the tag and publish a GitHub Release — see [ai-mosaic/PUBLISH.md](./ai-mosaic/PUBLISH.md).

## Pull requests

- Branch name must match the structure above
- PR title should match the primary commit style (`type(scope): summary`)
- Squash-merge preferred so `main` history stays conventional

## Enforcement

These rules are **enforced**, not optional.

### Local (husky)

From the **repository root** (where this file lives):

```bash
npm install
```

That installs hooks:

| Hook | Blocks when |
|------|-------------|
| `commit-msg` | Commit subject is not Conventional Commits / wrong type |
| `pre-push` | Branch name is `main` or does not match `type/kebab-description` |

Invalid commits and pushes are rejected on your machine before they reach GitHub.

### CI (required check)

On every pull request, workflow **Conventions** validates:

1. Branch name
2. PR title
3. Every commit on the PR

PRs that fail this check cannot merge once branch protection requires it.

### `main` protection

Direct pushes to `main` are blocked (local pre-push + GitHub branch protection). Always open a typed branch and PR.
