# Angular — ai-mosaic standards

Minimum Angular **19**. Standards adapt to detected major (v19 / v20 / v21).

Before writing or reviewing Angular code:
- `detect_angular_context`
- `get_capability_profile`

For PRs: `get_pr_review_brief` + `scan_violations` on changed files.

For new features: `generate_feature` then `apply_changes` with confirm:true.

For Storybook: shared UI components need `.stories.ts` with autodocs and controls.
