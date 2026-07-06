# Copilot — Angular + ai-mosaic

When working in this Angular repo, use MCP tools from **ai-mosaic** before generating or reviewing code.

1. `detect_angular_context` — version and Storybook detection
2. `get_quality_guide` — fetch only the domain you need
3. `scan_violations` — heuristic check on .ts / .html / .stories files
4. PR reviews: follow `get_pr_review_brief` output format (BLOCKER/HIGH/MEDIUM/LOW)

Scaffolding: `generate_feature`, `generate_component`, `generate_story` — preview then `apply_changes`.

Modernization: `audit_modernization` on `src/app/features/<name>`.

Also use `@angular/cli mcp` for ng build, lint, test, and official migrations.
