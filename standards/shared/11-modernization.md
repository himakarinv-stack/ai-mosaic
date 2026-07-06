# Modernization Audit Guide

## Audit order (highest impact first)
1. **Control flow** — *ngIf/*ngFor → @if/@for/@switch
2. **Change detection** — Default → OnPush everywhere
3. **Component API** — @Input/@Output → input()/output()
4. **Standalone** — NgModule features → standalone + loadComponent
5. **RxJS hygiene** — nested subscribe → async pipe / takeUntilDestroyed
6. **Signals** — imperative local state → signal/computed
7. **Storybook** — add stories for shared UI gaps
8. **Zoneless readiness** — remove NgZone triggers (v20+)

## Per-file workflow
1. `audit_modernization` on feature folder
2. `plan_refactor` for top category
3. `apply_changes` after human or AI review
4. Re-scan with `scan_violations`

## Version notes
- v19: control flow + standalone + OnPush are priority
- v20: add signals-first local state
- v21: zoneless-friendly patterns required for new code
