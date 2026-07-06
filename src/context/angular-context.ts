import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export interface AngularContext {
  workspaceRoot: string;
  angularVersion: string | null;
  angularMajor: number | null;
  supported: boolean;
  projects: string[];
  hasStorybook: boolean;
  storybookVersion: string | null;
  zoneless: boolean;
  standaloneDefault: boolean;
  profileKey: string;
  warnings: string[];
}

const MIN_MAJOR = 19;

function readJson(path: string): unknown | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function parseVersion(raw: string | undefined): { full: string; major: number } | null {
  if (!raw) return null;
  const match = raw.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return { full: match[0], major: Number.parseInt(match[1], 10) };
}

function detectStorybook(root: string): { has: boolean; version: string | null } {
  const pkg = readJson(join(root, "package.json")) as Record<string, unknown> | null;
  if (!pkg) return { has: false, version: null };

  const deps = {
    ...(pkg.dependencies as Record<string, string> | undefined),
    ...(pkg.devDependencies as Record<string, string> | undefined),
  };

  const storybookPkg =
    deps["@storybook/angular"] ?? deps["storybook"] ?? deps["@storybook/core"];
  if (!storybookPkg) return { has: false, version: null };

  const version = parseVersion(storybookPkg.replace(/^[\^~]/, ""));
  return { has: true, version: version?.full ?? storybookPkg };
}

function listProjects(angularJson: Record<string, unknown>): string[] {
  const projects = angularJson.projects as Record<string, unknown> | undefined;
  if (!projects) return [];
  return Object.keys(projects);
}

function walkForFile(root: string, name: string, depth = 0): string | null {
  if (depth > 4) return null;
  let entries: string[];
  try {
    entries = readdirSync(root);
  } catch {
    return null;
  }

  for (const entry of entries) {
    if (entry === "node_modules" || entry === "dist" || entry === ".git") continue;
    const full = join(root, entry);
    if (entry === name) return full;
    try {
      if (statSync(full).isDirectory()) {
        const found = walkForFile(full, name, depth + 1);
        if (found) return found;
      }
    } catch {
      /* skip */
    }
  }
  return null;
}

export function detectAngularContext(workspaceRoot: string): AngularContext {
  const warnings: string[] = [];
  const pkg = readJson(join(workspaceRoot, "package.json")) as Record<string, unknown> | null;
  const angularJson = readJson(join(workspaceRoot, "angular.json")) as Record<string, unknown> | null;

  const deps = {
    ...(pkg?.dependencies as Record<string, string> | undefined),
    ...(pkg?.devDependencies as Record<string, string> | undefined),
  };

  const coreVersion = parseVersion(deps["@angular/core"]?.replace(/^[\^~]/, ""));
  const angularMajor = coreVersion?.major ?? null;
  const supported = angularMajor !== null && angularMajor >= MIN_MAJOR;

  if (angularMajor !== null && angularMajor < MIN_MAJOR) {
    warnings.push(`Angular ${angularMajor} detected. ai-mosaic supports v${MIN_MAJOR}+ only.`);
  }

  const storybook = detectStorybook(workspaceRoot);
  const projects = angularJson ? listProjects(angularJson) : [];

  const zonelessHint =
    existsSync(join(workspaceRoot, "src", "zoneless.ts")) ||
    walkForFile(workspaceRoot, "app.config.ts") !== null;

  let profileKey = "v21";
  if (angularMajor !== null) {
    if (angularMajor <= 19) profileKey = "v19";
    else if (angularMajor === 20) profileKey = "v20";
    else profileKey = "v21";
  }

  return {
    workspaceRoot,
    angularVersion: coreVersion?.full ?? null,
    angularMajor,
    supported,
    projects,
    hasStorybook: storybook.has,
    storybookVersion: storybook.version,
    zoneless: zonelessHint,
    standaloneDefault: angularMajor !== null && angularMajor >= 19,
    profileKey,
    warnings,
  };
}

export function formatContext(ctx: AngularContext): string {
  const lines = [
    `# Angular Workspace Context`,
    ``,
    `| Field | Value |`,
    `|-------|-------|`,
    `| Workspace | ${ctx.workspaceRoot} |`,
    `| Angular | ${ctx.angularVersion ?? "unknown"} (major ${ctx.angularMajor ?? "?"}) |`,
    `| Supported | ${ctx.supported ? "yes" : "no — minimum v19"} |`,
    `| Profile | ${ctx.profileKey} |`,
    `| Projects | ${ctx.projects.length ? ctx.projects.join(", ") : "none detected"} |`,
    `| Storybook | ${ctx.hasStorybook ? `yes (${ctx.storybookVersion})` : "not detected"} |`,
    `| Zoneless hints | ${ctx.zoneless ? "possible" : "not detected"} |`,
    `| Standalone default | ${ctx.standaloneDefault ? "expected for new code" : "legacy patterns tolerated"} |`,
  ];

  if (ctx.warnings.length) {
    lines.push("", "## Warnings", ...ctx.warnings.map((w) => `- ${w}`));
  }

  return lines.join("\n");
}
