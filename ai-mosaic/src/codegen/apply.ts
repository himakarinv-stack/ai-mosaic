import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

export interface FileWrite {
  path: string;
  content: string;
}

export interface ApplyResult {
  applied: string[];
  skipped: string[];
  errors: string[];
}

export function applyChanges(
  workspaceRoot: string,
  files: FileWrite[],
  confirm: boolean
): ApplyResult {
  const result: ApplyResult = { applied: [], skipped: [], errors: [] };

  if (!confirm) {
    return {
      applied: [],
      skipped: files.map((f) => f.path),
      errors: ["confirm must be true to write files. Preview paths above, then re-run with confirm:true."],
    };
  }

  for (const file of files) {
    const absolute = join(workspaceRoot, file.path.replace(/^\//, ""));
    try {
      if (existsSync(absolute)) {
        result.skipped.push(`${file.path} (already exists)`);
        continue;
      }
      mkdirSync(dirname(absolute), { recursive: true });
      writeFileSync(absolute, file.content, "utf-8");
      result.applied.push(file.path);
    } catch (err) {
      result.errors.push(`${file.path}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}

export function formatApplyResult(result: ApplyResult): string {
  const lines = ["# Apply Changes Result", ""];

  if (result.applied.length) {
    lines.push("## Applied", ...result.applied.map((f) => `- ${f}`), "");
  }
  if (result.skipped.length) {
    lines.push("## Skipped", ...result.skipped.map((f) => `- ${f}`), "");
  }
  if (result.errors.length) {
    lines.push("## Errors", ...result.errors.map((e) => `- ${e}`), "");
  }

  return lines.join("\n");
}
