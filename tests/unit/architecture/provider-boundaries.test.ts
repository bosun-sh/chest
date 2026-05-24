import { describe, expect, it } from "bun:test";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

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

describe("provider boundaries", () => {
  it("keeps openai imports isolated to the openai provider adapter", async () => {
    const files = (await walk("src/judge")).filter(
      (file) => !file.includes("src/judge/providers/openai"),
    );

    for (const file of files) {
      const contents = await readFile(file, "utf8");
      expect(contents).not.toContain("openai");
    }
  });
});
