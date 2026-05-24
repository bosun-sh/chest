import { describe, expect, it } from "bun:test";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { join } from "node:path";
import { initWorkspace } from "../../src/workspace/init";

const tempRoot = join("/private/tmp", `chest-scaffold-${Date.now()}`);
const storeDir = join(tempRoot, ".chest");
const storeFiles = [
  "okrs.yaml",
  "kpis.yaml",
  "definition-of-ready.yaml",
  "definition-of-done.yaml",
].map((file) => join(storeDir, file));

describe("workspace init", () => {
  it("creates the local Chest store skeleton", async () => {
    await mkdir(tempRoot, { recursive: true });

    const result = await initWorkspace({ dir: tempRoot, force: true });
    expect(result.ok).toBeTruthy();
    if (!result.ok) {
      return;
    }

    await access(storeDir, fsConstants.W_OK);
    expect(result.data.created).toEqual(storeFiles);
    expect(result.data.skipped).toEqual([]);

    for (const file of storeFiles) {
      const contents = await readFile(file, "utf8");
      expect(contents.trim()).toBe("[]");
    }
  });

  it("refuses to overwrite an existing store without force", async () => {
    await mkdir(storeDir, { recursive: true });
    await writeFile(storeFiles[0], "[]\n", "utf8");

    const result = await initWorkspace({ dir: tempRoot });
    expect(result).toEqual({
      ok: false,
      error: {
        code: "ERR-CHEST-10",
        message: `Chest store already exists at ${storeDir}. Pass force: true to overwrite.`,
      },
    });
  });

  it("rewrites an existing store when force is set", async () => {
    await mkdir(storeDir, { recursive: true });
    await writeFile(storeFiles[0], "[{\"id\":\"stale\"}]\n", "utf8");

    const result = await initWorkspace({ dir: tempRoot, force: true });
    expect(result.ok).toBeTruthy();
    if (!result.ok) {
      return;
    }

    const contents = await readFile(storeFiles[0], "utf8");
    expect(contents.trim()).toBe("[]");
  });

  it("surfaces a write failure with the store path", async () => {
    const result = await initWorkspace({ dir: "/dev/null/cannot-create" });
    expect(result.ok).toBeFalsy();
    if (result.ok) {
      return;
    }

    expect(result.error.code).toBe("ERR-CHEST-03");
    expect(result.error.message).toContain("/dev/null/cannot-create");
  });

  it("cleans up the test store", async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });
});
