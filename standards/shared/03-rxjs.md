# RxJS & Reactive Patterns

## Require
- Compose streams with pipe(); avoid nested subscribe
- `takeUntilDestroyed()` for component-scoped subscriptions
- Side effects in `tap()` or `effect()` — never in `map()`
- Async pipe or signals for template-bound observables
- Single source of truth — no duplicated local + store state

## Flag (BLOCKER/HIGH)
- Nested subscriptions
- subs.sink / Subscription[] / manual new Subscription()
- Constructor subscriptions
- subscribe() only to copy value into component field for template
- dispatch or HTTP inside map/switchMap without clear intent

## Signal Boundaries
- `computed()` for derived UI state — no side effects
- `effect()` for intentional side effects — not for derivation
- Prefer declarative template bindings over imperative DOM sync
