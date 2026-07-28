---
applyTo: "**/*.{ts,html,scss}"
---

# Angular instructions (ai-mosaic)

- Angular 19+ only; match patterns to detected major via MCP
- Standalone + OnPush for new components
- Signals / input() / output() for new code (version profile applies)
- Presentational components: Storybook with autodocs
- No nested subscribe; no side effects in map()
- PR findings use BLOCKER / HIGH / MEDIUM / LOW severity
- Before git branch/commit/PR: validate via ai-mosaic `validate_branch_name` / `validate_commit_message`
