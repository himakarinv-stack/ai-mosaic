/** @type {import('@commitlint/types').UserConfig} */
const types = [
  "feat",
  "fix",
  "chore",
  "docs",
  "refactor",
  "test",
  "ci",
  "release",
];

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", types],
    "type-case": [2, "always", "lower-case"],
    // Allow product names in subjects (e.g. "add Angular 22 profile")
    "subject-case": [0],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 72],
  },
};
