#!/usr/bin/env node
/**
 * Validates the current (or provided) branch name against CONTRIBUTING.md.
 * Usage: node scripts/check-branch-name.mjs [branch-name]
 */
const ALLOWED = /^(feat|fix|chore|docs|refactor|test|ci|release)\/[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

const branch = (process.argv[2] ?? "").trim();

if (!branch) {
  console.error("Usage: node scripts/check-branch-name.mjs <branch-name>");
  process.exit(1);
}

if (branch === "main") {
  console.error(
    [
      `Branch "${branch}" is protected.`,
      "Create a typed branch instead, e.g. feat/my-change or docs/update-readme.",
      "See CONTRIBUTING.md.",
    ].join("\n")
  );
  process.exit(1);
}

if (!ALLOWED.test(branch)) {
  console.error(
    [
      `Invalid branch name: "${branch}"`,
      "",
      "Expected: <type>/<short-kebab-description>",
      "Types: feat | fix | chore | docs | refactor | test | ci | release",
      "Example: feat/v22-angular-profile",
      "",
      "See CONTRIBUTING.md.",
    ].join("\n")
  );
  process.exit(1);
}

console.log(`Branch name OK: ${branch}`);
