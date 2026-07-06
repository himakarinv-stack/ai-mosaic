# Consolidated Anti-Patterns

## Architecture
- God components / god services
- Orchestration mixed with rendering
- Cross-feature imports bypassing public API
- Monolithic templates
- Duplicated markup across features

## Angular
- Default change detection (new code)
- Legacy structural directives in new templates
- Legacy @Input/@Output when input()/output() available
- Template function calls and recalculating getters
- Imperative UI synchronization
- Constructor lifecycle orchestration

## RxJS
- Nested subscriptions
- subs.sink / Subscription[] patterns
- Side effects in map()/switchMap()
- subscribe only to sync local template state

## State
- Mutable shared state
- State duplication between store and component
- Component-orchestrated store synchronization

## Performance
- Unstable bindings / new objects in templates
- Missing @for track
- Avoidable rerenders

## Accessibility
- Non-semantic clickable elements
- Missing labels / broken focus management
- Invalid ARIA

## Storybook
- Shared UI component without a story
- Stories without autodocs for design-system components
- Stories that require full app shell / real HTTP to render

## Dependencies
- Heavy legacy libraries (moment.js)
- Non-tree-shakeable imports
- Unnecessary third-party abstractions
