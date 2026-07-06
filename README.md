# ai-mosaic

MCP server for **Angular architecture, code quality, and version-aware development** — acts as reviewer, coder, and architect for **Angular 19+**.

Works with Cursor, GitHub Copilot, Claude Code, and Claude Desktop. Includes first-class **Storybook** guidance.

## Install into an Angular repo

```bash
npx ai-mosaic-setup
```

Or as a dev dependency:

```bash
npm install --save-dev ai-mosaic
npx ai-mosaic-setup
```

## MCP configuration (manual)

**Cursor** — `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ai-mosaic": {
      "command": "npx",
      "args": ["-y", "ai-mosaic"]
    },
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}
```

## v1 workflows

### 1. PR review
```
detect_angular_context → review_pr_diff → scan_violations → review_architecture
```

### 2. Feature scaffolding
```
generate_feature / generate_component / generate_story → apply_changes (confirm:true)
```

### 3. Modernization audit
```
audit_modernization → plan_refactor → apply_changes
```

## MCP tools

| Tool | Description |
|------|-------------|
| `detect_angular_context` | Angular version, projects, Storybook, rule profile |
| `get_capability_profile` | Version-specific required/deprecated patterns |
| `list_quality_domains` | Index of quality domains |
| `get_quality_guide` | One domain on demand (version-scoped for modern-angular) |
| `explain_pattern` | Educational deep-dive |
| `explain_project_config` | Optional config file help |
| `get_pr_review_brief` | Review format + anti-patterns |
| `get_review_sections_for_diff` | Sections matched to file types |
| `review_pr_diff` | PR review orchestration |
| `review_architecture` | Principal-level architecture checklist |
| `scan_violations` | Version-aware heuristic scan |
| `audit_modernization` | Legacy pattern audit + Storybook gaps |
| `generate_feature` | Scaffold feature folder |
| `generate_component` | Scaffold component (+ optional story) |
| `generate_story` | Storybook CSF3 story |
| `plan_refactor` | Step-by-step refactor plan |
| `apply_changes` | Write files (requires confirm:true) |
| `run_angular_target` | Optional ng lint/test/build bridge |

## Optional project config

**You do not need a config file** — defaults work everywhere.

To tune per repo, copy `ai-mosaic.config.example.json` → `ai-mosaic.config.json`:

```json
{
  "severity": "balanced",
  "ignore": ["**/legacy/**"],
  "storybook": { "requireAutodocs": true },
  "cliBridge": { "enabled": true }
}
```

| Field | What it does |
|-------|----------------|
| `severity` | `strict` / `balanced` / `minimal` — how hard findings are flagged |
| `ignore` | Paths skipped during scans |
| `strictRules` | Rule IDs always treated as BLOCKER |
| `storybook.*` | Story file patterns and autodocs requirements |
| `cliBridge.*` | Enable/disable `run_angular_target` |

Call MCP tool `explain_project_config` for full details.

## Storybook

- Standards domain: `storybook`
- Scanner checks `.stories.ts` for autodocs, args/controls
- `audit_modernization` lists components missing stories
- `generate_story` scaffolds CSF3 stories

## Development

```bash
npm install
npm run build
npm link
cd ../my-angular-app && npx ai-mosaic-setup --local
```

## License

MIT
