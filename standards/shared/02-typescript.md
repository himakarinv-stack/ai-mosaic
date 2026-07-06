# TypeScript

## Require
- strict mode enabled; no implicit any
- Domain models separate from DTO/API shapes
- Readonly/immutable data for state snapshots
- Discriminated unions for variant state (loading | success | error)
- Explicit return types on public service/facade methods

## Flag
- `any`, unchecked casts, non-null assertion abuse
- Mixed UI + domain types in one interface
- Enums where const objects or union types suffice
- Optional chaining masking missing null handling in templates
