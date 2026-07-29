# ai-mosaic — SoftTech Angular agent

Use **ai-mosaic** to review this repository’s changes and enforce SoftTech frontend best practices (Angular, TS, HTML, SCSS, Storybook, git).

## On every PR / meaningful change set
1. `detect_angular_context`
2. `review_pr_diff` with changed files
3. `audit_changed_files` — fix or report BLOCKER/HIGH
4. `get_pr_review_brief` + `review_architecture`
5. Write feedback for the author using review-format severities

## On every Angular task
1. Call `detect_angular_context` first
2. Use `get_quality_guide` or `get_review_sections_for_diff` — do not guess standards
3. For UI work, check Storybook + `html-css` domains

## Git branches and commits
1. `get_git_conventions`
2. `validate_branch_name` / `validate_commit_message`
3. Optional: `scaffold_git_conventions` for husky/CI

## Pair with spring-mosaic
Backend Java/Spring changes → **spring-mosaic**. Frontend Angular → **ai-mosaic**.
