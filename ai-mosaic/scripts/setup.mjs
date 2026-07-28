#!/usr/bin/env node
/**
 * Install ai-mosaic MCP + host-specific instructions into an Angular workspace.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { platform } from "node:os";

const SERVER_NAME = "ai-mosaic";
const ANGULAR_CLI_NAME = "angular-cli";
const NPM_PACKAGE = "@himakarinv-stack/ai-mosaic";
const GH_PACKAGES_REGISTRY = "https://npm.pkg.github.com";

function resolvePackageRoot() {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = resolve(here, "..");
  if (existsSync(join(root, "standards"))) return root;
  throw new Error("Could not locate ai-mosaic package root.");
}

function parseArgs(argv) {
  const args = {
    target: process.cwd(),
    host: "all",
    mode: "auto",
    nodeCommand: "node",
    npxCommand: "npx",
    skipInstructions: false,
    withAngularCli: true,
    withGitConventions: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--target" && argv[i + 1]) args.target = resolve(argv[++i]);
    else if (arg === "--host" && argv[i + 1]) args.host = argv[++i];
    else if (arg === "--local") args.mode = "local";
    else if (arg === "--npx") args.mode = "npx";
    else if (arg === "--skip-instructions") args.skipInstructions = true;
    else if (arg === "--no-angular-cli") args.withAngularCli = false;
    else if (arg === "--with-git-conventions") args.withGitConventions = true;
    else if (arg === "--node" && argv[i + 1]) args.nodeCommand = argv[++i];
    else if (arg === "--npx-cmd" && argv[i + 1]) args.npxCommand = argv[++i];
    else if (arg === "--help") {
      console.log(`
ai-mosaic-setup — install MCP for Cursor, GitHub Copilot, Claude Code

Options:
  --target                 Angular workspace root (default: cwd)
  --host                   cursor | copilot | claude-code | claude-desktop | all
  --local                  Force local package dist/ (dev of ai-mosaic repo)
  --npx                    Force npx + GitHub Packages (no local node_modules)
  --skip-instructions      Do not overwrite AGENTS.md / CLAUDE.md / copilot files
  --no-angular-cli         Skip adding @angular/cli mcp server
  --with-git-conventions   Install husky/commitlint/CI branch+commit enforcement
  --node                   Node executable
  --npx-cmd                npx executable

Modes (default: auto):
  auto   — use node_modules/@himakarinv-stack/ai-mosaic when installed, else npx
  local  — ai-mosaic repo dist/ (for package development)
  npx    — always fetch from GitHub Packages via npx
`);
      process.exit(0);
    }
  }

  return args;
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  console.log("Wrote", path);
}

function mergeJson(path, mergeFn) {
  const existing = existsSync(path) ? JSON.parse(readFileSync(path, "utf-8")) : {};
  writeJson(path, mergeFn(existing));
}

function toPosix(path) {
  return path.replace(/\\/g, "/");
}

function npxServerEntry(npxCommand) {
  return {
    command: npxCommand,
    args: ["-y", "--registry", GH_PACKAGES_REGISTRY, NPM_PACKAGE],
  };
}

function localServerEntry(packageRoot, nodeCommand) {
  const entry = toPosix(join(packageRoot, "dist/index.js"));
  const standards = toPosix(join(packageRoot, "standards"));
  return {
    command: nodeCommand,
    args: [entry],
    env: { AI_MOSAIC_ROOT: standards },
  };
}

function installedServerEntry(target, nodeCommand) {
  const pkgRoot = join(target, "node_modules", "@himakarinv-stack", "ai-mosaic");
  const entry = join(pkgRoot, "dist/index.js");
  if (!existsSync(entry)) return null;

  const relEntry = "./node_modules/@himakarinv-stack/ai-mosaic/dist/index.js";
  const relStandards = "./node_modules/@himakarinv-stack/ai-mosaic/standards";
  return {
    command: nodeCommand,
    args: [relEntry],
    env: { AI_MOSAIC_ROOT: relStandards },
  };
}

function angularCliServerEntry(npxCommand, forVsCode = false) {
  const entry = {
    command: npxCommand,
    args: ["-y", "@angular/cli", "mcp"],
  };
  return forVsCode ? { type: "stdio", ...entry } : entry;
}

function resolveServerConfig(mode, packageRoot, target, nodeCommand, npxCommand) {
  if (mode === "local") {
    const entry = join(packageRoot, "dist/index.js");
    if (!existsSync(entry)) {
      console.error("Local MCP not built. Run: npm install && npm run build");
      process.exit(1);
    }
    return { mode: "local", server: localServerEntry(packageRoot, nodeCommand) };
  }

  if (mode === "npx") {
    return { mode: "npx", server: npxServerEntry(npxCommand) };
  }

  const installed = installedServerEntry(target, nodeCommand);
  if (installed) {
    return { mode: "installed", server: installed };
  }

  return { mode: "npx", server: npxServerEntry(npxCommand) };
}

function setupCursor(target, server, withAngularCli, npxCommand) {
  mergeJson(join(target, ".cursor/mcp.json"), (existing) => {
    const mcpServers = { ...(existing.mcpServers ?? {}), [SERVER_NAME]: server };
    if (withAngularCli) {
      mcpServers[ANGULAR_CLI_NAME] = angularCliServerEntry(npxCommand);
    }
    return { mcpServers };
  });
}

function setupVsCodeCopilot(target, server, withAngularCli, npxCommand) {
  mergeJson(join(target, ".vscode/mcp.json"), (existing) => {
    const servers = {
      ...(existing.servers ?? {}),
      [SERVER_NAME]: { type: "stdio", ...server },
    };
    if (withAngularCli) {
      servers[ANGULAR_CLI_NAME] = angularCliServerEntry(npxCommand, true);
    }
    return { servers };
  });
}

function setupClaudeCode(target, server, withAngularCli, npxCommand) {
  mergeJson(join(target, ".mcp.json"), (existing) => {
    const mcpServers = {
      ...(existing.mcpServers ?? {}),
      [SERVER_NAME]: { type: "stdio", ...server },
    };
    if (withAngularCli) {
      mcpServers[ANGULAR_CLI_NAME] = { type: "stdio", ...angularCliServerEntry(npxCommand) };
    }
    return { mcpServers };
  });
}

function setupClaudeDesktop(server, nodeCommand, npxCommand, mode, packageRoot, target, withAngularCli) {
  const configPaths = {
    win32: join(process.env.APPDATA ?? "", "Claude", "claude_desktop_config.json"),
    darwin: join(process.env.HOME ?? "", "Library/Application Support/Claude/claude_desktop_config.json"),
    linux: join(process.env.HOME ?? "", ".config/Claude/claude_desktop_config.json"),
  };
  const configPath = configPaths[platform()] ?? configPaths.linux;

  const resolved =
    mode === "local"
      ? localServerEntry(packageRoot, nodeCommand)
      : mode === "installed"
        ? installedServerEntry(target, nodeCommand) ?? npxServerEntry(npxCommand)
        : npxServerEntry(npxCommand);

  mergeJson(configPath, (existing) => {
    const mcpServers = { ...(existing.mcpServers ?? {}), [SERVER_NAME]: resolved };
    if (withAngularCli) {
      mcpServers[ANGULAR_CLI_NAME] = angularCliServerEntry(npxCommand);
    }
    return { ...existing, mcpServers };
  });
  console.log("Restart Claude Desktop after editing:", configPath);
}

function writeIfMissing(path, content) {
  if (existsSync(path)) {
    console.log("Skip (exists)", path);
    return false;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf-8");
  console.log("Wrote", path);
  return true;
}

function mergePackageJsonGitConventions(target) {
  const pkgPath = join(target, "package.json");
  if (!existsSync(pkgPath)) {
    console.warn("No package.json at target — skip git-convention dependency merge");
    return;
  }

  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  pkg.scripts = {
    ...(pkg.scripts ?? {}),
    prepare: pkg.scripts?.prepare ?? "husky",
    "lint:commit": pkg.scripts?.["lint:commit"] ?? "commitlint --last --verbose",
    "lint:branch": pkg.scripts?.["lint:branch"] ?? "node scripts/check-branch-name.mjs",
  };
  pkg.devDependencies = {
    ...(pkg.devDependencies ?? {}),
    "@commitlint/cli": pkg.devDependencies?.["@commitlint/cli"] ?? "^19.8.1",
    "@commitlint/config-conventional":
      pkg.devDependencies?.["@commitlint/config-conventional"] ?? "^19.8.1",
    husky: pkg.devDependencies?.husky ?? "^9.1.7",
  };
  writeJson(pkgPath, pkg);
  console.log("Merged git-convention scripts/devDependencies into package.json");
}

function installGitConventions(target) {
  const branchScript = `#!/usr/bin/env node
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

  const commitlint = `/** @type {import('@commitlint/types').UserConfig} */
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

  const contributing = `# Contributing

Branch and commit names follow **ai-mosaic** git conventions.

## Branches

\`<type>/<short-kebab-description>\`

Types: feat | fix | chore | docs | refactor | test | ci | release

## Commits

\`<type>(optional-scope): <imperative summary>\`

No trailing period. Subject ≤ 72 characters.

## Enforcement

- Local: husky \`commit-msg\` + \`pre-push\` (run \`npm install\`)
- CI: GitHub Actions workflow **Conventions**
- Agents: MCP \`validate_branch_name\`, \`validate_commit_message\`, \`get_git_conventions\`
`;

  const workflow = `name: Conventions

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

  writeIfMissing(join(target, "CONTRIBUTING.md"), contributing);
  writeIfMissing(join(target, "commitlint.config.cjs"), commitlint);
  writeIfMissing(join(target, "scripts/check-branch-name.mjs"), branchScript);
  writeIfMissing(join(target, ".husky/commit-msg"), `#!/usr/bin/env sh\nnpx --no -- commitlint --edit "$1"\n`);
  writeIfMissing(
    join(target, ".husky/pre-push"),
    `#!/usr/bin/env sh\nbranch="$(git branch --show-current)"\nnode "$(dirname -- "$0")/../scripts/check-branch-name.mjs" "$branch"\n`
  );
  writeIfMissing(join(target, ".github/workflows/conventions.yml"), workflow);
  mergePackageJsonGitConventions(target);
  console.log("Git conventions installed. Run npm install to activate husky hooks.");
}

function installInstructions(target, packageRoot) {
  const templatesDir = join(packageRoot, "templates");
  if (!existsSync(templatesDir)) return;

  const githubDir = join(target, ".github");
  mkdirSync(githubDir, { recursive: true });

  for (const file of ["AGENTS.md", "CLAUDE.md", "copilot-instructions.md"]) {
    const dest = join(target, file);
    if (existsSync(dest)) continue;
    const src = join(templatesDir, file);
    if (existsSync(src)) cpSync(src, dest);
  }

  const instructionsDir = join(githubDir, "instructions");
  mkdirSync(instructionsDir, { recursive: true });
  const angularInstructions = join(templatesDir, "angular.instructions.md");
  const destInstructions = join(instructionsDir, "angular.instructions.md");
  if (existsSync(angularInstructions) && !existsSync(destInstructions)) {
    cpSync(angularInstructions, destInstructions);
  }

  console.log("Wrote instruction files (skipped existing project-specific files)");
}

function expandHosts(host) {
  const map = {
    all: ["cursor", "copilot", "claude-code"],
    copilot: ["copilot"],
    vscode: ["copilot"],
    cursor: ["cursor"],
    "claude-code": ["claude-code"],
    "claude-desktop": ["claude-desktop"],
  };
  return map[host] ?? [host];
}

const PACKAGE_ROOT = resolvePackageRoot();
const args = parseArgs(process.argv);
const { target, host, mode, nodeCommand, npxCommand, skipInstructions, withAngularCli, withGitConventions } =
  args;
const { mode: resolvedMode, server } = resolveServerConfig(mode, PACKAGE_ROOT, target, nodeCommand, npxCommand);
const hosts = expandHosts(host);

for (const h of hosts) {
  switch (h) {
    case "cursor":
      setupCursor(target, server, withAngularCli, npxCommand);
      break;
    case "copilot":
      setupVsCodeCopilot(target, server, withAngularCli, npxCommand);
      if (!skipInstructions) installInstructions(target, PACKAGE_ROOT);
      break;
    case "claude-code":
      setupClaudeCode(target, server, withAngularCli, npxCommand);
      if (!skipInstructions) installInstructions(target, PACKAGE_ROOT);
      break;
    case "claude-desktop":
      setupClaudeDesktop(server, nodeCommand, npxCommand, resolvedMode, PACKAGE_ROOT, target, withAngularCli);
      break;
    default:
      console.error("Unknown host:", h);
      process.exit(1);
  }
}

if (withGitConventions) {
  installGitConventions(target);
}

console.log(`
Done (${resolvedMode} mode).

MCP: ai-mosaic${withAngularCli ? " + angular-cli" : ""}${withGitConventions ? " + git-conventions" : ""}

ai-mosaic workflows:
  • PR review         — review_pr_diff, scan_violations, review_architecture
  • Scaffolding       — generate_feature, generate_component, generate_story, apply_changes
  • Modernization     — audit_modernization, plan_refactor
  • Git conventions   — get_git_conventions, validate_branch_name, validate_commit_message
  • Optional CLI      — run_angular_target (lint/test/build)

Project config: ai-mosaic.config.json (optional)
${withGitConventions ? "\nNext: npm install (husky) and protect main with the Conventions check.\n" : ""}`);
