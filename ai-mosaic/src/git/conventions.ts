import type { GeneratedFile } from "../codegen/templates.js";

export const GIT_TYPES = [
  "feat",
  "fix",
  "chore",
  "docs",
  "refactor",
  "test",
  "ci",
  "release",
] as const;

export type GitType = (typeof GIT_TYPES)[number];

export const BRANCH_PATTERN =
  /^(feat|fix|chore|docs|refactor|test|ci|release)\/[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

export const COMMIT_PATTERN =
  /^(feat|fix|chore|docs|refactor|test|ci|release)(\([a-z0-9][a-z0-9./-]*\))?!?: .+$/;

const HEADER_MAX = 72;

export interface ValidationResult {
  ok: boolean;
  value: string;
  errors: string[];
  hints: string[];
}

export function validateBranchName(branchName: string): ValidationResult {
  const value = branchName.trim();
  const errors: string[] = [];
  const hints: string[] = [
    "Format: <type>/<short-kebab-description>",
    `Types: ${GIT_TYPES.join(" | ")}`,
    "Example: feat/user-profile-signals",
  ];

  if (!value) {
    errors.push("Branch name is empty");
    return { ok: false, value, errors, hints };
  }

  if (value === "main" || value === "master") {
    errors.push(`Direct work on "${value}" is not allowed — use a typed branch`);
    return { ok: false, value, errors, hints };
  }

  if (!BRANCH_PATTERN.test(value)) {
    errors.push(`Invalid branch name: "${value}"`);
  }

  return { ok: errors.length === 0, value, errors, hints };
}

export function validateCommitMessage(message: string): ValidationResult {
  const value = message.trim();
  const header = value.split(/\r?\n/, 1)[0] ?? "";
  const errors: string[] = [];
  const hints: string[] = [
    "Format: <type>(optional-scope): <imperative summary>",
    `Types: ${GIT_TYPES.join(" | ")}`,
    "Example: feat(users): add profile signal state",
    "No trailing period; keep subject ≤ 72 characters",
  ];

  if (!header) {
    errors.push("Commit message is empty");
    return { ok: false, value, errors, hints };
  }

  if (header.length > HEADER_MAX) {
    errors.push(`Subject exceeds ${HEADER_MAX} characters (${header.length})`);
  }

  if (/\.\s*$/.test(header)) {
    errors.push("Subject must not end with a period");
  }

  if (!COMMIT_PATTERN.test(header)) {
    errors.push(
      `Invalid Conventional Commit subject: "${header}" — expected type(scope)?: summary`
    );
  }

  return { ok: errors.length === 0, value, errors, hints };
}

export function formatValidation(kind: "branch" | "commit", result: ValidationResult): string {
  const title = kind === "branch" ? "Branch name" : "Commit message";
  if (result.ok) {
    return `# ${title}: OK\n\n\`${result.value}\`\n`;
  }

  return [
    `# ${title}: INVALID`,
    "",
    `Value: \`${result.value || "(empty)"}\``,
    "",
    "## Errors",
    ...result.errors.map((e) => `- ${e}`),
    "",
    "## Hints",
    ...result.hints.map((h) => `- ${h}`),
    "",
    "Call `get_git_conventions` for the full guide, or `scaffold_git_conventions` to install local/CI enforcement.",
  ].join("\n");
}

export function getGitConventionsGuide(): string {
  return `# Git conventions (ai-mosaic)

Use these rules in **this Angular workspace** for branches, commits, and PRs.
Agents must validate with MCP tools before suggesting git commands.

## Branches

\`\`\`
<type>/<short-kebab-description>
\`\`\`

Types: ${GIT_TYPES.join(" | ")}

Examples:
- \`feat/user-profile-signals\`
- \`fix/scanner-missing-track\`
- \`chore/bump-dependencies\`
- \`docs/api-readme\`
- \`ci/conventions-workflow\`

Rules:
- One concern per branch
- Lowercase kebab-case after \`/\`
- Do not commit directly on \`main\` / \`master\`

Validate: \`validate_branch_name\`

## Commits

[Conventional Commits](https://www.conventionalcommits.org/):

\`\`\`
<type>(optional-scope): <imperative summary>
\`\`\`

Examples:
- \`feat(users): add profile signal state\`
- \`fix(forms): restore onPush for filter bar\`
- \`docs: clarify storybook autodocs requirement\`
- \`chore(deps): bump storybook to 8.x\`

Rules:
- Lowercase type
- Imperative mood ("add", not "added")
- No trailing period on the subject
- Subject ≤ ${HEADER_MAX} characters

Validate: \`validate_commit_message\`

## Pull requests

- Branch name must match the structure above
- PR title should match Conventional Commits (same as commit subject style)
- Prefer squash-merge so \`main\` stays conventional

## Hard enforcement (optional)

MCP tools guide and validate. For local/CI blocks in this repo:

1. Call \`scaffold_git_conventions\` then \`apply_changes\` with \`confirm:true\`, **or**
2. Run setup with \`--with-git-conventions\`

Then run \`npm install\` so husky hooks install.

Also enable GitHub branch protection / rulesets on \`main\` requiring the Conventions check.
`;
}

function checkBranchScript(): string {
  return `#!/usr/bin/env node
const ALLOWED = /^(feat|fix|chore|docs|refactor|test|ci|release)\\/[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const branch = (process.argv[2] ?? "").trim();
if (!branch) {
  console.error("Usage: node scripts/check-branch-name.mjs <branch-name>");
  process.exit(1);
}
if (branch === "main" || branch === "master") {
  console.error(\`Branch "\${branch}" is protected. Use type/kebab-description. See CONTRIBUTING.md.\`);
  process.exit(1);
}
if (!ALLOWED.test(branch)) {
  console.error(
    [
      \`Invalid branch name: "\${branch}"\`,
      "Expected: <type>/<short-kebab-description>",
      "Types: feat | fix | chore | docs | refactor | test | ci | release",
      "See CONTRIBUTING.md.",
    ].join("\\n")
  );
  process.exit(1);
}
console.log(\`Branch name OK: \${branch}\`);
`;
}

function commitlintConfig(): string {
  return `/** @type {import('@commitlint/types').UserConfig} */
const types = ["feat", "fix", "chore", "docs", "refactor", "test", "ci", "release"];

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", types],
    "type-case": [2, "always", "lower-case"],
    "subject-case": [0],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 72],
  },
};
`;
}

function conventionsWorkflow(): string {
  return `name: Conventions

on:
  pull_request:
    types: [opened, edited, synchronize, reopened]

permissions:
  contents: read
  pull-requests: read

jobs:
  branch-and-commits:
    name: Branch, commits, and PR title
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Validate branch name
        env:
          BRANCH: \${{ github.head_ref }}
        run: node scripts/check-branch-name.mjs "$BRANCH"

      - name: Validate PR title
        env:
          TITLE: \${{ github.event.pull_request.title }}
        run: echo "$TITLE" | npx --no -- commitlint

      - name: Validate commit messages
        run: npx --no -- commitlint --from "origin/\${{ github.base_ref }}" --to HEAD --verbose
`;
}

function contributingSnippet(): string {
  return `# Contributing

Branch and commit names follow **ai-mosaic** git conventions.

## Branches

\`<type>/<short-kebab-description>\`

Types: feat | fix | chore | docs | refactor | test | ci | release

## Commits

\`<type>(optional-scope): <imperative summary>\`

No trailing period. Subject ≤ 72 characters.

## Enforcement

- Local: husky \`commit-msg\` + \`pre-push\` (run \`npm install\` at repo root)
- CI: GitHub Actions workflow **Conventions**
- Agents: MCP tools \`validate_branch_name\`, \`validate_commit_message\`, \`get_git_conventions\`

Do not push directly to \`main\`.
`;
}

/** Files to install hard enforcement into a consumer Angular workspace. */
export function scaffoldGitConventionFiles(): GeneratedFile[] {
  return [
    {
      path: "CONTRIBUTING.md",
      content: contributingSnippet(),
      description: "Branch/commit rules for this workspace",
    },
    {
      path: "commitlint.config.cjs",
      content: commitlintConfig(),
      description: "commitlint config aligned with ai-mosaic types",
    },
    {
      path: "scripts/check-branch-name.mjs",
      content: checkBranchScript(),
      description: "Branch name validator used by husky and CI",
    },
    {
      path: ".husky/commit-msg",
      content: `#!/usr/bin/env sh\nnpx --no -- commitlint --edit "$1"\n`,
      description: "Reject non-conventional commit messages",
    },
    {
      path: ".husky/pre-push",
      content: `#!/usr/bin/env sh\nbranch="$(git branch --show-current)"\nnode "$(dirname -- "$0")/../scripts/check-branch-name.mjs" "$branch"\n`,
      description: "Reject invalid branch names on push",
    },
    {
      path: ".github/workflows/conventions.yml",
      content: conventionsWorkflow(),
      description: "CI: validate branch, PR title, and commits",
    },
    {
      path: "ai-mosaic.git-conventions.package.json.snippet.md",
      content: `# Merge into package.json

Add these fields (merge carefully with existing scripts/devDependencies):

\`\`\`json
{
  "scripts": {
    "prepare": "husky",
    "lint:commit": "commitlint --last --verbose",
    "lint:branch": "node scripts/check-branch-name.mjs"
  },
  "devDependencies": {
    "@commitlint/cli": "^19.8.1",
    "@commitlint/config-conventional": "^19.8.1",
    "husky": "^9.1.7"
  }
}
\`\`\`

Then run \`npm install\`.

Delete this snippet file after merging.
`,
      description: "Instructions to merge husky/commitlint into package.json",
    },
  ];
}

export function formatScaffoldPreview(files: GeneratedFile[]): string {
  const listing = files
    .map((f) => `## ${f.path}\n${f.description}\n\n\`\`\`\n${f.content}\n\`\`\``)
    .join("\n\n");

  return [
    "# Scaffold: git conventions",
    "",
    "Preview below. Call `apply_changes` with `confirm:true` to write missing files (existing files are skipped).",
    "Then merge the package.json snippet and run `npm install`.",
    "",
    listing,
  ].join("\n");
}
