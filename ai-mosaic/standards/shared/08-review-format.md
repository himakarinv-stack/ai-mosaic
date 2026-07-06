# PR Review Output Format

## Structure (mandatory)
```
## Summary
<1-2 sentences: what changed and architectural impact>

## Findings
### BLOCKER
- [file:line] Issue — why it matters — suggested fix

### HIGH
...

### MEDIUM / LOW / NIT
...

## Architecture Notes
<boundaries, coupling, state flow — only if relevant>

## Storybook
<missing stories, autodocs gaps — if UI changed>

## Verdict
APPROVE | REQUEST CHANGES | COMMENT
```

## Severity Classes
- **BLOCKER** — must fix before merge (security, broken architecture, wrong patterns for Angular version)
- **HIGH** — should fix before merge (maintainability, perf, a11y regression)
- **MEDIUM** — fix soon or follow-up ticket
- **LOW / NIT** — optional polish

## Do Not Review (assumed known)
- Basic Angular syntax (@Component, imports)
- Trivial formatting unless it hides a real issue
- Bike-shedding naming unless it misleads domain meaning
