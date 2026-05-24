import { describe, expect, it } from "bun:test";
import { access, mkdir, readFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { join } from "node:path";
import { initWorkspace } from "../../src/workspace/init";

const tempRoot = join("/private/tmp", `chest-scaffold-${Date.now()}`);

describe("workspace init", () => {
  it("creates the local Chest store skeleton", async () => {
    await mkdir(tempRoot, { recursive: true });

    const result = await initWorkspace({ dir: tempRoot, force: true });
    expect(result.ok).toBeTruthy();
    if (!result.ok) {
      return;
    }

    const storeDir = join(tempRoot, ".chest");
    await access(storeDir, fsConstants.W_OK);

    const files = [
      "okrs.yaml",
      "kpis.yaml",
      "definition-of-ready.yaml",
      "definition-of-done.yaml",
    ].map((file) => join(storeDir, file));

    for (const file of files) {
      const contents = await readFile(file, "utf8");
      expect(contents.trim()).toBe("[]");
    }
  });
});
