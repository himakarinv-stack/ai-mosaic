#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { resolveStandardsDir } from "./paths.js";
import { detectAngularContext, formatContext } from "./context/angular-context.js";
import { getCapabilityProfile, formatProfile } from "./context/capability-profile.js";
import { loadConfig, explainConfig } from "./context/config.js";
import {
  DOMAIN_SUMMARIES,
  readGuide,
  buildReviewBrief,
  buildDiffSections,
  explainPattern,
  type QualityDomain,
} from "./standards/loader.js";
import {
  scanSource,
  formatViolations,
  reviewArchitectureNotes,
  reviewPrDiff,
} from "./review/scanner.js";
import {
  generateComponent,
  generateFeature,
  generateStory,
  planRefactor,
} from "./codegen/templates.js";
import { applyChanges, formatApplyResult } from "./codegen/apply.js";
import { runModernizationAudit, formatAudit, runAngularTarget } from "./audit/modernization.js";

const STANDARDS_DIR = resolveStandardsDir();

const qualityDomainSchema = z.enum([
  "architecture",
  "modern-angular",
  "rxjs",
  "typescript",
  "performance",
  "accessibility",
  "security",
  "testing",
  "storybook",
  "review-format",
  "anti-patterns",
  "scaffolding",
  "modernization",
] as const);

const server = new McpServer({
  name: "ai-mosaic",
  version: "0.1.1",
});

function resolveWorkspace(workspaceRoot?: string): string {
  return workspaceRoot ?? process.cwd();
}

// ─── Context ───────────────────────────────────────────────────────────────

server.tool(
  "detect_angular_context",
  "Detect Angular version, projects, Storybook, and rule profile for the workspace. Call first.",
  {
    workspaceRoot: z.string().optional().describe("Angular workspace root (default: cwd)"),
  },
  async ({ workspaceRoot }) => {
    const root = resolveWorkspace(workspaceRoot);
    const ctx = detectAngularContext(root);
    return { content: [{ type: "text" as const, text: formatContext(ctx) }] };
  }
);

server.tool(
  "get_capability_profile",
  "Version-specific required, recommended, and deprecated patterns for detected Angular major.",
  {
    workspaceRoot: z.string().optional(),
  },
  async ({ workspaceRoot }) => {
    const ctx = detectAngularContext(resolveWorkspace(workspaceRoot));
    const profile = getCapabilityProfile(ctx.profileKey);
    return { content: [{ type: "text" as const, text: formatProfile(profile) }] };
  }
);

server.tool(
  "explain_project_config",
  "Explain optional ai-mosaic.config.json — per-project tuning (severity, ignores, Storybook, CLI bridge).",
  {},
  async () => ({
    content: [{ type: "text" as const, text: explainConfig() }],
  })
);

// ─── Standards & guidance ────────────────────────────────────────────────

server.tool(
  "list_quality_domains",
  "Index of quality domains. Call first to discover what to fetch (~200 tokens).",
  {},
  async () => ({
    content: [
      {
        type: "text" as const,
        text: Object.entries(DOMAIN_SUMMARIES)
          .map(([key, summary]) => `- **${key}**: ${summary}`)
          .join("\n"),
      },
    ],
  })
);

server.tool(
  "get_quality_guide",
  "Fetch ONE quality guide section. modern-angular is version-scoped automatically.",
  {
    domain: qualityDomainSchema,
    workspaceRoot: z.string().optional(),
  },
  async ({ domain, workspaceRoot }) => {
    const ctx = detectAngularContext(resolveWorkspace(workspaceRoot));
    const text = readGuide(STANDARDS_DIR, domain as QualityDomain, ctx.profileKey);
    return { content: [{ type: "text" as const, text }] };
  }
);

server.tool(
  "explain_pattern",
  "Educational deep-dive on a topic (signals, storybook, rxjs, architecture, etc.).",
  {
    topic: z.string().describe("e.g. signals, storybook, onpush, feature scaffolding"),
    workspaceRoot: z.string().optional(),
  },
  async ({ topic, workspaceRoot }) => {
    const ctx = detectAngularContext(resolveWorkspace(workspaceRoot));
    const text = explainPattern(STANDARDS_DIR, ctx.profileKey, topic);
    return { content: [{ type: "text" as const, text }] };
  }
);

server.tool(
  "get_pr_review_brief",
  "Minimal PR review brief: review format + anti-patterns (~800 tokens).",
  {
    workspaceRoot: z.string().optional(),
  },
  async ({ workspaceRoot }) => {
    const ctx = detectAngularContext(resolveWorkspace(workspaceRoot));
    return {
      content: [{ type: "text" as const, text: buildReviewBrief(STANDARDS_DIR, ctx.profileKey) }],
    };
  }
);

server.tool(
  "get_review_sections_for_diff",
  "Return only quality sections relevant to changed file types (reduces token load).",
  {
    changedExtensions: z.array(z.string()).describe("e.g. ['.ts', '.html', '.stories.ts']"),
    workspaceRoot: z.string().optional(),
  },
  async ({ changedExtensions, workspaceRoot }) => {
    const ctx = detectAngularContext(resolveWorkspace(workspaceRoot));
    const text = buildDiffSections(
      STANDARDS_DIR,
      ctx.profileKey,
      changedExtensions,
      ctx.hasStorybook
    );
    return { content: [{ type: "text" as const, text }] };
  }
);

// ─── Review (Workflow 1: PR review) ──────────────────────────────────────

server.tool(
  "review_pr_diff",
  "PR review orchestration: changed files, extensions, and review steps.",
  {
    changedFiles: z.array(z.string()),
    workspaceRoot: z.string().optional(),
  },
  async ({ changedFiles, workspaceRoot }) => {
    const ctx = detectAngularContext(resolveWorkspace(workspaceRoot));
    const extensions = [...new Set(changedFiles.map((f) => {
      if (f.includes(".stories.")) return ".stories.ts";
      const i = f.lastIndexOf(".");
      return i >= 0 ? f.slice(i) : "";
    }))];

    const text = [
      formatContext(ctx),
      "",
      "---",
      "",
      reviewPrDiff(changedFiles, extensions),
    ].join("\n");

    return { content: [{ type: "text" as const, text }] };
  }
);

server.tool(
  "review_architecture",
  "Principal-level architecture checklist for a diff or feature path.",
  {
    changedFiles: z.array(z.string()),
    workspaceRoot: z.string().optional(),
  },
  async ({ changedFiles }) => ({
    content: [{ type: "text" as const, text: reviewArchitectureNotes(changedFiles) }],
  })
);

server.tool(
  "scan_violations",
  "Version-aware heuristic scan of Angular/Storybook source. Returns severity-rated findings.",
  {
    filePath: z.string(),
    source: z.string(),
    workspaceRoot: z.string().optional(),
  },
  async ({ filePath, source, workspaceRoot }) => {
    const root = resolveWorkspace(workspaceRoot);
    const ctx = detectAngularContext(root);
    const config = loadConfig(root);
    const violations = scanSource(source, filePath, ctx, config);
    return { content: [{ type: "text" as const, text: formatViolations(violations) }] };
  }
);

// ─── Audit (Workflow 3: Modernization) ─────────────────────────────────────

server.tool(
  "audit_modernization",
  "Scan a path for legacy patterns, migration priorities, and Storybook gaps.",
  {
    scanPath: z.string().default("src").describe("Path relative to workspace root"),
    workspaceRoot: z.string().optional(),
  },
  async ({ scanPath, workspaceRoot }) => {
    const root = resolveWorkspace(workspaceRoot);
    const ctx = detectAngularContext(root);
    const config = loadConfig(root);
    const audit = runModernizationAudit(ctx, config, scanPath);
    return { content: [{ type: "text" as const, text: formatAudit(audit) }] };
  }
);

// ─── Codegen (Workflow 2: Scaffolding) ──────────────────────────────────────

server.tool(
  "generate_component",
  "Generate presentational/smart component files following architecture standards.",
  {
    name: z.string(),
    featurePath: z.string().describe("Relative path e.g. src/app/features/users/components"),
    presentational: z.boolean().optional().default(true),
    withStory: z.boolean().optional().default(false),
  },
  async ({ name, featurePath, presentational, withStory }) => {
    const files = generateComponent({ name, featurePath, presentational, withStory });
    const text = files
      .map((f) => `## ${f.path}\n${f.description}\n\n\`\`\`typescript\n${f.content}\n\`\`\``)
      .join("\n\n");
    return {
      content: [
        {
          type: "text" as const,
          text: `# Generated Component: ${name}\n\nPreview below. Call apply_changes with confirm:true to write.\n\n${text}`,
        },
      ],
    };
  }
);

server.tool(
  "generate_feature",
  "Scaffold a feature module: container, routes, facade, models, optional Storybook.",
  {
    name: z.string(),
    basePath: z.string().default("src/app/features"),
    withStorybook: z.boolean().optional().default(true),
  },
  async ({ name, basePath, withStorybook }) => {
    const { files, structure } = generateFeature({ name, basePath, withStorybook });
    const text = [
      `# Generated Feature: ${name}`,
      "",
      "## Structure",
      "```",
      structure,
      "```",
      "",
      ...files.map(
        (f) => `## ${f.path}\n${f.description}\n\n\`\`\`typescript\n${f.content}\n\`\`\``
      ),
    ].join("\n\n");

    return {
      content: [
        {
          type: "text" as const,
          text: `${text}\n\nCall apply_changes with confirm:true to write files.`,
        },
      ],
    };
  }
);

server.tool(
  "generate_story",
  "Generate a Storybook story (autodocs + controls) for an existing component.",
  {
    componentName: z.string().describe("PascalCase class name e.g. UserCard"),
    selector: z.string().describe("Component selector e.g. app-user-card"),
    importPath: z.string().describe("Relative import e.g. ./user-card.component"),
    outputPath: z.string().optional().describe("Override story file path"),
  },
  async ({ componentName, selector, importPath, outputPath }) => {
    const story = generateStory({ componentName, selector, importPath });
    if (outputPath) story.path = outputPath;
    return {
      content: [
        {
          type: "text" as const,
          text: `# Story: ${story.path}\n\n\`\`\`typescript\n${story.content}\n\`\`\`\n\nCall apply_changes to write.`,
        },
      ],
    };
  }
);

server.tool(
  "plan_refactor",
  "Step-by-step refactor plan before applying changes.",
  {
    goal: z.string(),
    filePath: z.string(),
    violations: z.array(z.string()).describe("Issues from scan_violations or review"),
  },
  async ({ goal, filePath, violations }) => ({
    content: [{ type: "text" as const, text: planRefactor({ goal, filePath, violations }) }],
  })
);

server.tool(
  "apply_changes",
  "Write generated files to disk. Requires confirm:true. Skips existing files.",
  {
    workspaceRoot: z.string().optional(),
    files: z.array(z.object({ path: z.string(), content: z.string() })),
    confirm: z.boolean().describe("Must be true to write files"),
  },
  async ({ workspaceRoot, files, confirm }) => {
    const result = applyChanges(resolveWorkspace(workspaceRoot), files, confirm);
    return { content: [{ type: "text" as const, text: formatApplyResult(result) }] };
  }
);

// ─── Optional CLI bridge ───────────────────────────────────────────────────

server.tool(
  "run_angular_target",
  "Optional: invoke ng run/build/lint/test via CLI bridge (requires cliBridge.enabled).",
  {
    target: z.string().describe("ng target e.g. lint, test, build"),
    project: z.string().optional(),
    workspaceRoot: z.string().optional(),
  },
  async ({ target, project, workspaceRoot }) => {
    const root = resolveWorkspace(workspaceRoot);
    const config = loadConfig(root);
    const text = runAngularTarget(root, config, target, project);
    return { content: [{ type: "text" as const, text }] };
  }
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
