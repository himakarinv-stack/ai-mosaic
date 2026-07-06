# ai-mosaic — Angular workspace agent

Use the **ai-mosaic** MCP server for architecture review, version-aware quality standards, scaffolding, and modernization audits.

## On every Angular task

1. Call `detect_angular_context` first
2. Use `get_quality_guide` or `get_review_sections_for_diff` — do not guess standards
3. For UI work, check Storybook standards via `get_quality_guide` domain `storybook`

## v1 workflows

| Workflow | Tools |
|----------|-------|
| PR review | `review_pr_diff` → `scan_violations` → `review_architecture` |
| Scaffolding | `generate_feature` / `generate_component` / `generate_story` → `apply_changes` |
| Modernization | `audit_modernization` → `plan_refactor` → `apply_changes` |

## Pair with Angular CLI MCP

```json
"angular-cli": { "command": "npx", "args": ["-y", "@angular/cli", "mcp"] }
```

ai-mosaic = quality & architecture. angular-cli = build, test, docs, migrations.
