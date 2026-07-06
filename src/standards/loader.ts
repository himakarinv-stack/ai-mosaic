import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { AngularContext } from "../context/angular-context.js";
import type { MosaicConfig } from "../context/config.js";

export type QualityDomain =
  | "architecture"
  | "modern-angular"
  | "rxjs"
  | "typescript"
  | "performance"
  | "accessibility"
  | "security"
  | "testing"
  | "storybook"
  | "review-format"
  | "anti-patterns"
  | "scaffolding"
  | "modernization";

const SHARED_FILES: Partial<Record<QualityDomain, string>> = {
  architecture: "shared/01-architecture.md",
  rxjs: "shared/03-rxjs.md",
  typescript: "shared/02-typescript.md",
  performance: "shared/04-performance.md",
  accessibility: "shared/05-accessibility.md",
  security: "shared/06-security.md",
  testing: "shared/07-testing.md",
  "review-format": "shared/08-review-format.md",
  "anti-patterns": "shared/09-anti-patterns.md",
  scaffolding: "shared/10-scaffolding.md",
  modernization: "shared/11-modernization.md",
  storybook: "storybook/01-storybook-standards.md",
};

const PROFILE_MODERN: Record<string, string> = {
  v19: "profiles/v19/modern-angular.md",
  v20: "profiles/v20/modern-angular.md",
  v21: "profiles/v21/modern-angular.md",
};

export const DOMAIN_SUMMARIES: Record<QualityDomain, string> = {
  architecture: "Layering, boundaries, smart/presentational, feature design",
  "modern-angular": "Signals, OnPush, control flow — version-specific rules",
  rxjs: "Stream composition, subscription hygiene, no side effects in operators",
  typescript: "Strict typing, domain models, immutability",
  performance: "Stable bindings, track, defer, bundle-conscious imports",
  accessibility: "Semantic HTML, keyboard, ARIA, focus management",
  security: "XSS, sanitization, safe templates, secrets",
  testing: "Behavior-focused tests, state matrix coverage",
  storybook: "Stories, autodocs, controls, isolated presentational components",
  "review-format": "PR review output structure and severity classes",
  "anti-patterns": "Consolidated reject list for reviews and audits",
  scaffolding: "Feature and component generation conventions",
  modernization: "Audit checklist and migration priorities by version",
};

export function readGuide(
  standardsDir: string,
  domain: QualityDomain,
  profileKey: string
): string {
  if (domain === "modern-angular") {
    const rel = PROFILE_MODERN[profileKey] ?? PROFILE_MODERN.v21;
    return readFile(standardsDir, rel);
  }

  const rel = SHARED_FILES[domain];
  if (!rel) throw new Error(`Unknown domain: ${domain}`);
  return readFile(standardsDir, rel);
}

function readFile(standardsDir: string, rel: string): string {
  const filePath = join(standardsDir, rel);
  if (!existsSync(filePath)) {
    throw new Error(`Standards file missing: ${rel}`);
  }
  return readFileSync(filePath, "utf-8");
}

export function domainsForExtensions(extensions: string[], hasStorybook: boolean): QualityDomain[] {
  const domains = new Set<QualityDomain>(["review-format", "anti-patterns"]);
  const ext = extensions.map((e) => e.toLowerCase());

  if (ext.some((e) => [".ts", ".html"].includes(e))) {
    domains.add("architecture");
    domains.add("modern-angular");
    domains.add("rxjs");
    domains.add("typescript");
    domains.add("performance");
    domains.add("accessibility");
    domains.add("testing");
    domains.add("security");
  }

  if (ext.some((e) => e.includes("stories"))) {
    domains.add("storybook");
  }

  if (hasStorybook && ext.some((e) => e === ".ts")) {
    domains.add("storybook");
  }

  if (ext.some((e) => [".scss", ".css"].includes(e))) {
    domains.add("performance");
  }

  return [...domains];
}

export function shouldIgnore(relativePath: string, config: MosaicConfig): boolean {
  return config.ignore.some((pattern: string) => {
    const normalized = pattern.replace(/\*\*/g, "").replace(/\*/g, "");
    return relativePath.includes(normalized.replace(/\//g, ""));
  });
}

export function collectSourceFiles(root: string, subPath: string, config: MosaicConfig): string[] {
  const results: string[] = [];
  const start = join(root, subPath);

  function walk(dir: string): void {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = join(dir, entry);
      const rel = full.slice(root.length + 1).replace(/\\/g, "/");

      if (shouldIgnore(rel, config)) continue;

      let st: ReturnType<typeof statSync>;
      try {
        st = statSync(full);
      } catch {
        continue;
      }

      if (st.isDirectory()) {
        walk(full);
      } else if (/\.(ts|html|scss|css)$/.test(entry) || entry.includes(".stories.")) {
        results.push(full);
      }
    }
  }

  if (existsSync(start)) {
    const st = statSync(start);
    if (st.isFile()) results.push(start);
    else walk(start);
  }

  return results;
}

export function buildReviewBrief(standardsDir: string, profileKey: string): string {
  return [
    readGuide(standardsDir, "review-format", profileKey),
    "",
    "---",
    "",
    readGuide(standardsDir, "anti-patterns", profileKey),
  ].join("\n");
}

export function buildDiffSections(
  standardsDir: string,
  profileKey: string,
  extensions: string[],
  hasStorybook: boolean
): string {
  const domains = domainsForExtensions(extensions, hasStorybook);
  return domains
    .map((d) => `# ${d}\n\n${readGuide(standardsDir, d, profileKey)}`)
    .join("\n\n---\n\n");
}

export function explainPattern(
  standardsDir: string,
  profileKey: string,
  topic: string
): string {
  const normalized = topic.toLowerCase();
  const domainMap: Array<[string, QualityDomain]> = [
    ["signal", "modern-angular"],
    ["onpush", "modern-angular"],
    ["control flow", "modern-angular"],
    ["rxjs", "rxjs"],
    ["subscribe", "rxjs"],
    ["architecture", "architecture"],
    ["layer", "architecture"],
    ["storybook", "storybook"],
    ["story", "storybook"],
    ["a11y", "accessibility"],
    ["accessibility", "accessibility"],
    ["test", "testing"],
    ["security", "security"],
    ["performance", "performance"],
    ["typescript", "typescript"],
    ["scaffold", "scaffolding"],
    ["feature", "scaffolding"],
    ["moderniz", "modernization"],
    ["migrate", "modernization"],
  ];

  const match = domainMap.find(([key]) => normalized.includes(key));
  const domain = match?.[1] ?? "architecture";
  return readGuide(standardsDir, domain, profileKey);
}

export function formatContextSummary(ctx: AngularContext): string {
  return [
    `Profile: ${ctx.profileKey} | Angular ${ctx.angularVersion ?? "?"} | Storybook: ${ctx.hasStorybook ? "yes" : "no"}`,
    ctx.supported
      ? "Rules calibrated for detected Angular major."
      : "WARNING: Project below minimum supported version (19).",
  ].join("\n");
}
