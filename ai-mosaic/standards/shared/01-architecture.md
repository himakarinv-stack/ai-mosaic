# Architecture

## Validate
- Clear feature boundaries — no cross-feature imports except via public API
- Smart vs presentational separation: containers orchestrate, components render
- List rendering: collection component + item component
- Templates readable within one scroll; decompose large sections
- Reusable UI primitives in shared/design-system layers
- Feature folders expose narrow public barrels (index.ts)
- No god components, god services, or mixed responsibilities

## Flag (BLOCKER/HIGH)
- Orchestration mixed with presentational templates
- Cross-feature leakage or shared mutable singletons
- Deeply nested template conditionals (>3 levels)
- Oversized components (>300 lines TS or template > one scroll)
- Public API surface too wide or leaking internal types

## Required Patterns
```
features/<name>/
  index.ts           # public exports only
  routes.ts          # lazy boundaries
  containers/        # smart: routing, facades, store wiring
  components/        # dumb: inputs/outputs or signals only
  services/          # feature-scoped facades
  models/            # domain types
shared/ui/           # design-system presentational components + Storybook
```

## Storybook Contract
- Every shared/design-system presentational component has a `.stories.ts`
- Containers are not required in Storybook unless they are thin layout shells
