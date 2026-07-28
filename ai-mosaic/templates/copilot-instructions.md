# Copilot — Angular + ai-mosaic

When working in this Angular repo, use MCP tools from **ai-mosaic** before generating or reviewing code.

1. `detect_angular_context` — version and Storybook detection
2. `get_quality_guide` — fetch only the domain you need
3. `scan_violations` — heuristic check on .ts / .html / .stories files
4. PR reviews: follow `get_pr_review_brief` output format (BLOCKER/HIGH/MEDIUM/LOW)
5. Git: `validate_branch_name` / `validate_commit_message` before branch, commit, or PR title

Scaffolding: `generate_feature`, `generate_component`, `generate_story` — preview then `apply_changes`.

Modernization: `audit_modernization` on `src/app/features/<name>`.

Git enforcement files: `scaffold_git_conventions` (confirm:true) or setup `--with-git-conventions`.

Also use `@angular/cli mcp` for ng build, lint, test, and official migrations.
