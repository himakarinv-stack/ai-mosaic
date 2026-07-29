# Lint & format tooling (Angular / TS repos)

## Required baseline
- **TypeScript**: `strict: true` (or documented exceptions).
- **ESLint** with Angular / TypeScript rules aligned to this package’s standards.
- **Prettier** (or equivalent) for consistent formatting — one config per repo.

## Optional but recommended
- **Stylelint** for SCSS/CSS when styles are non-trivial.
- CI job that runs lint (and preferably unit tests) on every PR.

## Agent / review expectations
- Flag missing or conflicting lint configs when reviewing repo bootstrap PRs.
- Do not disable rules wholesale with `eslint-disable` without a linked reason.
- Prefer fixing root causes over ignoring violations.
