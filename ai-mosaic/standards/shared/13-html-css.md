# HTML / CSS / SCSS

## HTML
- Prefer semantic elements (`main`, `nav`, `button`, `label`) over div/span soups.
- Images need meaningful `alt` (or empty alt for decorative).
- Form controls must have associated labels.
- Interactive elements must be keyboard reachable.

## CSS / SCSS organization
- Shared tokens live in one place (e.g. `_variables.scss`, `_tokens.scss`) — no copy-pasted hex/spacing.
- Shared mixins/functions in `_mixins.scss` (or equivalent) — do not duplicate across features.
- Feature styles stay next to the feature; avoid a single mega global stylesheet for everything.

## Practices
- Prefer class-based styling; avoid deep `::ng-deep` except rare documented cases.
- Prefer logical properties / responsive units thoughtfully; mobile-friendly by default.
- Remove unused selectors when deleting components.

## Tooling
- Stylelint (or team equivalent) for SCSS/CSS consistency when the repo uses stylesheets.
- Do not introduce a second conflicting design-token system without migration plan.
