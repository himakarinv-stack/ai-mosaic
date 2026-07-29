import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { AngularContext } from "../context/angular-context.js";
import type { MosaicConfig } from "../context/config.js";
import {
  scanSource,
  formatViolations,
  reviewArchitectureNotes,
  type Violation,
} from "./scanner.js";

export interface FileFinding {
  filePath: string;
  violations: Violation[];
}

export interface AuditReport {
  workspaceRoot: string;
  changedFiles: string[];
  findings: FileFinding[];
  architectureNotes: string;
  summary: {
    blockers: number;
    high: number;
    medium: number;
    low: number;
    filesScanned: number;
  };
}

const SCAN_EXT = /\.(ts|html|scss|css)$/i;

export function auditChangedFiles(
  workspaceRoot: string,
  changedFiles: string[],
  ctx: AngularContext,
  config: MosaicConfig,
  fileContents?: Record<string, string>
): AuditReport {
  const findings: FileFinding[] = [];
  let blockers = 0;
  let high = 0;
  let medium = 0;
  let low = 0;

  for (const rel of changedFiles) {
    const normalized = rel.replace(/\\/g, "/");
    if (!SCAN_EXT.test(normalized) && !normalized.includes(".stories.")) continue;

    let source = fileContents?.[rel] ?? fileContents?.[normalized];
    if (source == null) {
      const full = join(workspaceRoot, rel);
      if (!existsSync(full)) continue;
      try {
        source = readFileSync(full, "utf-8");
      } catch {
        continue;
      }
    }

    const violations = scanSource(source, normalized, ctx, config);
    for (const v of violations) {
      if (v.severity === "BLOCKER") blockers++;
      else if (v.severity === "HIGH") high++;
      else if (v.severity === "MEDIUM") medium++;
      else low++;
    }
    findings.push({ filePath: normalized, violations });
  }

  return {
    workspaceRoot,
    changedFiles,
    findings,
    architectureNotes: reviewArchitectureNotes(changedFiles),
    summary: {
      blockers,
      high,
      medium,
      low,
      filesScanned: findings.length,
    },
  };
}

export function formatAuditReport(report: AuditReport): string {
  const lines: string[] = [
    `# ai-mosaic audit feedback`,
    ``,
    `Workspace: \`${report.workspaceRoot}\``,
    `Files scanned: **${report.summary.filesScanned}**`,
    `Blockers: **${report.summary.blockers}** · High: **${report.summary.high}** · Medium: **${report.summary.medium}** · Low: **${report.summary.low}**`,
    ``,
    `## How to use this feedback`,
    `1. Fix **BLOCKER/HIGH** before merge.`,
    `2. Address **MEDIUM** in this PR when feasible.`,
    `3. Track **LOW** as follow-ups.`,
    `4. Align with ai-mosaic domains: modern-angular, rxjs, html-css, accessibility, storybook, tooling-lint.`,
    ``,
    report.architectureNotes,
    ``,
    `## Findings by file`,
  ];

  if (!report.findings.length) {
    lines.push(``, `_No matching Angular/TS/HTML/SCSS files scanned or no heuristic hits._`);
  }

  for (const f of report.findings) {
    lines.push(``, `### \`${f.filePath}\``);
    if (!f.violations.length) lines.push(`- No heuristic violations.`);
    else lines.push(formatViolations(f.violations));
  }

  lines.push(
    ``,
    `## Suggested agent next steps`,
    `- Call \`get_pr_review_brief\` and write a human review using review-format.`,
    `- Call \`get_review_sections_for_diff\` for changed extensions.`,
    `- Call \`plan_refactor\` for BLOCKER/HIGH items that need a multi-step fix.`
  );

  return lines.join("\n");
}
