import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type SeverityMode = "strict" | "balanced" | "minimal";

export interface MosaicConfig {
  severity: SeverityMode;
  ignore: string[];
  strictRules: string[];
  storybook: {
    storiesGlob: string;
    requireAutodocs: boolean;
  };
  cliBridge: {
    enabled: boolean;
    defaultProject: string | null;
  };
}

const DEFAULT_CONFIG: MosaicConfig = {
  severity: "balanced",
  ignore: ["**/node_modules/**", "**/dist/**"],
  strictRules: [],
  storybook: {
    storiesGlob: "**/*.stories.@(ts|tsx)",
    requireAutodocs: true,
  },
  cliBridge: {
    enabled: true,
    defaultProject: null,
  },
};

export function loadConfig(workspaceRoot: string): MosaicConfig {
  const configPath = join(workspaceRoot, "ai-mosaic.config.json");
  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const raw = JSON.parse(readFileSync(configPath, "utf-8")) as Partial<MosaicConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...raw,
      storybook: { ...DEFAULT_CONFIG.storybook, ...raw.storybook },
      cliBridge: { ...DEFAULT_CONFIG.cliBridge, ...raw.cliBridge },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function explainConfig(): string {
  return `# ai-mosaic.config.json (optional)

Place this file in your Angular workspace root to tune behavior per project.
**You do not need this file** — ai-mosaic works out of the box with sensible defaults.

## Fields

| Field | Purpose | Default |
|-------|---------|---------|
| \`severity\` | \`strict\` \| \`balanced\` \| \`minimal\` — how hard findings are flagged | \`balanced\` |
| \`ignore\` | Glob patterns skipped during scans/audits | \`node_modules\`, \`dist\` |
| \`strictRules\` | Rule IDs enforced as BLOCKER even in balanced mode | \`[]\` |
| \`storybook.storiesGlob\` | Pattern for story files | \`**/*.stories.@(ts\\|tsx)\` |
| \`storybook.requireAutodocs\` | Flag stories missing autodocs meta | \`true\` |
| \`cliBridge.enabled\` | Allow \`run_angular_target\` to invoke ng CLI | \`true\` |
| \`cliBridge.defaultProject\` | Default app name for ng targets | auto-detect |

Copy \`ai-mosaic.config.example.json\` from the package to get started.`;
}
