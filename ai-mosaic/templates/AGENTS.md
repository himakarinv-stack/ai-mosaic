# ai-mosaic — Angular workspace agent

Use the **ai-mosaic** MCP server for architecture review, version-aware quality standards, scaffolding, modernization audits, and **git branch/commit conventions**.

## On every Angular task

1. Call `detect_angular_context` first
2. Use `get_quality_guide` or `get_review_sections_for_diff` — do not guess standards
3. For UI work, check Storybook standards via `get_quality_guide` domain `storybook`

## Git branches and commits

Before creating a branch, committing, or opening a PR:

1. `get_git_conventions` (or `get_quality_guide` domain `git-conventions`)
2. `validate_branch_name` with the proposed branch
3. `validate_commit_message` with the proposed commit subject / PR title

Do not suggest `main`/`master` feature work or non-conventional commit messages.
For hard local/CI enforcement: `scaffold_git_conventions` then confirm write, or setup `--with-git-conventions`.

## v1 workflows

| Workflow | Tools |
|----------|-------|
| PR review | `review_pr_diff` → `scan_violations` → `review_architecture` |
| Scaffolding | `generate_feature` / `generate_component` / `generate_story` → `apply_changes` |
| Modernization | `audit_modernization` → `plan_refactor` → `apply_changes` |
| Git conventions | `validate_branch_name` / `validate_commit_message` → optional `scaffold_git_conventions` |

## Pair with Angular CLI MCP

```json
"angular-cli": { "command": "npx", "args": ["-y", "@angular/cli", "mcp"] }
```

ai-mosaic = quality, architecture, git conventions. angular-cli = build, test, docs, migrations.
