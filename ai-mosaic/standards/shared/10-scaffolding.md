# Feature & Component Scaffolding

## When generating new code
1. Call `detect_angular_context` — match patterns to Angular major
2. Use `generate_feature` for new domains; `generate_component` for UI pieces
3. Presentational components: no service injection, signals/input()/output() only
4. Smart containers: facades, routing, store — no presentational markup
5. Add Storybook story for any component in shared/ or design-system paths

## File naming
- `kebab-case.component.ts`, `kebab-case.stories.ts`
- Facades: `<feature>.facade.ts`
- Routes: `<feature>/routes.ts` exported as const

## After scaffolding
1. Wire lazy route in app routes
2. Run `scan_violations` on generated files
3. Run Storybook if `withStory: true`
4. Optional: `run_angular_target` lint
