import { describe, expect, it } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const forbiddenTokens = [
  "@bosun-sh/ohtools",
  "/plugin/",
  "node:fs",
  "node:child_process",
  "node:http",
  "node:https",
  "openai",
];

const rootDirs = [
  "src/okrs",
  "src/kpis",
  "src/dor",
  "src/dod",
  "src/validation",
  "src/judge",
  "src/reports",
];

const walk = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
};

describe("architecture boundaries", () => {
  it("keeps the functional core free of adapter imports", async () => {
    const files = (
      await Promise.all(
        rootDirs.map(async (dir) => {
          if (dir === "src/judge") {
            const judgeFiles = await walk(dir);
            return judgeFiles.filter((file) => !file.includes("src/judge/providers/openai"));
          }

          return walk(dir);
        }),
      )
    ).flat();

    for (const file of files) {
      const contents = await readFile(file, "utf8");
      for (const token of forbiddenTokens) {
        expect(contents).not.toContain(token);
      }
    }
  });
});
