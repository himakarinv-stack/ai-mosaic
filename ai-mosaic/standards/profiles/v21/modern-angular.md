# Modern Angular — v21+ Profile

## Require (new code)
- All v20 requirements
- Zoneless-friendly architecture in new features
- Stable track in every @for
- Presentational components Storybook-ready (isolated, no app shell)

## Recommend
- Signal inputs with transform where needed
- Feature lazy boundaries with explicit public APIs
- Resource/linkedSignal patterns for async state when applicable
- @defer with prefetch triggers for below-fold UI

## Flag
- Zone.js-dependent patterns in new code (NgZone.run, setTimeout for CD)
- Constructor subscriptions and lifecycle orchestration
- God components mixing routing, state, and rendering
- Shared UI without Storybook coverage
