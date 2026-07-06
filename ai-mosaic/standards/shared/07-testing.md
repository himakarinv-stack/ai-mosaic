# Testing

## Require
- Test behavior, not implementation details
- Cover loading, empty, error, and success states for data views
- Presentational components: render with inputs; assert DOM output
- Facades/services: test orchestration with mocked dependencies
- Critical user paths have integration or e2e coverage

## Flag
- Tests coupled to private methods or internal state
- No coverage for error paths
- Snapshot-only tests with no behavioral assertion
- Skipping a11y keyboard interaction on custom controls

## Storybook as Test Surface
- Shared UI components validated in Storybook (visual + interaction tests where configured)
- Stories document edge states (empty, loading, error)
