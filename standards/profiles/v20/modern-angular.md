# Modern Angular — v20 Profile

## Require (new code)
- All v19 requirements
- Signals for component-local reactive state
- input()/output() for component public API
- No template function calls

## Recommend
- Zoneless-ready patterns (avoid implicit CD triggers)
- computed() for derived UI state
- effect() only for intentional side effects
- @defer for heavy content

## Flag
- Legacy structural directives
- Mutable fields synced imperatively in lifecycle hooks
- Manual subscribe without teardown
- Recalculating getters bound in templates
