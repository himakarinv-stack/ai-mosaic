#!/usr/bin/env node
/**
 * Install ai-mosaic MCP + host-specific instructions into an Angular workspace.
 *
 * Usage:
 *   npx ai-mosaic-setup --target /path/to/angular-app
 *   npx ai-mosaic-setup --host cursor|copilot|claude-code|all
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { platform } from "node:os";

const SERVER_NAME = "ai-mosaic";
const NPM_PACKAGE = "ai-mosaic";

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
    mode: "npx",
    nodeCommand: "node",
    npxCommand: "npx",
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--target" && argv[i + 1]) args.target = resolve(argv[++i]);
    else if (arg === "--host" && argv[i + 1]) args.host = argv[++i];
    else if (arg === "--local") args.mode = "local";
    else if (arg === "--node" && argv[i + 1]) args.nodeCommand = argv[++i];
    else if (arg === "--npx" && argv[i + 1]) args.npxCommand = argv[++i];
    else if (arg === "--help") {
      console.log(`
ai-mosaic-setup — install MCP for Cursor, GitHub Copilot, Claude Code

Options:
  --target   Angular workspace root (default: cwd)
  --host     cursor | copilot | claude-code | claude-desktop | all
  --local    Use local dist/ instead of npx
  --node     Node executable for --local
  --npx      npx executable for published package

Examples:
  npx ai-mosaic-setup --target ./my-angular-app
  npx ai-mosaic-setup --host cursor
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

function npxServerEntry(npxCommand) {
  return { command: npxCommand, args: ["-y", NPM_PACKAGE] };
}

function localServerEntry(packageRoot, nodeCommand) {
  const entry = join(packageRoot, "dist/index.js").replace(/\\/g, "/");
  const standards = join(packageRoot, "standards").replace(/\\/g, "/");
  return {
    command: nodeCommand,
    args: [entry],
    env: { AI_MOSAIC_ROOT: standards },
  };
}

function resolveServerConfig(mode, packageRoot, nodeCommand, npxCommand) {
  if (mode === "local") {
    const entry = join(packageRoot, "dist/index.js");
    if (!existsSync(entry)) {
      console.error("Local MCP not built. Run: npm install && npm run build");
      process.exit(1);
    }
    return localServerEntry(packageRoot, nodeCommand);
  }
  return npxServerEntry(npxCommand);
}

function setupCursor(target, server) {
  mergeJson(join(target, ".cursor/mcp.json"), (existing) => ({
    mcpServers: { ...(existing.mcpServers ?? {}), [SERVER_NAME]: server },
  }));
}

function setupVsCodeCopilot(target, server) {
  mergeJson(join(target, ".vscode/mcp.json"), (existing) => ({
    servers: {
      ...(existing.servers ?? {}),
      [SERVER_NAME]: { type: "stdio", ...server },
    },
  }));
}

function setupClaudeCode(target, server) {
  mergeJson(join(target, ".mcp.json"), (existing) => ({
    mcpServers: {
      ...(existing.mcpServers ?? {}),
      [SERVER_NAME]: { type: "stdio", ...server },
    },
  }));
}

function setupClaudeDesktop(server, nodeCommand, npxCommand, mode, packageRoot) {
  const configPaths = {
    win32: join(process.env.APPDATA ?? "", "Claude", "claude_desktop_config.json"),
    darwin: join(process.env.HOME ?? "", "Library/Application Support/Claude/claude_desktop_config.json"),
    linux: join(process.env.HOME ?? "", ".config/Claude/claude_desktop_config.json"),
  };
  const configPath = configPaths[platform()] ?? configPaths.linux;
  const desktopServer =
    mode === "npx" ? npxServerEntry(npxCommand) : localServerEntry(packageRoot, nodeCommand);

  mergeJson(configPath, (existing) => ({
    ...existing,
    mcpServers: { ...(existing.mcpServers ?? {}), [SERVER_NAME]: desktopServer },
  }));
  console.log("Restart Claude Desktop after editing:", configPath);
}

function installInstructions(target, packageRoot) {
  const templatesDir = join(packageRoot, "templates");
  if (!existsSync(templatesDir)) return;

  const githubDir = join(target, ".github");
  mkdirSync(githubDir, { recursive: true });

  for (const file of ["AGENTS.md", "CLAUDE.md", "copilot-instructions.md"]) {
    const src = join(templatesDir, file);
    if (existsSync(src)) cpSync(src, join(target, file));
  }

  const instructionsDir = join(githubDir, "instructions");
  mkdirSync(instructionsDir, { recursive: true });
  const angularInstructions = join(templatesDir, "angular.instructions.md");
  if (existsSync(angularInstructions)) {
    cpSync(angularInstructions, join(instructionsDir, "angular.instructions.md"));
  }

  console.log("Wrote instruction files (AGENTS.md, CLAUDE.md, copilot-instructions.md)");
}

function expandHosts(host) {
  const map = {
    all: ["cursor", "copilot", "claude-code", "claude-desktop"],
    copilot: ["copilot"],
    vscode: ["copilot"],
    cursor: ["cursor"],
    "claude-code": ["claude-code"],
    "claude-desktop": ["claude-desktop"],
  };
  return map[host] ?? [host];
}

const PACKAGE_ROOT = resolvePackageRoot();
const { target, host, mode, nodeCommand, npxCommand } = parseArgs(process.argv);
const server = resolveServerConfig(mode, PACKAGE_ROOT, nodeCommand, npxCommand);
const hosts = expandHosts(host);

for (const h of hosts) {
  switch (h) {
    case "cursor":
      setupCursor(target, server);
      break;
    case "copilot":
      setupVsCodeCopilot(target, server);
      installInstructions(target, PACKAGE_ROOT);
      break;
    case "claude-code":
      setupClaudeCode(target, server);
      installInstructions(target, PACKAGE_ROOT);
      break;
    case "claude-desktop":
      setupClaudeDesktop(server, nodeCommand, npxCommand, mode, PACKAGE_ROOT);
      break;
    default:
      console.error("Unknown host:", h);
      process.exit(1);
  }
}

console.log(`
Done (${mode} mode).

ai-mosaic v1 workflows:
  • PR review      — review_pr_diff, scan_violations, review_architecture
  • Scaffolding    — generate_feature, generate_component, generate_story, apply_changes
  • Modernization  — audit_modernization, plan_refactor
  • Optional CLI   — run_angular_target (lint/test/build)

Also run @angular/cli mcp alongside for ng build, docs, and migrations.

Optional: copy ai-mosaic.config.example.json → ai-mosaic.config.json to tune per project.
`);
