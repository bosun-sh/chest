import { describe, expect, it } from "bun:test";
import { join } from "node:path";
import { resolveChestPaths } from "../../src/workspace/storage-paths";
import { atomicWriteText } from "../../src/shared/atomic-write";
import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import { readArrayFile, writeArrayFile } from "../../src/workspace/yaml-repository";

describe("storage helpers", () => {
  it("resolves the .chest store from the workspace root", () => {
    const paths = resolveChestPaths("/workspace/project");

    expect(paths).toEqual({
      root: "/workspace/project",
      storeDir: "/workspace/project/.chest",
      reportsDir: "/workspace/project/.chest/reports",
      okrsFile: "/workspace/project/.chest/okrs.yaml",
      kpisFile: "/workspace/project/.chest/kpis.yaml",
      dorFile: "/workspace/project/.chest/definition-of-ready.yaml",
      dodFile: "/workspace/project/.chest/definition-of-done.yaml",
    });
  });

  it("respects CHEST_HOME when present", () => {
    const previous = process.env.CHEST_HOME;
    process.env.CHEST_HOME = "/tmp/custom-chest";

    try {
      const paths = resolveChestPaths("/workspace/project");
      expect(paths.storeDir).toBe("/tmp/custom-chest");
      expect(paths.okrsFile).toBe("/tmp/custom-chest/okrs.yaml");
    } finally {
      if (previous === undefined) {
        delete process.env.CHEST_HOME;
      } else {
        process.env.CHEST_HOME = previous;
      }
    }
  });

  it("writes atomically into the target file", async () => {
    const filePath = join("/private/tmp", `chest-atomic-${Date.now()}.json`);
    await atomicWriteText(filePath, "[1,2,3]\n");

    const contents = await readFile(filePath, "utf8");
    expect(contents.trim()).toBe("[1,2,3]");

    const directory = join("/private/tmp");
    const entries = await readdir(directory);
    expect(entries.some((entry) => entry.includes(".chest-") && entry.endsWith(".tmp"))).toBeFalsy();
  });

  it("round-trips an array file through the repository helper", async () => {
    const filePath = join("/private/tmp", `chest-array-${Date.now()}.yaml`);
    const records = [{ id: "okr-1", objective: "Goal", keyResults: [] }];

    await writeArrayFile(filePath, records);
    const loaded = await readArrayFile<typeof records[number]>(filePath);

    expect(loaded).toEqual(records);
  });

  it("parses handwritten YAML that is not JSON", async () => {
    const filePath = join("/private/tmp", `chest-yaml-${Date.now()}.yaml`);
    await writeFile(
      filePath,
      `- id: okr-1
  objective: Deliver chest v1 to production
  keyResults:
    - id: kr-1
      description: All specs written
      target: 30 files
- id: okr-2
  objective: Achieve agent self-governance
  keyResults:
    - id: kr-2
      description: Zero checkpoints
      target: "0"
`,
      "utf8",
    );

    const loaded = await readArrayFile<{ id: string; objective: string; keyResults: unknown[] }>(filePath);
    expect(loaded).toHaveLength(2);
    expect(loaded[0].id).toBe("okr-1");
    expect(loaded[1].objective).toBe("Achieve agent self-governance");
  });

  it("removes test files after writing", async () => {
    await rm(join("/private/tmp", `chest-atomic-${Date.now()}.json`), { force: true });
  });
});
