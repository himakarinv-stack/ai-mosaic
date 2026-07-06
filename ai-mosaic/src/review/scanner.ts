import type { AngularContext } from "../context/angular-context.js";
import type { MosaicConfig } from "../context/config.js";

export type ViolationSeverity = "BLOCKER" | "HIGH" | "MEDIUM" | "LOW";

export interface Violation {
  severity: ViolationSeverity;
  rule: string;
  message: string;
  filePath: string;
}

interface RuleCheck {
  id: string;
  pattern: RegExp;
  message: string;
  severity: ViolationSeverity;
  minMajor?: number;
  maxMajor?: number;
  fileTypes?: string[];
}

const BASE_RULES: RuleCheck[] = [
  {
    id: "legacy-ngif",
    pattern: /\*ngIf\b/,
    message: "Legacy *ngIf — use @if control flow",
    severity: "HIGH",
    minMajor: 19,
    fileTypes: [".html", ".ts"],
  },
  {
    id: "legacy-ngfor",
    pattern: /\*ngFor\b/,
    message: "Legacy *ngFor — use @for with stable track",
    severity: "HIGH",
    minMajor: 19,
    fileTypes: [".html", ".ts"],
  },
  {
    id: "legacy-ngswitch",
    pattern: /\*ngSwitch\b/,
    message: "Legacy *ngSwitch — use @switch",
    severity: "HIGH",
    minMajor: 19,
    fileTypes: [".html", ".ts"],
  },
  {
    id: "default-cd",
    pattern: /ChangeDetectionStrategy\.Default/,
    message: "Default change detection — require OnPush",
    severity: "HIGH",
    fileTypes: [".ts"],
  },
  {
    id: "legacy-io",
    pattern: /@Input\(\)|@Output\(\)/,
    message: "Legacy @Input/@Output — prefer input()/output() for new APIs",
    severity: "MEDIUM",
    minMajor: 19,
    fileTypes: [".ts"],
  },
  {
    id: "manual-subscribe",
    pattern: /\.subscribe\s*\(/,
    message: "Manual subscribe — prefer async pipe, signals, or takeUntilDestroyed",
    severity: "MEDIUM",
    fileTypes: [".ts"],
  },
  {
    id: "subs-sink",
    pattern: /subs\.sink|Subscription\[\]|new Subscription\(\)/,
    message: "Manual subscription aggregation anti-pattern",
    severity: "HIGH",
    fileTypes: [".ts"],
  },
  {
    id: "any-usage",
    pattern: /:\s*any\b|<any>|as any/,
    message: "Unsafe any usage — tighten types",
    severity: "MEDIUM",
    fileTypes: [".ts"],
  },
  {
    id: "inner-html",
    pattern: /\[innerHTML\]/,
    message: "innerHTML binding — verify sanitization and trust boundary",
    severity: "HIGH",
    fileTypes: [".html", ".ts"],
  },
  {
    id: "div-click",
    pattern: /<div[^>]*\(click\)=/,
    message: "Click on div — use button or full a11y keyboard contract",
    severity: "HIGH",
    fileTypes: [".html", ".ts"],
  },
  {
    id: "side-effect-map",
    pattern: /\.pipe\([^)]*map\([^)]*\{[^}]*(this\.|dispatch|console\.)/s,
    message: "Possible side effect inside map() — use tap() or effect",
    severity: "HIGH",
    fileTypes: [".ts"],
  },
  {
    id: "story-missing-meta",
    pattern: /export default\s*\{/,
    message: "Story file should use Meta/StoryObj typed exports",
    severity: "MEDIUM",
    fileTypes: ["stories"],
  },
  {
    id: "story-no-title",
    pattern: /(?!.*\btitle\s*:)/s,
    message: "Story meta missing title — required for Storybook navigation",
    severity: "LOW",
    fileTypes: ["stories"],
  },
];

function fileType(filePath: string): string {
  if (filePath.includes(".stories.")) return "stories";
  const ext = filePath.slice(filePath.lastIndexOf("."));
  return ext;
}

function applies(rule: RuleCheck, ctx: AngularContext, filePath: string): boolean {
  const ft = fileType(filePath);
  if (rule.fileTypes && !rule.fileTypes.includes(ft)) return false;
  if (ctx.angularMajor === null) return true;
  if (rule.minMajor !== undefined && ctx.angularMajor < rule.minMajor) return false;
  if (rule.maxMajor !== undefined && ctx.angularMajor > rule.maxMajor) return false;
  return true;
}

function bumpSeverity(severity: ViolationSeverity, config: MosaicConfig, ruleId: string): ViolationSeverity {
  if (config.strictRules.includes(ruleId)) return "BLOCKER";
  if (config.severity === "minimal" && severity !== "BLOCKER") {
    return severity === "HIGH" ? "MEDIUM" : "LOW";
  }
  if (config.severity === "strict" && severity === "MEDIUM") return "HIGH";
  return severity;
}

export function scanSource(
  source: string,
  filePath: string,
  ctx: AngularContext,
  config: MosaicConfig
): Violation[] {
  const violations: Violation[] = [];

  for (const rule of BASE_RULES) {
    if (!applies(rule, ctx, filePath)) continue;
    if (rule.pattern.test(source)) {
      violations.push({
        severity: bumpSeverity(rule.severity, config, rule.id),
        rule: rule.id,
        message: rule.message,
        filePath,
      });
    }
  }

  if (filePath.endsWith(".ts") && source.includes("@Component") && !source.includes("ChangeDetectionStrategy.OnPush")) {
    violations.push({
      severity: bumpSeverity("HIGH", config, "missing-onpush"),
      rule: "missing-onpush",
      message: "Component missing ChangeDetectionStrategy.OnPush",
      filePath,
    });
  }

  if (source.includes("@for") && !source.includes("track ")) {
    violations.push({
      severity: bumpSeverity("HIGH", config, "missing-track"),
      rule: "missing-track",
      message: "@for missing stable track expression",
      filePath,
    });
  }

  if (/template:\s*`[\s\S]{3000,}/.test(source)) {
    violations.push({
      severity: "MEDIUM",
      rule: "large-inline-template",
      message: "Inline template exceeds ~3000 chars — extract presentational components",
      filePath,
    });
  }

  if (filePath.includes(".stories.") && config.storybook.requireAutodocs) {
    if (!source.includes("tags:") || !source.includes("autodocs")) {
      violations.push({
        severity: "MEDIUM",
        rule: "story-no-autodocs",
        message: "Story missing tags: ['autodocs'] — enable autodocs for design-system components",
        filePath,
      });
    }
    if (!source.includes("argTypes") && !source.includes("args:")) {
      violations.push({
        severity: "LOW",
        rule: "story-no-controls",
        message: "Story missing args/argTypes — add controls for interactive documentation",
        filePath,
      });
    }
  }

  return violations;
}

export function formatViolations(violations: Violation[]): string {
  if (!violations.length) {
    return "No heuristic violations detected. Run architecture review for structural issues.";
  }

  return violations
    .map((v, i) => `${i + 1}. [${v.severity}] (${v.rule}) ${v.filePath}\n   ${v.message}`)
    .join("\n\n");
}

export function reviewArchitectureNotes(changedFiles: string[]): string {
  const hasFeature = changedFiles.some((f) => f.includes("/features/") || f.includes("\\features\\"));
  const hasSharedUi = changedFiles.some((f) => /shared|ui|components/.test(f));
  const notes: string[] = [
    "# Architecture Review Checklist",
    "",
    "Evaluate the diff against these principal-level questions:",
    "",
    "1. **Boundaries** — Does new code respect feature boundaries? Any cross-feature imports?",
    "2. **Layering** — Is orchestration separated from presentation?",
    "3. **Coupling** — Are services feature-scoped? Any shared mutable singletons?",
    "4. **Public API** — Do feature folders expose a narrow index/barrel?",
    "5. **State flow** — Single source of truth? No duplicated store + component state?",
    "6. **Testability** — Can presentational pieces render in Storybook without the app shell?",
    "7. **Version fit** — Patterns match detected Angular major profile?",
  ];

  if (hasFeature) notes.push("", "> Diff touches feature code — verify folder cohesion and routing boundaries.");
  if (hasSharedUi) notes.push("", "> Diff touches shared UI — verify Storybook coverage and stable @Input/signal API.");

  return notes.join("\n");
}

export function reviewPrDiff(changedFiles: string[], extensions: string[]): string {
  return [
    "# PR Review Workflow",
    "",
    `Changed files (${changedFiles.length}):`,
    ...changedFiles.map((f) => `- ${f}`),
    "",
    `Extensions: ${extensions.join(", ") || "none"}`,
    "",
    "## Steps",
    "1. Call `get_review_sections_for_diff` with extensions",
    "2. Run `scan_violations` on each .ts/.html/.stories file",
    "3. Apply `review_architecture` checklist",
    "4. Output findings using review-format severity classes",
    "5. For BLOCKER/HIGH — provide fix snippet or plan_refactor steps",
  ].join("\n");
}
