# Modern Angular — v19 Profile

## Require (new code)
- Standalone components
- ChangeDetectionStrategy.OnPush
- Control flow: @if, @for (with track), @switch for new templates
- inject() for new services
- Typed reactive forms

## Recommend
- signal(), computed() for component-local state
- input(), output() for new component APIs
- takeUntilDestroyed() for subscriptions

## Flag
- *ngIf, *ngFor, *ngSwitch in new files
- @Input/@Output in new components
- Default change detection
- NgModule-based new features

## Not required yet
- Full zoneless (experimental in 19)
