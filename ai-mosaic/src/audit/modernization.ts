import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import type { MosaicConfig } from "../context/config.js";
import { collectSourceFiles } from "../standards/loader.js";
import { scanSource, formatViolations } from "../review/scanner.js";
import type { AngularContext } from "../context/angular-context.js";

export interface AuditFinding {
  category: string;
  count: number;
  examples: string[];
}

export interface ModernizationAudit {
  summary: string;
  findings: AuditFinding[];
  priorities: string[];
  storybookGaps: string[];
}

const LEGACY_MARKERS: Array<{ category: string; pattern: RegExp; action: string }> = [
  { category: "Control flow", pattern: /\*ng(If|For|Switch)\b/, action: "Migrate to @if / @for / @switch" },
  { category: "Component API", pattern: /@Input\(\)|@Output\(\)/, action: "Migrate to input()/output()" },
  { category: "Change detection", pattern: /@Component[\s\S]*?(?!OnPush)/, action: "Add ChangeDetectionStrategy.OnPush" },
  { category: "NgModule", pattern: /@NgModule\s*\(/, action: "Convert to standalone; lazy-load via loadComponent" },
  { category: "RxJS", pattern: /\.subscribe\s*\(/, action: "Use async pipe, signals, or takeUntilDestroyed" },
  { category: "Zone coupling", pattern: /NgZone|zone\.run/, action: "Remove zone triggers; use signals/effects" },
];

export function runModernizationAudit(
  ctx: AngularContext,
  config: MosaicConfig,
  scanPath: string
): ModernizationAudit {
  const files = collectSourceFiles(ctx.workspaceRoot, scanPath, config);
  const categoryCounts = new Map<string, { count: number; examples: string[]; action: string }>();

  for (const file of files) {
    let source: string;
    try {
      source = readFileSync(file, "utf-8");
    } catch {
      continue;
    }

    const rel = file.replace(ctx.workspaceRoot, "").replace(/^[/\\]/, "");

    for (const marker of LEGACY_MARKERS) {
      if (marker.pattern.test(source)) {
        const entry = categoryCounts.get(marker.category) ?? {
          count: 0,
          examples: [],
          action: marker.action,
        };
        entry.count += 1;
        if (entry.examples.length < 5) entry.examples.push(rel);
        categoryCounts.set(marker.category, entry);
      }
    }

    if (file.endsWith(".component.ts") && !source.includes(".stories.")) {
      const storyPath = file.replace(".component.ts", ".stories.ts");
      const hasStory = files.some((f) => f.endsWith(storyPath.split(/[/\\]/).pop() ?? ""));
      if (ctx.hasStorybook && !hasStory && !rel.includes(".container.")) {
        /* tracked separately */
      }
    }
  }

  const violations = files.flatMap((file) => {
    try {
      const source = readFileSync(file, "utf-8");
      const rel = file.replace(ctx.workspaceRoot, "").replace(/^[/\\]/, "");
      return scanSource(source, rel, ctx, config);
    } catch {
      return [];
    }
  });

  const findings: AuditFinding[] = [...categoryCounts.entries()].map(([category, data]) => ({
    category,
    count: data.count,
    examples: data.examples,
  }));

  const priorities = [...categoryCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([cat, data]) => `${cat} (${data.count} files): ${data.action}`);

  const storybookGaps: string[] = [];
  if (ctx.hasStorybook) {
    const components = files.filter((f) => f.endsWith(".component.ts") && !f.includes(".stories."));
    for (const comp of components.slice(0, 50)) {
      const story = comp.replace(".component.ts", ".stories.ts");
      if (!files.includes(story)) {
        storybookGaps.push(comp.replace(ctx.workspaceRoot, "").replace(/^[/\\]/, ""));
      }
    }
  }

  const summary = [
    `# Modernization Audit`,
    ``,
    `Profile: **${ctx.profileKey}** | Angular **${ctx.angularVersion ?? "?"}**`,
    `Scanned: **${files.length}** files under \`${scanPath}\``,
    `Heuristic violations: **${violations.length}**`,
    ``,
    violations.length
      ? formatViolations(violations.slice(0, 20))
      : "No heuristic violations in sample.",
  ].join("\n");

  return { summary, findings, priorities, storybookGaps: storybookGaps.slice(0, 15) };
}

export function formatAudit(audit: ModernizationAudit): string {
  const lines = [audit.summary, "", "## Findings by category"];

  if (!audit.findings.length) {
    lines.push("No legacy markers detected in scanned scope.");
  } else {
    for (const f of audit.findings) {
      lines.push(`\n### ${f.category} (${f.count})`);
      lines.push(...f.examples.map((e) => `- ${e}`));
    }
  }

  lines.push("", "## Migration priorities (ordered)");
  lines.push(...audit.priorities.map((p, i) => `${i + 1}. ${p}`));

  if (audit.storybookGaps.length) {
    lines.push("", "## Storybook gaps (components without stories)");
    lines.push(...audit.storybookGaps.map((g) => `- ${g}`));
  }

  lines.push(
    "",
    "## Next steps",
    "1. Call `plan_refactor` for highest-count category",
    "2. Use `generate_story` for Storybook gaps on presentational components",
    "3. Optional: `run_angular_target` with target `lint` or `@angular/cli mcp` modernize"
  );

  return lines.join("\n");
}

export function runAngularTarget(
  workspaceRoot: string,
  config: MosaicConfig,
  target: string,
  project?: string
): string {
  if (!config.cliBridge.enabled) {
    return "CLI bridge disabled in ai-mosaic.config.json (cliBridge.enabled: false).";
  }

  const args = ["run", project ?? config.cliBridge.defaultProject ?? "", target].filter(Boolean);
  if (!project && !config.cliBridge.defaultProject) {
    args.splice(1, 0, "");
    const result = spawnSync("npx", ["ng", "run", target], {
      cwd: workspaceRoot,
      encoding: "utf-8",
      shell: true,
    });
    return formatCliResult(result.stdout, result.stderr, result.status);
  }

  const result = spawnSync("npx", ["ng", ...args], {
    cwd: workspaceRoot,
    encoding: "utf-8",
    shell: true,
  });

  return formatCliResult(result.stdout, result.stderr, result.status);
}

function formatCliResult(stdout: string, stderr: string, status: number | null): string {
  return [
    `# Angular CLI Result (exit ${status ?? "?"})`,
    "",
    stdout || "(no stdout)",
    stderr ? `\n## stderr\n${stderr}` : "",
  ].join("\n");
}
