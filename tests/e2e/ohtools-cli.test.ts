import { describe, expect, it } from "bun:test";
import { mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const repoRoot = process.cwd();
const tempRoot = join("/private/tmp", `chest-e2e-${Date.now()}`);

describe("ohtools cli", () => {
  it("exposes the Chest registry and can initialize a store", async () => {
    await mkdir(tempRoot, { recursive: true });

    const listOutput = execFileSync(
      "bunx",
      ["ohtools", "--app", "src/ohtools.ts", "list"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );

    const listJson = JSON.parse(listOutput) as {
      ok: boolean;
      data: Array<{ id: string }>;
    };

    expect(listJson.ok).toBe(true);
    expect(listJson.data).toHaveLength(20);
    expect(listJson.data.map((tool) => tool.id)).toContain("chest.init");

    const initOutput = execFileSync(
      "bunx",
      [
        "ohtools",
        "--app",
        "src/ohtools.ts",
        "run",
        "chest.init",
        "--input",
        JSON.stringify({ dir: tempRoot }),
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );

    const initJson = JSON.parse(initOutput) as {
      ok: boolean;
      data: {
        toolId: string;
        output: {
          ok: boolean;
          data: { created: string[] };
        };
      };
    };

    expect(initJson.ok).toBe(true);
    expect(initJson.data.toolId).toBe("chest.init");
    expect(initJson.data.output.ok).toBe(true);
    expect(initJson.data.output.data.created).toHaveLength(4);
  });
});
