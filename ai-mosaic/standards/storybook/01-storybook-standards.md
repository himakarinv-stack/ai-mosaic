# Storybook Standards (Angular)

## Require
- CSF3 format: `Meta`, `StoryObj`, typed component import
- `tags: ['autodocs']` for design-system / shared UI components
- `title` hierarchy: `Components/Name` or `Features/Feature/Name`
- `args` and/or `argTypes` for interactive controls
- Stories render without full app shell, real HTTP, or auth

## Presentational focus
- Storybook targets dumb components — mock inputs via args
- Containers: story only if thin shell; otherwise story child components
- Document states: default, empty, loading, error, disabled

## Flag
- Missing autodocs on shared UI
- Story requires NgRx store or HTTP unless explicitly mocked via decorators
- Duplicate story per minor variant (use args instead)
- Hard-coded production URLs or secrets in stories

## Integration with ai-mosaic
- `generate_story` — scaffold autodocs + controls
- `scan_violations` — checks .stories.ts files
- `audit_modernization` — lists components missing stories
- PR review: flag UI changes without story updates

## Decorators (when needed)
```typescript
// Mock providers at story level — not in production component
decorators: [
  applicationConfig({ providers: [/* mock facade */] }),
],
```
