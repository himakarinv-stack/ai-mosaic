# Performance

## Validate
- Stable object/array references in template bindings
- `@for` with stable `track` identity
- `@defer` for heavy or below-fold content (when supported)
- Lazy-loaded feature routes
- Tree-shakeable imports; no barrel re-export of entire libraries

## Flag
- New object/array literals in template bindings each CD cycle
- Missing track in @for
- Template function calls or recalculating getters
- Synchronous heavy work in constructors or ngOnInit
- Importing entire lodash/moment-style libraries
