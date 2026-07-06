import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function resolveStandardsDir(): string {
  const envRoot = process.env.AI_MOSAIC_ROOT;
  if (envRoot && existsSync(join(envRoot, "shared"))) {
    return envRoot;
  }

  const distStandards = join(dirname(fileURLToPath(import.meta.url)), "standards");
  if (existsSync(join(distStandards, "shared"))) {
    return distStandards;
  }

  const packageStandards = join(dirname(fileURLToPath(import.meta.url)), "..", "standards");
  if (existsSync(join(packageStandards, "shared"))) {
    return packageStandards;
  }

  throw new Error("Could not locate ai-mosaic standards directory.");
}
