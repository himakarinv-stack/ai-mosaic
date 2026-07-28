# Git conventions

Branch and commit naming for Angular workspaces using ai-mosaic.

## Agent workflow

1. Before creating a branch → `validate_branch_name`
2. Before committing → `validate_commit_message`
3. Unsure of the rules → `get_git_conventions`
4. Need local/CI enforcement → `scaffold_git_conventions` → `apply_changes`

## Branch format

`<type>/<short-kebab-description>`

Types: feat | fix | chore | docs | refactor | test | ci | release

## Commit format

`<type>(optional-scope): <imperative summary>`

- No trailing period
- Subject ≤ 72 characters
- Imperative mood

## PR title

Same style as a Conventional Commit subject.
